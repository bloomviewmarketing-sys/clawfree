import { Command } from 'commander';
import { startCommand } from './commands/start.js';
import { chatCommand } from './commands/chat.js';
import { runCommand } from './commands/run.js';
import { skillCommand } from './commands/skill.js';
import { cronCommand } from './commands/cron.js';
import { memoryCommand } from './commands/memory.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('clawfree')
  .description('ClawFree — Open-source AI agent platform')
  .version('0.1.0');

program.addCommand(startCommand);
program.addCommand(chatCommand);
program.addCommand(runCommand);
program.addCommand(skillCommand);
program.addCommand(cronCommand);
program.addCommand(memoryCommand);
program.addCommand(statusCommand);

program.parse();
