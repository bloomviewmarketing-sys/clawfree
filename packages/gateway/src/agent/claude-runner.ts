import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { ClaudeStreamEvent } from '@clawfree/shared';
import { getConfig } from '../config/index.js';

export interface ClaudeRunnerOptions {
  prompt: string;
  systemPrompt?: string;
  workingDir?: string;
  timeout?: number;
  allowedTools?: string[];
}

export interface ClaudeResponse {
  content: string;
  toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  toolResults: Array<{ toolCallId: string; output: string; error?: string }>;
  durationMs: number;
}

const activeProcesses = new Set<ChildProcess>();
let concurrentCount = 0;
const queue: Array<{ resolve: (value: ChildProcess) => void; options: ClaudeRunnerOptions }> = [];

function processQueue() {
  const config = getConfig();
  while (queue.length > 0 && concurrentCount < config.claude.maxConcurrent) {
    const next = queue.shift();
    if (next) {
      concurrentCount++;
      const proc = spawnClaude(next.options);
      next.resolve(proc);
    }
  }
}

function spawnClaude(options: ClaudeRunnerOptions): ChildProcess {
  const config = getConfig();
  const args = ['-p', options.prompt, '--output-format', 'stream-json'];

  if (options.systemPrompt) {
    args.push('--system-prompt', options.systemPrompt);
  }

  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowedTools', options.allowedTools.join(','));
  }

  const proc = spawn(config.claude.cliPath, args, {
    cwd: options.workingDir || config.workspace.dir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  activeProcesses.add(proc);
  proc.on('exit', () => {
    activeProcesses.delete(proc);
    concurrentCount--;
    processQueue();
  });

  return proc;
}

export class ClaudeRunner extends EventEmitter {
  async run(options: ClaudeRunnerOptions): Promise<ClaudeResponse> {
    const config = getConfig();
    const timeout = options.timeout || config.claude.timeout;
    const startTime = Date.now();

    return new Promise<ClaudeResponse>((resolve, reject) => {
      const getProcess = (): Promise<ChildProcess> => {
        if (concurrentCount < config.claude.maxConcurrent) {
          concurrentCount++;
          return Promise.resolve(spawnClaude(options));
        }
        return new Promise<ChildProcess>(res => {
          queue.push({ resolve: res, options });
        });
      };

      getProcess().then(proc => {
        let stdout = '';
        let stderr = '';
        const content: string[] = [];
        const toolCalls: ClaudeResponse['toolCalls'] = [];
        const toolResults: ClaudeResponse['toolResults'] = [];

        const timer = setTimeout(() => {
          proc.kill('SIGTERM');
          reject(new Error(`Claude CLI timed out after ${timeout}ms`));
        }, timeout);

        proc.stdout?.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          stdout += text;

          // Parse stream-json: each line is a JSON object
          const lines = text.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const event = JSON.parse(line) as ClaudeStreamEvent;
              this.emit('event', event);

              switch (event.type) {
                case 'assistant':
                  if (event.content) {
                    content.push(event.content);
                    this.emit('content', event.content);
                  }
                  break;
                case 'tool_use':
                  if (event.tool) {
                    const call = {
                      id: `call_${toolCalls.length}`,
                      name: event.tool,
                      args: event.args || {},
                    };
                    toolCalls.push(call);
                    this.emit('tool_call', call);
                  }
                  break;
                case 'tool_result':
                  toolResults.push({
                    toolCallId: `call_${toolResults.length}`,
                    output: event.output || '',
                    error: event.error,
                  });
                  this.emit('tool_result', event);
                  break;
                case 'result':
                  if (event.content) {
                    content.push(event.content);
                  }
                  break;
                case 'error':
                  this.emit('error', new Error(event.error || 'Unknown Claude error'));
                  break;
              }
            } catch {
              // Not valid JSON yet, might be partial line
            }
          }
        });

        proc.stderr?.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });

        proc.on('error', (err) => {
          clearTimeout(timer);
          reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
        });

        proc.on('exit', (code) => {
          clearTimeout(timer);
          const durationMs = Date.now() - startTime;

          if (code !== 0 && content.length === 0) {
            reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
            return;
          }

          resolve({
            content: content.join(''),
            toolCalls,
            toolResults,
            durationMs,
          });
        });
      });
    });
  }

  async stream(options: ClaudeRunnerOptions): Promise<AsyncGenerator<ClaudeStreamEvent>> {
    const config = getConfig();
    const timeout = options.timeout || config.claude.timeout;

    const self = this;
    async function* generator(): AsyncGenerator<ClaudeStreamEvent> {
      const proc = await new Promise<ChildProcess>((res) => {
        if (concurrentCount < config.claude.maxConcurrent) {
          concurrentCount++;
          res(spawnClaude(options));
        } else {
          queue.push({ resolve: res, options });
        }
      });

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
      }, timeout);

      let buffer = '';

      const events: ClaudeStreamEvent[] = [];
      let done = false;
      let error: Error | null = null;

      proc.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            events.push(JSON.parse(line));
          } catch {
            // partial line
          }
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString().trim();
        if (text) {
          self.emit('stderr', text);
        }
      });

      proc.on('error', (err) => {
        error = err;
        done = true;
      });

      proc.on('exit', () => {
        clearTimeout(timer);
        done = true;
      });

      while (!done || events.length > 0) {
        if (events.length > 0) {
          yield events.shift()!;
        } else {
          await new Promise(r => setTimeout(r, 10));
        }
      }

      if (error) throw error;
    }

    return generator();
  }
}

export function killAllProcesses(): void {
  for (const proc of activeProcesses) {
    proc.kill('SIGTERM');
  }
  activeProcesses.clear();
  concurrentCount = 0;
  queue.length = 0;
}
