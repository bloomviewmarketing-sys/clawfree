import { resolve } from 'path';
import { homedir } from 'os';
import type { ClawfreeConfig } from '@clawfree/shared';

let config: ClawfreeConfig | null = null;

export function loadConfig(): ClawfreeConfig {
  config = {
    gateway: {
      port: parseInt(process.env.GATEWAY_PORT || '4000', 10),
      host: process.env.GATEWAY_HOST || '0.0.0.0',
      secret: process.env.GATEWAY_SECRET,
    },
    claude: {
      cliPath: process.env.CLAUDE_CLI_PATH || 'claude',
      timeout: parseInt(process.env.CLAUDE_TIMEOUT || '120000', 10),
      maxConcurrent: parseInt(process.env.CLAUDE_MAX_CONCURRENT || '3', 10),
    },
    supabase: process.env.SUPABASE_URL
      ? {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.SUPABASE_ANON_KEY || '',
          serviceKey: process.env.SUPABASE_SERVICE_KEY,
        }
      : undefined,
    workspace: {
      dir: resolve(process.env.WORKSPACE_DIR || './workspace'),
    },
    memory: {
      dir: resolve(process.env.MEMORY_DIR || `${homedir()}/.clawfree/memory`),
      syncEnabled: process.env.MEMORY_SYNC !== 'false' && !!process.env.SUPABASE_URL,
    },
    channels: [],
  };

  return config;
}

export function getConfig(): ClawfreeConfig {
  if (!config) return loadConfig();
  return config;
}
