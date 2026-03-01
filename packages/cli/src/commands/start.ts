import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { resolve } from 'path';

export const startCommand = new Command('start')
  .description('Start the ClawFree gateway daemon')
  .option('-p, --port <port>', 'Port to listen on', '4000')
  .option('--foreground', 'Run in foreground (don\'t daemonize)')
  .action(async (options) => {
    const spinner = ora('Starting ClawFree gateway...').start();

    try {
      const env = { ...process.env, GATEWAY_PORT: options.port };

      if (options.foreground) {
        spinner.succeed(chalk.green('Gateway starting in foreground mode'));
        const proc = spawn('npx', ['tsx', resolve(process.cwd(), 'packages/gateway/src/index.ts')], {
          env,
          stdio: 'inherit',
          shell: true,
        });
        proc.on('exit', (code) => process.exit(code || 0));
      } else {
        const proc = spawn('npx', ['tsx', resolve(process.cwd(), 'packages/gateway/src/index.ts')], {
          env,
          stdio: 'ignore',
          detached: true,
          shell: true,
        });
        proc.unref();
        spinner.succeed(chalk.green(`Gateway started on port ${options.port} (PID: ${proc.pid})`));
      }
    } catch (err) {
      spinner.fail(chalk.red(`Failed to start: ${err instanceof Error ? err.message : err}`));
      process.exit(1);
    }
  });
