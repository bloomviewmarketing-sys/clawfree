import { execSync } from 'child_process';
import { platform } from 'os';

interface ClaudeCliResult {
  found: boolean;
  path?: string;
  version?: string;
}

export function findClaudeCli(): ClaudeCliResult {
  const whichCmd = platform() === 'win32' ? 'where claude' : 'which claude';

  try {
    const cliPath = execSync(whichCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim().split('\n')[0].trim();

    let version: string | undefined;
    try {
      version = execSync('claude --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      // Version check failed but CLI exists
    }

    return { found: true, path: cliPath, version };
  } catch {
    return { found: false };
  }
}
