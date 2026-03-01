import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export const skillCommand = new Command('skill')
  .description('Manage skills');

skillCommand
  .command('list')
  .description('List installed skills')
  .action(async () => {
    const spinner = ora('Loading skills...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/skills`);
      const json = await res.json();
      spinner.stop();

      if (json.data.length === 0) {
        console.log(chalk.dim('  No skills installed'));
        return;
      }

      for (const skill of json.data) {
        console.log(chalk.bold(`  ${skill.name}`) + chalk.dim(` v${skill.version}`));
        console.log(chalk.dim(`    ${skill.description}`));
        console.log(chalk.dim(`    Triggers: ${skill.triggers.join(', ')}\n`));
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed to list skills'));
    }
  });

skillCommand
  .command('install <url>')
  .description('Install a skill from URL')
  .action(async (url: string) => {
    const spinner = ora('Installing skill...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      spinner.succeed(chalk.green(`Installed: ${json.data.name}`));
    } catch (err) {
      spinner.fail(chalk.red('Failed to install skill'));
    }
  });

skillCommand
  .command('remove <name>')
  .description('Remove an installed skill')
  .action(async (name: string) => {
    const spinner = ora('Removing skill...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/skills/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        spinner.succeed(chalk.green(`Removed: ${name}`));
      } else {
        spinner.fail(chalk.red(json.error || 'Failed to remove'));
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed to remove skill'));
    }
  });
