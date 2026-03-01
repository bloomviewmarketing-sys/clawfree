import { ChannelAdapter } from './base.js';
import type { ChannelType } from '@clawfree/shared';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name: string; username?: string };
    text?: string;
  };
}

export class TelegramAdapter extends ChannelAdapter {
  readonly type: ChannelType = 'telegram';
  private botToken: string;
  private polling = false;
  private offset = 0;

  constructor(agentLoop: ConstructorParameters<typeof ChannelAdapter>[0], botToken: string) {
    super(agentLoop);
    this.botToken = botToken;
  }

  private get apiUrl(): string {
    return `https://api.telegram.org/bot${this.botToken}`;
  }

  async start(): Promise<void> {
    this.polling = true;
    console.log('[Telegram] Bot started polling');
    this.poll();
  }

  async stop(): Promise<void> {
    this.polling = false;
    console.log('[Telegram] Bot stopped');
  }

  private async poll(): Promise<void> {
    while (this.polling) {
      try {
        const res = await fetch(
          `${this.apiUrl}/getUpdates?offset=${this.offset}&timeout=30`,
          { signal: AbortSignal.timeout(35000) }
        );
        const data = await res.json();

        if (data.ok && data.result) {
          for (const update of data.result as TelegramUpdate[]) {
            this.offset = update.update_id + 1;
            if (update.message?.text) {
              await this.handleMessage(update.message.chat.id, update.message.text);
            }
          }
        }
      } catch (err) {
        if (this.polling) {
          console.error('[Telegram] Poll error:', err);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }

  private async handleMessage(chatId: number, text: string): Promise<void> {
    try {
      const response = await this.agentLoop.processMessage(text, {
        channel: 'telegram',
        userId: String(chatId),
      });

      await this.sendMessage(chatId, response.content);
    } catch (err) {
      await this.sendMessage(chatId, 'Sorry, an error occurred processing your message.');
    }
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    // Telegram max message length is 4096
    const chunks = [];
    for (let i = 0; i < text.length; i += 4000) {
      chunks.push(text.slice(i, i + 4000));
    }

    for (const chunk of chunks) {
      await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: 'Markdown',
        }),
      });
    }
  }
}
