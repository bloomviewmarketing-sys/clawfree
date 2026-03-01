import type { ChannelType } from '@clawfree/shared';
import type { AgentLoop } from '../agent/loop.js';

export abstract class ChannelAdapter {
  abstract readonly type: ChannelType;
  protected agentLoop: AgentLoop;

  constructor(agentLoop: AgentLoop) {
    this.agentLoop = agentLoop;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
