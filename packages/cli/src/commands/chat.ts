import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

async function sendMessage(message: string, sessionId?: string): Promise<{ content: string; sessionId: string }> {
  const response = await fetch(`${GATEWAY_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, channel: 'cli' }),
  });

  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return { content: json.data.content, sessionId: json.data.sessionId };
}

export const chatCommand = new Command('chat')
  .description('Start an interactive chat session')
  .argument('[message]', 'Initial message (starts interactive mode if omitted)')
  .action(async (initialMessage?: string) => {
    console.log(chalk.cyan.bold('\n  ClawFree Chat'));
    console.log(chalk.dim('  Type "exit" or Ctrl+C to quit\n'));

    let sessionId: string | undefined;

    if (initialMessage) {
      const spinner = ora('Thinking...').start();
      try {
        const result = await sendMessage(initialMessage, sessionId);
        sessionId = result.sessionId;
        spinner.stop();
        console.log(chalk.green('  Assistant: ') + result.content + '\n');
      } catch (err) {
        spinner.fail(chalk.red(err instanceof Error ? err.message : 'Error'));
      }
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    const prompt = () => {
      rl.question(chalk.blue('  You: '), async (input) => {
        const trimmed = input.trim();
        if (!trimmed || trimmed === 'exit') {
          console.log(chalk.dim('\n  Goodbye!\n'));
          rl.close();
          return;
        }

        const spinner = ora('Thinking...').start();
        try {
          const result = await sendMessage(trimmed, sessionId);
          sessionId = result.sessionId;
          spinner.stop();
          console.log(chalk.green('  Assistant: ') + result.content + '\n');
        } catch (err) {
          spinner.fail(chalk.red(err instanceof Error ? err.message : 'Error'));
        }

        prompt();
      });
    };

    prompt();
  });
