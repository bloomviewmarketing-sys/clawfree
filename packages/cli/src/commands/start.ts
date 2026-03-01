import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

const BANNER = `
   _____ _               ______
  / ____| |             |  ____|
 | |    | | __ ___      | |__ _ __ ___  ___
 | |    | |/ _\` \\ \\ /\\ / /  _| '__/ _ \\/ _ \\
 | |____| | (_| |\\ V  V /| | | | |  __/  __/
  \\_____|_|\\__,_| \\_/\\_/ |_| |_|  \\___|\\___|
`;

export const startCommand = new Command('start')
  .description('Start the ClawFree gateway')
  .option('-p, --port <port>', 'Gateway port', '4000')
  .option('--host <host>', 'Gateway host', '0.0.0.0')
  .action(async (options) => {
    console.log(chalk.cyan(BANNER));

    // Load dotenv from ~/.clawfree/.env if it exists
    const envPath = resolve(homedir(), '.clawfree', '.env');
    if (existsSync(envPath)) {
      const dotenv = await import('dotenv');
      dotenv.config({ path: envPath });
    }

    // Set port/host from CLI flags (override .env)
    process.env.GATEWAY_PORT = options.port;
    process.env.GATEWAY_HOST = options.host;

    const spinner = ora('Starting gateway...').start();

    try {
      // Import gateway in-process (bundled by tsup)
      const { loadConfig, createServer, killAllProcesses, closeBrowser } = await import('@clawfree/gateway');

      loadConfig();
      const { app, scheduler } = await createServer();

      // Graceful shutdown
      const shutdown = async () => {
        console.log('');
        const shutdownSpinner = ora('Shutting down...').start();
        try {
          scheduler.stopAll();
          killAllProcesses();
          await closeBrowser();
          await app.close();
        } catch {
          // Best-effort cleanup
        }
        shutdownSpinner.succeed(chalk.green('All services stopped'));
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      const port = parseInt(options.port, 10);
      await app.listen({ port, host: options.host });

      spinner.succeed(chalk.green(`Gateway running on port ${port}`));

      console.log('');
      console.log(chalk.bold('  Services:'));
      console.log(`  ${chalk.gray('Gateway:')}    ${chalk.cyan(`http://localhost:${port}`)}`);
      console.log(`  ${chalk.gray('Dashboard:')}  ${chalk.cyan('https://clawfree.dev')}`);
      console.log('');
      console.log(chalk.gray('  Press Ctrl+C to stop'));
      console.log('');

      // Keep the process alive
      await new Promise(() => {});
    } catch (err) {
      spinner.fail(chalk.red(`Gateway failed to start: ${err instanceof Error ? err.message : err}`));

      // Check common issues
      const envExists = existsSync(envPath);
      if (!envExists) {
        console.log('');
        console.log(chalk.yellow('  No config found. Run `clawfree onboard` first.'));
      }

      process.exit(1);
    }
  });
