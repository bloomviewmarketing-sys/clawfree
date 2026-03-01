import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import type { WsEvent, ApiResponse } from '@clawfree/shared';
import {
  sendMessageSchema,
  createSessionSchema,
  createCronJobSchema,
  updateCronJobSchema,
  addMemorySchema,
  searchMemorySchema,
  installSkillSchema,
} from '@clawfree/shared';
import { AgentLoop } from '../agent/loop.js';
import { MemoryManager } from '../memory/index.js';
import { SkillLoader } from '../skills/index.js';
import { Scheduler } from '../scheduler/index.js';
import { listTools, getExecutions } from '../tools/index.js';
import { getAuditLog, getPermissionRules } from '../security/index.js';
import { getConfig } from '../config/index.js';

export async function createServer() {
  const config = getConfig();
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  const agentLoop = new AgentLoop();
  const memoryManager = new MemoryManager();
  const skillLoader = new SkillLoader();
  const scheduler = new Scheduler(agentLoop);

  // Load skills on startup
  await skillLoader.load();
  await memoryManager.load();

  // WebSocket connections
  const wsClients = new Set<WebSocket>();

  agentLoop.on('ws', (event: WsEvent) => {
    const data = JSON.stringify(event);
    for (const client of wsClients) {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    }
  });

  // --- WebSocket route ---
  app.get('/ws', { websocket: true }, (socket) => {
    wsClients.add(socket);
    socket.on('close', () => wsClients.delete(socket));

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'message' && msg.content) {
          await agentLoop.processMessage(msg.content, {
            sessionId: msg.sessionId,
            channel: 'web',
          });
        }
      } catch (err) {
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: err instanceof Error ? err.message : 'Unknown error' },
          timestamp: new Date().toISOString(),
        }));
      }
    });
  });

  // --- Health ---
  app.get('/health', async (): Promise<ApiResponse> => {
    return {
      success: true,
      data: {
        status: 'healthy',
        version: '0.1.0',
        uptime: process.uptime(),
        activeSessions: agentLoop.getSessions().length,
        supabaseConnected: !!config.supabase,
      },
    };
  });

  // --- Sessions ---
  app.get('/api/sessions', async (): Promise<ApiResponse> => {
    return { success: true, data: agentLoop.getSessions() };
  });

  app.post('/api/sessions', async (req): Promise<ApiResponse> => {
    const body = createSessionSchema.parse(req.body);
    const msg = await agentLoop.processMessage('Start a new session', {
      channel: body.channel,
    });
    return { success: true, data: { sessionId: msg.sessionId } };
  });

  app.get<{ Params: { id: string } }>('/api/sessions/:id', async (req): Promise<ApiResponse> => {
    const session = agentLoop.getSession(req.params.id);
    if (!session) return { success: false, error: 'Session not found' };
    return { success: true, data: session };
  });

  app.get<{ Params: { id: string } }>('/api/sessions/:id/messages', async (req): Promise<ApiResponse> => {
    return { success: true, data: agentLoop.getMessages(req.params.id) };
  });

  app.delete<{ Params: { id: string } }>('/api/sessions/:id', async (req): Promise<ApiResponse> => {
    agentLoop.deleteSession(req.params.id);
    return { success: true };
  });

  // --- Messages ---
  app.post('/api/messages', async (req): Promise<ApiResponse> => {
    const body = sendMessageSchema.parse(req.body);
    const response = await agentLoop.processMessage(body.message, {
      sessionId: body.sessionId,
      channel: body.channel,
    });
    return { success: true, data: response };
  });

  // --- Memory ---
  app.get('/api/memory', async (): Promise<ApiResponse> => {
    return { success: true, data: await memoryManager.getAll() };
  });

  app.post('/api/memory', async (req): Promise<ApiResponse> => {
    const body = addMemorySchema.parse(req.body);
    const entry = await memoryManager.add(body.content, {
      type: body.type,
      tags: body.tags,
      pinned: body.pinned,
    });
    return { success: true, data: entry };
  });

  app.post('/api/memory/search', async (req): Promise<ApiResponse> => {
    const body = searchMemorySchema.parse(req.body);
    const results = await memoryManager.search(body.query, body.limit);
    return { success: true, data: results };
  });

  app.get<{ Params: { id: string } }>('/api/memory/:id', async (req): Promise<ApiResponse> => {
    const entry = await memoryManager.get(req.params.id);
    if (!entry) return { success: false, error: 'Memory not found' };
    return { success: true, data: entry };
  });

  app.patch<{ Params: { id: string } }>('/api/memory/:id', async (req): Promise<ApiResponse> => {
    const updated = await memoryManager.update(req.params.id, req.body as Record<string, unknown>);
    if (!updated) return { success: false, error: 'Memory not found' };
    return { success: true, data: updated };
  });

  app.delete<{ Params: { id: string } }>('/api/memory/:id', async (req): Promise<ApiResponse> => {
    const deleted = await memoryManager.delete(req.params.id);
    if (!deleted) return { success: false, error: 'Memory not found' };
    return { success: true };
  });

  // --- Skills ---
  app.get('/api/skills', async (): Promise<ApiResponse> => {
    return { success: true, data: skillLoader.list() };
  });

  app.post('/api/skills', async (req): Promise<ApiResponse> => {
    const body = installSkillSchema.parse(req.body);
    let skill;
    if (body.url) {
      skill = await skillLoader.installFromUrl(body.url);
    } else {
      skill = await skillLoader.install(body.content!);
    }
    return { success: true, data: skill };
  });

  app.delete<{ Params: { name: string } }>('/api/skills/:name', async (req): Promise<ApiResponse> => {
    const removed = await skillLoader.remove(decodeURIComponent(req.params.name));
    if (!removed) return { success: false, error: 'Skill not found' };
    return { success: true };
  });

  // --- Cron ---
  app.get('/api/cron', async (): Promise<ApiResponse> => {
    return { success: true, data: scheduler.listJobs() };
  });

  app.post('/api/cron', async (req): Promise<ApiResponse> => {
    const body = createCronJobSchema.parse(req.body);
    const job = scheduler.addJob(body);
    return { success: true, data: job };
  });

  app.get<{ Params: { id: string } }>('/api/cron/:id', async (req): Promise<ApiResponse> => {
    const job = scheduler.getJob(req.params.id);
    if (!job) return { success: false, error: 'Cron job not found' };
    return { success: true, data: job };
  });

  app.patch<{ Params: { id: string } }>('/api/cron/:id', async (req): Promise<ApiResponse> => {
    const body = updateCronJobSchema.parse(req.body);
    if (body.status === 'active') scheduler.resumeJob(req.params.id);
    if (body.status === 'paused') scheduler.pauseJob(req.params.id);
    const job = scheduler.getJob(req.params.id);
    return { success: true, data: job };
  });

  app.delete<{ Params: { id: string } }>('/api/cron/:id', async (req): Promise<ApiResponse> => {
    const removed = scheduler.removeJob(req.params.id);
    if (!removed) return { success: false, error: 'Cron job not found' };
    return { success: true };
  });

  app.get<{ Params: { id: string } }>('/api/cron/:id/executions', async (req): Promise<ApiResponse> => {
    return { success: true, data: scheduler.getExecutions(req.params.id) };
  });

  // --- Tools ---
  app.get('/api/tools', async (): Promise<ApiResponse> => {
    return { success: true, data: listTools() };
  });

  app.get('/api/tools/executions', async (): Promise<ApiResponse> => {
    return { success: true, data: getExecutions() };
  });

  // --- Audit ---
  app.get('/api/audit', async (req): Promise<ApiResponse> => {
    const query = req.query as Record<string, string>;
    return {
      success: true,
      data: getAuditLog({
        limit: parseInt(query.limit || '100'),
        toolName: query.tool,
        status: query.status,
        sessionId: query.sessionId,
      }),
    };
  });

  // --- Permissions ---
  app.get('/api/permissions', async (): Promise<ApiResponse> => {
    return { success: true, data: getPermissionRules() };
  });

  return { app, agentLoop, scheduler };
}
