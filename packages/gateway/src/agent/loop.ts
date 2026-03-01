import { EventEmitter } from 'events';
import { generateId, timestamp } from '@clawfree/shared';
import type { Message, Session, WsEvent } from '@clawfree/shared';
import { ClaudeRunner, type ClaudeResponse } from './claude-runner.js';
import { buildContext } from './context.js';
import { MemoryManager } from '../memory/index.js';
import { SkillLoader } from '../skills/index.js';
import { getConfig } from '../config/index.js';

export interface AgentLoopOptions {
  sessionId?: string;
  userId?: string;
  channel?: string;
}

export class AgentLoop extends EventEmitter {
  private runner = new ClaudeRunner();
  private memoryManager = new MemoryManager();
  private skillLoader = new SkillLoader();
  private sessions = new Map<string, Session>();
  private messageHistory = new Map<string, Message[]>();

  async processMessage(userMessage: string, options: AgentLoopOptions = {}): Promise<Message> {
    const sessionId = options.sessionId || generateId();
    const config = getConfig();

    // Get or create session
    if (!this.sessions.has(sessionId)) {
      const session: Session = {
        id: sessionId,
        agentId: 'default',
        userId: options.userId,
        channel: (options.channel as Session['channel']) || 'api',
        status: 'active',
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };
      this.sessions.set(sessionId, session);
      this.messageHistory.set(sessionId, []);
    }

    // Store user message
    const userMsg: Message = {
      id: generateId(),
      sessionId,
      role: 'user',
      content: userMessage,
      createdAt: timestamp(),
    };
    this.messageHistory.get(sessionId)!.push(userMsg);
    this.emit('message', userMsg);

    // Build context
    const history = this.messageHistory.get(sessionId) || [];
    const memories = await this.memoryManager.search(userMessage, 5);
    const skills = this.skillLoader.getActiveSkills();

    const context = await buildContext({
      memories,
      skills,
      history: history.map(m => ({ role: m.role, content: m.content })),
    });

    // Build full prompt with history
    const historyText = context.recentHistory
      .map(h => `${h.role}: ${h.content}`)
      .join('\n\n');

    const fullPrompt = historyText
      ? `${historyText}\n\nuser: ${userMessage}`
      : userMessage;

    // Stream events
    this.emit('ws', {
      type: 'stream',
      sessionId,
      data: { status: 'thinking' },
      timestamp: timestamp(),
    } as WsEvent);

    // Run Claude
    let response: ClaudeResponse;
    try {
      // Forward stream events
      this.runner.on('content', (content: string) => {
        this.emit('ws', {
          type: 'stream',
          sessionId,
          data: { content },
          timestamp: timestamp(),
        } as WsEvent);
      });

      this.runner.on('tool_call', (call: unknown) => {
        this.emit('ws', {
          type: 'tool_call',
          sessionId,
          data: call,
          timestamp: timestamp(),
        } as WsEvent);
      });

      response = await this.runner.run({
        prompt: fullPrompt,
        systemPrompt: context.systemPrompt,
        workingDir: config.workspace.dir,
      });
    } finally {
      this.runner.removeAllListeners('content');
      this.runner.removeAllListeners('tool_call');
    }

    // Store assistant message
    const assistantMsg: Message = {
      id: generateId(),
      sessionId,
      role: 'assistant',
      content: response.content,
      toolCalls: response.toolCalls.length > 0 ? response.toolCalls : undefined,
      toolResults: response.toolResults.length > 0
        ? response.toolResults.map(r => ({ ...r, durationMs: response.durationMs }))
        : undefined,
      tokens: undefined,
      createdAt: timestamp(),
    };
    this.messageHistory.get(sessionId)!.push(assistantMsg);
    this.emit('message', assistantMsg);

    this.emit('ws', {
      type: 'done',
      sessionId,
      data: { messageId: assistantMsg.id, durationMs: response.durationMs },
      timestamp: timestamp(),
    } as WsEvent);

    return assistantMsg;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getMessages(sessionId: string): Message[] {
    return this.messageHistory.get(sessionId) || [];
  }

  deleteSession(sessionId: string): boolean {
    this.sessions.delete(sessionId);
    this.messageHistory.delete(sessionId);
    return true;
  }
}
