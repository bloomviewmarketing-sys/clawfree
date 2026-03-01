// Agent
export interface Agent {
  id: string;
  name: string;
  soulMd: string;
  workspaceDir: string;
  createdAt: string;
  updatedAt: string;
}

// Session
export type SessionStatus = 'active' | 'completed' | 'error';
export interface Session {
  id: string;
  agentId: string;
  userId?: string;
  channel: ChannelType;
  status: SessionStatus;
  title?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Message
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokens?: { input: number; output: number };
  createdAt: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
  durationMs: number;
}

// Memory
export type MemoryType = 'fact' | 'preference' | 'procedure' | 'context' | 'skill';
export interface MemoryEntry {
  id: string;
  userId?: string;
  type: MemoryType;
  content: string;
  tags: string[];
  embedding?: number[];
  pinned: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// Tool
export type ToolStatus = 'success' | 'error' | 'denied' | 'timeout';
export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  requiresApproval: boolean;
  timeout?: number;
}

export interface ToolExecution {
  id: string;
  sessionId: string;
  messageId: string;
  toolName: string;
  args: Record<string, unknown>;
  output?: string;
  error?: string;
  status: ToolStatus;
  durationMs: number;
  approvedBy?: string;
  createdAt: string;
}

// Skill
export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  triggers: string[];
  instructions: string;
  tools?: string[];
  sourceUrl?: string;
  installedAt?: string;
}

// Cron
export type CronStatus = 'active' | 'paused' | 'error';
export type CronExecutionStatus = 'running' | 'success' | 'error';
export interface CronJob {
  id: string;
  userId?: string;
  name: string;
  schedule: string;
  prompt: string;
  status: CronStatus;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CronExecution {
  id: string;
  cronJobId: string;
  sessionId?: string;
  status: CronExecutionStatus;
  output?: string;
  error?: string;
  durationMs?: number;
  startedAt: string;
  completedAt?: string;
}

// Channel
export type ChannelType = 'web' | 'cli' | 'telegram' | 'slack' | 'discord' | 'api';
export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  config: Record<string, unknown>;
}

// Metrics
export interface DailyMetrics {
  id: string;
  userId?: string;
  date: string;
  sessionsCount: number;
  messagesCount: number;
  toolCallsCount: number;
  tokensInput: number;
  tokensOutput: number;
  errorsCount: number;
  avgResponseMs: number;
}

// Gateway
export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  activeSessions: number;
  supabaseConnected: boolean;
}

// Claude CLI
export interface ClaudeStreamEvent {
  type: 'assistant' | 'tool_use' | 'tool_result' | 'error' | 'result';
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  output?: string;
  error?: string;
}

// WebSocket
export type WsEventType = 'message' | 'tool_call' | 'tool_result' | 'stream' | 'error' | 'done';
export interface WsEvent {
  type: WsEventType;
  sessionId: string;
  data: unknown;
  timestamp: string;
}

// API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { total?: number; page?: number; limit?: number };
}

// Config
export interface ClawfreeConfig {
  gateway: { port: number; host: string; secret?: string };
  claude: { cliPath: string; timeout: number; maxConcurrent: number };
  supabase?: { url: string; anonKey: string; serviceKey?: string };
  workspace: { dir: string };
  memory: { dir: string; syncEnabled: boolean };
  channels: ChannelConfig[];
}
