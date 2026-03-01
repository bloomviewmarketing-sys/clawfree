import { ChannelAdapter } from './base.js';
import type { ChannelType } from '@clawfree/shared';
import { createHmac, timingSafeEqual } from 'crypto';

interface SlackEvent {
  type: string;
  challenge?: string;
  event?: {
    type: string;
    text?: string;
    user?: string;
    channel?: string;
    ts?: string;
    bot_id?: string;
  };
}

export class SlackAdapter extends ChannelAdapter {
  readonly type: ChannelType = 'slack';
  private botToken: string;
  private signingSecret: string;

  constructor(
    agentLoop: ConstructorParameters<typeof ChannelAdapter>[0],
    botToken: string,
    signingSecret: string
  ) {
    super(agentLoop);
    this.botToken = botToken;
    this.signingSecret = signingSecret;
  }

  async start(): Promise<void> {
    console.log('[Slack] Adapter ready (register webhook at /api/channels/slack/events)');
  }

  async stop(): Promise<void> {
    console.log('[Slack] Adapter stopped');
  }

  verifySignature(timestamp: string, body: string, signature: string): boolean {
    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + createHmac('sha256', this.signingSecret)
      .update(sigBasestring)
      .digest('hex');

    return timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
  }

  async handleEvent(event: SlackEvent): Promise<string | undefined> {
    // URL verification challenge
    if (event.type === 'url_verification') {
      return event.challenge;
    }

    if (event.type === 'event_callback' && event.event) {
      const { event: slackEvent } = event;

      // Ignore bot messages
      if (slackEvent.bot_id) return undefined;

      if (slackEvent.type === 'message' && slackEvent.text && slackEvent.channel) {
        await this.handleMessage(slackEvent.channel, slackEvent.text, slackEvent.user);
      }
    }

    return undefined;
  }

  private async handleMessage(channel: string, text: string, userId?: string): Promise<void> {
    try {
      const response = await this.agentLoop.processMessage(text, {
        channel: 'slack',
        userId,
      });

      await this.postMessage(channel, response.content);
    } catch (err) {
      await this.postMessage(channel, 'Sorry, an error occurred processing your message.');
    }
  }

  private async postMessage(channel: string, text: string): Promise<void> {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    });
  }
}
