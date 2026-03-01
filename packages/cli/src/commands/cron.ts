import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export const cronCommand = new Command('cron')
  .description('Manage scheduled tasks');

cronCommand
  .command('list')
  .description('List cron jobs')
  .action(async () => {
    const spinner = ora('Loading cron jobs...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/cron`);
      const json = await res.json();
      spinner.stop();

      if (json.data.length === 0) {
        console.log(chalk.dim('  No cron jobs'));
        return;
      }

      for (const job of json.data) {
        const status = job.status === 'active'
          ? chalk.green('active')
          : chalk.yellow('paused');
        console.log(`  ${chalk.bold(job.name)} [${status}]`);
        console.log(chalk.dim(`    Schedule: ${job.schedule}`));
        console.log(chalk.dim(`    Prompt: ${job.prompt.slice(0, 80)}${job.prompt.length > 80 ? '...' : ''}`));
        if (job.lastRunAt) console.log(chalk.dim(`    Last run: ${job.lastRunAt}`));
        if (job.nextRunAt) console.log(chalk.dim(`    Next run: ${job.nextRunAt}`));
        console.log();
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed to list cron jobs'));
    }
  });

cronCommand
  .command('add')
  .description('Add a cron job')
  .requiredOption('-n, --name <name>', 'Job name')
  .requiredOption('-s, --schedule <schedule>', 'Cron schedule expression')
  .requiredOption('-p, --prompt <prompt>', 'Prompt to run')
  .action(async (options) => {
    const spinner = ora('Creating cron job...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/cron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: options.name,
          schedule: options.schedule,
          prompt: options.prompt,
        }),
      });
      const json = await res.json();
      spinner.succeed(chalk.green(`Created: ${json.data.name} (${json.data.schedule})`));
    } catch (err) {
      spinner.fail(chalk.red('Failed to create cron job'));
    }
  });

cronCommand
  .command('remove <id>')
  .description('Remove a cron job')
  .action(async (id: string) => {
    const spinner = ora('Removing cron job...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/cron/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        spinner.succeed(chalk.green('Cron job removed'));
      } else {
        spinner.fail(chalk.red(json.error || 'Failed'));
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed to remove cron job'));
    }
  });
