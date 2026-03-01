import { ChannelAdapter } from './base.js';
import type { ChannelType } from '@clawfree/shared';

// Discord Gateway opcodes
const OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};

export class DiscordAdapter extends ChannelAdapter {
  readonly type: ChannelType = 'discord';
  private botToken: string;
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastSequence: number | null = null;

  constructor(agentLoop: ConstructorParameters<typeof ChannelAdapter>[0], botToken: string) {
    super(agentLoop);
    this.botToken = botToken;
  }

  async start(): Promise<void> {
    // Get gateway URL
    const res = await fetch('https://discord.com/api/v10/gateway/bot', {
      headers: { Authorization: `Bot ${this.botToken}` },
    });
    const data = await res.json();
    const gatewayUrl = data.url;

    this.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);

    this.ws.onmessage = (event) => {
      const payload = JSON.parse(event.data as string);
      this.handleGatewayEvent(payload);
    };

    this.ws.onclose = () => {
      console.log('[Discord] Connection closed');
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    };

    console.log('[Discord] Bot connecting...');
  }

  async stop(): Promise<void> {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.ws) this.ws.close();
    console.log('[Discord] Bot stopped');
  }

  private handleGatewayEvent(payload: { op: number; d: unknown; s: number | null; t: string | null }): void {
    if (payload.s !== null) this.lastSequence = payload.s;

    switch (payload.op) {
      case OPCODES.HELLO: {
        const { heartbeat_interval } = payload.d as { heartbeat_interval: number };
        this.startHeartbeat(heartbeat_interval);
        this.identify();
        break;
      }

      case OPCODES.DISPATCH: {
        if (payload.t === 'MESSAGE_CREATE') {
          const msg = payload.d as {
            content: string;
            channel_id: string;
            author: { id: string; bot?: boolean };
          };
          // Ignore bot messages
          if (!msg.author.bot && msg.content) {
            this.handleMessage(msg.channel_id, msg.content, msg.author.id);
          }
        }
        break;
      }
    }
  }

  private startHeartbeat(interval: number): void {
    this.heartbeatInterval = setInterval(() => {
      this.ws?.send(JSON.stringify({ op: OPCODES.HEARTBEAT, d: this.lastSequence }));
    }, interval);
  }

  private identify(): void {
    this.ws?.send(JSON.stringify({
      op: OPCODES.IDENTIFY,
      d: {
        token: this.botToken,
        intents: 1 << 9 | 1 << 15, // GUILD_MESSAGES | MESSAGE_CONTENT
        properties: { os: 'linux', browser: 'clawfree', device: 'clawfree' },
      },
    }));
  }

  private async handleMessage(channelId: string, content: string, userId: string): Promise<void> {
    try {
      const response = await this.agentLoop.processMessage(content, {
        channel: 'discord',
        userId,
      });

      await this.sendMessage(channelId, response.content);
    } catch (err) {
      await this.sendMessage(channelId, 'Sorry, an error occurred processing your message.');
    }
  }

  private async sendMessage(channelId: string, content: string): Promise<void> {
    // Discord max message length is 2000
    const chunks = [];
    for (let i = 0; i < content.length; i += 1900) {
      chunks.push(content.slice(i, i + 1900));
    }

    for (const chunk of chunks) {
      await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: chunk }),
      });
    }
  }
}
