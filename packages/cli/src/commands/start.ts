import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';
import { platform } from 'os';

const BANNER = `
   _____ _               ______
  / ____| |             |  ____|
 | |    | | __ ___      | |__ _ __ ___  ___
 | |    | |/ _\` \\ \\ /\\ / /  _| '__/ _ \\/ _ \\
 | |____| | (_| |\\ V  V /| | | | |  __/  __/
  \\_____|_|\\__,_| \\_/\\_/ |_| |_|  \\___|\\___|
`;

function openBrowser(url: string): void {
  const os = platform();
  try {
    if (os === 'win32') {
      spawn('cmd', ['/c', 'start', url], { shell: true, stdio: 'ignore' });
    } else if (os === 'darwin') {
      spawn('open', [url], { stdio: 'ignore' });
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore' });
    }
  } catch {
    // Silently fail if browser can't be opened
  }
}

function waitForReady(proc: ChildProcess, label: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(); // Don't block forever — resolve anyway after timeout
    }, timeoutMs);

    const onData = (data: Buffer) => {
      const output = data.toString();
      // Next.js and gateway both print ready messages containing "ready" or the port
      if (output.toLowerCase().includes('ready') || output.toLowerCase().includes('listening') || output.toLowerCase().includes('started')) {
        clearTimeout(timeout);
        resolve();
      }
    };

    if (proc.stdout) proc.stdout.on('data', onData);
    if (proc.stderr) proc.stderr.on('data', onData);

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`${label} failed to start: ${err.message}`));
    });

    proc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`${label} exited with code ${code}`));
      }
    });
  });
}

export const startCommand = new Command('start')
  .description('Start the ClawFree gateway and dashboard')
  .option('-p, --port <port>', 'Gateway port', '4000')
  .option('--dashboard-port <port>', 'Dashboard port', '3000')
  .option('--no-dashboard', 'Skip launching the dashboard')
  .option('--no-open', 'Skip auto-opening the browser')
  .option('--dev', 'Use next dev instead of next start for the dashboard')
  .option('--foreground', 'Run in foreground (don\'t daemonize)')
  .action(async (options) => {
    const gatewayPort = options.port;
    const dashboardPort = options.dashboardPort;
    const childProcesses: ChildProcess[] = [];

    // Print banner
    console.log(chalk.cyan(BANNER));

    // --- Start Gateway ---
    const gatewaySpinner = ora('Starting gateway...').start();

    try {
      const gatewayEnv = { ...process.env, GATEWAY_PORT: gatewayPort };
      const gatewayPath = resolve(process.cwd(), 'packages/gateway/src/index.ts');

      const gatewayProc = spawn('npx', ['tsx', gatewayPath], {
        env: gatewayEnv,
        stdio: options.foreground ? ['inherit', 'pipe', 'pipe'] : 'pipe',
        shell: true,
      });

      childProcesses.push(gatewayProc);

      // Pipe output in foreground mode
      if (options.foreground) {
        gatewayProc.stdout?.pipe(process.stdout);
        gatewayProc.stderr?.pipe(process.stderr);
      }

      await waitForReady(gatewayProc, 'Gateway');
      gatewaySpinner.succeed(chalk.green(`Gateway running on port ${gatewayPort}`));
    } catch (err) {
      gatewaySpinner.fail(chalk.red(`Gateway failed: ${err instanceof Error ? err.message : err}`));
      cleanup(childProcesses);
      process.exit(1);
    }

    // --- Start Dashboard ---
    if (options.dashboard) {
      const dashboardSpinner = ora('Starting dashboard...').start();

      try {
        const dashboardDir = resolve(process.cwd(), 'packages/dashboard');
        const nextCmd = options.dev ? 'dev' : 'start';
        const dashboardEnv = {
          ...process.env,
          NEXT_PUBLIC_GATEWAY_URL: `http://localhost:${gatewayPort}`,
          NEXT_PUBLIC_LOCAL_MODE: 'true',
          PORT: dashboardPort,
        };

        const dashboardProc = spawn('npx', ['next', nextCmd, '-p', dashboardPort], {
          env: dashboardEnv,
          cwd: dashboardDir,
          stdio: options.foreground ? ['inherit', 'pipe', 'pipe'] : 'pipe',
          shell: true,
        });

        childProcesses.push(dashboardProc);

        if (options.foreground) {
          dashboardProc.stdout?.pipe(process.stdout);
          dashboardProc.stderr?.pipe(process.stderr);
        }

        await waitForReady(dashboardProc, 'Dashboard');
        dashboardSpinner.succeed(chalk.green(`Dashboard running on port ${dashboardPort}`));
      } catch (err) {
        dashboardSpinner.fail(chalk.red(`Dashboard failed: ${err instanceof Error ? err.message : err}`));
        cleanup(childProcesses);
        process.exit(1);
      }
    }

    // --- Print status ---
    console.log('');
    console.log(chalk.bold('  Services:'));
    console.log(`  ${chalk.gray('Gateway:')}   ${chalk.cyan(`http://localhost:${gatewayPort}`)}`);
    if (options.dashboard) {
      console.log(`  ${chalk.gray('Dashboard:')} ${chalk.cyan(`http://localhost:${dashboardPort}/chat`)}`);
    }
    console.log('');
    console.log(chalk.gray('  Press Ctrl+C to stop'));
    console.log('');

    // --- Auto-open browser ---
    if (options.dashboard && options.open) {
      openBrowser(`http://localhost:${dashboardPort}/chat`);
    }

    // --- Graceful shutdown ---
    const shutdown = () => {
      console.log('');
      const shutdownSpinner = ora('Shutting down...').start();
      cleanup(childProcesses);
      shutdownSpinner.succeed(chalk.green('All services stopped'));
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep the process alive
    await new Promise(() => {});
  });

function cleanup(processes: ChildProcess[]): void {
  for (const proc of processes) {
    try {
      if (proc.pid && !proc.killed) {
        // On Windows, use taskkill to kill the process tree
        if (platform() === 'win32') {
          spawn('taskkill', ['/pid', proc.pid.toString(), '/T', '/F'], {
            stdio: 'ignore',
            shell: true,
          });
        } else {
          process.kill(-proc.pid, 'SIGTERM');
        }
      }
    } catch {
      // Process may already be dead
    }
  }
}
