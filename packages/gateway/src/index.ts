import 'dotenv/config';
import { loadConfig } from './config/index.js';
import { createServer } from './server/index.js';
import { killAllProcesses } from './agent/claude-runner.js';
import { closeBrowser } from './tools/index.js';

async function main() {
  const config = loadConfig();
  const { app, scheduler } = await createServer();

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    scheduler.stopAll();
    killAllProcesses();
    await closeBrowser();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: config.gateway.port, host: config.gateway.host });
    console.log(`ClawFree Gateway running on http://${config.gateway.host}:${config.gateway.port}`);
  } catch (err) {
    console.error('Failed to start gateway:', err);
    process.exit(1);
  }
}

if (process.env.CLAWFREE_STANDALONE === 'true') main();

export { createServer } from './server/index.js';
export { loadConfig } from './config/index.js';
export { AgentLoop } from './agent/loop.js';
export { ClaudeRunner, killAllProcesses } from './agent/claude-runner.js';
export { MemoryManager } from './memory/index.js';
export { SkillLoader } from './skills/index.js';
export { Scheduler } from './scheduler/index.js';
export { closeBrowser } from './tools/index.js';
