import { generateId, timestamp } from '@clawfree/shared';
import type { ToolExecution } from '@clawfree/shared';

export interface PermissionRule {
  tool: string;
  action: 'allow' | 'deny' | 'ask';
  reason?: string;
}

const defaultRules: PermissionRule[] = [
  { tool: 'file_read', action: 'allow' },
  { tool: 'file_list', action: 'allow' },
  { tool: 'web_fetch', action: 'allow' },
  { tool: 'web_search', action: 'allow' },
  { tool: 'mcp_list', action: 'allow' },
  { tool: 'file_write', action: 'ask' },
  { tool: 'shell', action: 'ask' },
  { tool: 'browser_navigate', action: 'ask' },
  { tool: 'browser_click', action: 'ask' },
  { tool: 'mcp_connect', action: 'ask' },
];

const auditLog: ToolExecution[] = [];
let rules = [...defaultRules];

export function checkPermission(toolName: string): 'allow' | 'deny' | 'ask' {
  const rule = rules.find(r => r.tool === toolName);
  return rule?.action || 'ask';
}

export function setPermissionRules(newRules: PermissionRule[]): void {
  rules = [...newRules];
}

export function getPermissionRules(): PermissionRule[] {
  return [...rules];
}

export function logToolExecution(execution: Omit<ToolExecution, 'id' | 'createdAt'>): ToolExecution {
  const entry: ToolExecution = {
    ...execution,
    id: generateId(),
    createdAt: timestamp(),
  };
  auditLog.push(entry);

  // Keep audit log bounded
  if (auditLog.length > 10000) {
    auditLog.splice(0, auditLog.length - 10000);
  }

  return entry;
}

export function getAuditLog(options: {
  limit?: number;
  toolName?: string;
  status?: string;
  sessionId?: string;
} = {}): ToolExecution[] {
  let entries = [...auditLog];

  if (options.toolName) {
    entries = entries.filter(e => e.toolName === options.toolName);
  }
  if (options.status) {
    entries = entries.filter(e => e.status === options.status);
  }
  if (options.sessionId) {
    entries = entries.filter(e => e.sessionId === options.sessionId);
  }

  return entries.slice(-(options.limit || 100));
}

// Sandbox: restrict file operations to workspace directory
export function isPathAllowed(filePath: string, workspaceDir: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  const normalizedWorkspace = workspaceDir.replace(/\\/g, '/').toLowerCase();
  return normalizedPath.startsWith(normalizedWorkspace);
}

// Sanitize shell commands — block obviously dangerous patterns
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /mkfs/i,
  /dd\s+if=/i,
  /:\(\)\{.*\}/,       // fork bomb
  />\s*\/dev\/sd/i,
  /format\s+[a-z]:/i,  // Windows format
];

export function isCommandSafe(command: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { safe: false, reason: `Command matches blocked pattern: ${pattern}` };
    }
  }
  return { safe: true };
}
