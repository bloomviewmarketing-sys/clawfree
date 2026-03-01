import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export const runCommand = new Command('run')
  .description('Run a single prompt and exit')
  .argument('<prompt>', 'The prompt to send')
  .option('--json', 'Output raw JSON response')
  .action(async (prompt: string, options) => {
    const spinner = ora('Processing...').start();

    try {
      const response = await fetch(`${GATEWAY_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, channel: 'cli' }),
      });

      const json = await response.json();
      spinner.stop();

      if (!json.success) {
        console.error(chalk.red('Error: ' + (json.error || 'Unknown error')));
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(json.data, null, 2));
      } else {
        console.log(json.data.content);
      }
    } catch (err) {
      spinner.fail(chalk.red(err instanceof Error ? err.message : 'Failed to connect to gateway'));
      process.exit(1);
    }
  });
