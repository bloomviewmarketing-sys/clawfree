import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export const statusCommand = new Command('status')
  .description('Check gateway health')
  .action(async () => {
    const spinner = ora('Checking gateway...').start();

    try {
      const res = await fetch(`${GATEWAY_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();

      if (!json.success) {
        spinner.fail(chalk.red('Gateway returned error'));
        return;
      }

      const data = json.data;
      spinner.stop();

      console.log(chalk.cyan.bold('\n  ClawFree Gateway Status\n'));

      const statusColor = data.status === 'healthy' ? chalk.green : chalk.yellow;
      console.log(`  Status:          ${statusColor(data.status)}`);
      console.log(`  Version:         ${data.version}`);
      console.log(`  Uptime:          ${formatUptime(data.uptime)}`);
      console.log(`  Active Sessions: ${data.activeSessions}`);
      console.log(`  Supabase:        ${data.supabaseConnected ? chalk.green('connected') : chalk.dim('not configured')}`);
      console.log();
    } catch (err) {
      spinner.fail(chalk.red('Gateway is not running'));
      console.log(chalk.dim(`  Expected at: ${GATEWAY_URL}`));
      console.log(chalk.dim('  Start with: clawfree start\n'));
    }
  });

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
