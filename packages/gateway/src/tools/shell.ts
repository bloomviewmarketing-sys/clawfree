import { exec } from 'child_process';
import { registerTool } from './registry.js';
import { getConfig } from '../config/index.js';

registerTool(
  {
    name: 'shell',
    description: 'Execute a shell command and return its output',
    parameters: {
      command: { type: 'string', description: 'The shell command to execute' },
      cwd: { type: 'string', description: 'Working directory (optional)' },
      timeout: { type: 'number', description: 'Timeout in ms (default 30000)' },
    },
    requiresApproval: true,
    timeout: 30000,
  },
  async (args) => {
    const config = getConfig();
    const command = args.command as string;
    const cwd = (args.cwd as string) || config.workspace.dir;
    const timeout = (args.timeout as number) || 30000;

    return new Promise<string>((resolve, reject) => {
      exec(command, { cwd, timeout, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) {
          resolve(`Error: ${err.message}\nStderr: ${stderr}\nStdout: ${stdout}`);
          return;
        }
        resolve(stdout + (stderr ? `\nStderr: ${stderr}` : ''));
      });
    });
  }
);
