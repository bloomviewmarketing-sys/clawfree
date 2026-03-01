import { z } from 'zod';

// SOUL.md schema
export const soulMdSchema = z.object({
  name: z.string().min(1),
  identity: z.string().optional(),
  instructions: z.string(),
  personality: z.string().optional(),
  constraints: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  examples: z.array(z.object({
    user: z.string(),
    assistant: z.string(),
  })).default([]),
});
export type SoulMd = z.infer<typeof soulMdSchema>;

// SKILL.md schema (ClawHub compatible)
export const skillMdSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  version: z.string().default('1.0.0'),
  author: z.string().default('unknown'),
  triggers: z.array(z.string()).min(1),
  instructions: z.string(),
  tools: z.array(z.string()).default([]),
  examples: z.array(z.object({
    trigger: z.string(),
    response: z.string(),
  })).default([]),
});
export type SkillMd = z.infer<typeof skillMdSchema>;

// API request schemas
export const sendMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1),
  channel: z.enum(['web', 'cli', 'telegram', 'slack', 'discord', 'api']).default('api'),
});

export const createSessionSchema = z.object({
  title: z.string().optional(),
  channel: z.enum(['web', 'cli', 'telegram', 'slack', 'discord', 'api']).default('api'),
  metadata: z.record(z.unknown()).optional(),
});

export const createCronJobSchema = z.object({
  name: z.string().min(1),
  schedule: z.string().min(1),
  prompt: z.string().min(1),
});

export const updateCronJobSchema = z.object({
  name: z.string().min(1).optional(),
  schedule: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  status: z.enum(['active', 'paused']).optional(),
});

export const addMemorySchema = z.object({
  content: z.string().min(1),
  type: z.enum(['fact', 'preference', 'procedure', 'context', 'skill']).default('fact'),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
});

export const searchMemorySchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(10),
  type: z.enum(['fact', 'preference', 'procedure', 'context', 'skill']).optional(),
  tags: z.array(z.string()).optional(),
});

export const installSkillSchema = z.object({
  url: z.string().url().optional(),
  content: z.string().optional(),
}).refine(data => data.url || data.content, { message: 'Either url or content is required' });
