import type { ToolDefinition, ToolExecution } from '@clawfree/shared';
import { generateId, timestamp } from '@clawfree/shared';

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

const tools = new Map<string, RegisteredTool>();
const executions: ToolExecution[] = [];

export function registerTool(definition: ToolDefinition, handler: ToolHandler): void {
  tools.set(definition.name, { definition, handler });
}

export function getTool(name: string): RegisteredTool | undefined {
  return tools.get(name);
}

export function listTools(): ToolDefinition[] {
  return Array.from(tools.values()).map(t => t.definition);
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: { sessionId?: string; messageId?: string }
): Promise<{ output: string; error?: string; durationMs: number }> {
  const tool = tools.get(name);
  if (!tool) {
    return { output: '', error: `Unknown tool: ${name}`, durationMs: 0 };
  }

  const start = Date.now();
  let output = '';
  let error: string | undefined;

  try {
    output = await Promise.race([
      tool.handler(args),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Tool timeout')), tool.definition.timeout || 30000)
      ),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - start;

  const execution: ToolExecution = {
    id: generateId(),
    sessionId: context.sessionId || '',
    messageId: context.messageId || '',
    toolName: name,
    args,
    output: output || undefined,
    error,
    status: error ? 'error' : 'success',
    durationMs,
    createdAt: timestamp(),
  };
  executions.push(execution);

  return { output, error, durationMs };
}

export function getExecutions(limit = 100): ToolExecution[] {
  return executions.slice(-limit);
}
