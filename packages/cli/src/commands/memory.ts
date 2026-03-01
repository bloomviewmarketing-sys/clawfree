import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export const memoryCommand = new Command('memory')
  .description('Manage agent memory');

memoryCommand
  .command('search <query>')
  .description('Search memories')
  .option('-l, --limit <n>', 'Max results', '10')
  .action(async (query: string, options) => {
    const spinner = ora('Searching...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: parseInt(options.limit) }),
      });
      const json = await res.json();
      spinner.stop();

      if (json.data.length === 0) {
        console.log(chalk.dim('  No memories found'));
        return;
      }

      for (const entry of json.data) {
        const pin = entry.pinned ? chalk.yellow(' [pinned]') : '';
        console.log(`  ${chalk.bold(entry.type)}${pin} ${chalk.dim(entry.id.slice(0, 8))}`);
        console.log(`    ${entry.content.slice(0, 120)}${entry.content.length > 120 ? '...' : ''}`);
        if (entry.tags.length) console.log(chalk.dim(`    Tags: ${entry.tags.join(', ')}`));
        console.log();
      }
    } catch (err) {
      spinner.fail(chalk.red('Search failed'));
    }
  });

memoryCommand
  .command('add <content>')
  .description('Add a memory')
  .option('-t, --type <type>', 'Memory type', 'fact')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--pinned', 'Pin this memory')
  .action(async (content: string, options) => {
    const spinner = ora('Adding memory...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: options.type,
          tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [],
          pinned: options.pinned || false,
        }),
      });
      const json = await res.json();
      spinner.succeed(chalk.green(`Memory added: ${json.data.id.slice(0, 8)}`));
    } catch (err) {
      spinner.fail(chalk.red('Failed to add memory'));
    }
  });

memoryCommand
  .command('list')
  .description('List all memories')
  .action(async () => {
    const spinner = ora('Loading memories...').start();
    try {
      const res = await fetch(`${GATEWAY_URL}/api/memory`);
      const json = await res.json();
      spinner.stop();

      console.log(chalk.dim(`  ${json.data.length} memories\n`));
      for (const entry of json.data.slice(-20)) {
        const pin = entry.pinned ? chalk.yellow(' [pinned]') : '';
        console.log(`  ${chalk.bold(entry.type)}${pin} ${entry.content.slice(0, 80)}${entry.content.length > 80 ? '...' : ''}`);
      }
    } catch (err) {
      spinner.fail(chalk.red('Failed to list memories'));
    }
  });
