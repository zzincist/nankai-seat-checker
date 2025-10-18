import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatStorageService } from './chat-storage.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private chatStorage: ChatStorageService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!this.botToken) {
      this.logger.warn(
        'Telegram bot token not configured. Please set TELEGRAM_BOT_TOKEN in .env file',
      );
    }

    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessageToChat(chatId: number, text: string): Promise<void> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    try {
      const url = `${this.baseUrl}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logger.error(`Failed to send message to ${chatId}`, error.message);
      throw error;
    }
  }

  async broadcastMessage(text: string): Promise<void> {
    const chatIds = this.chatStorage.getAllChatIds();

    if (chatIds.length === 0) {
      this.logger.warn('No registered users to send message to');
      return;
    }

    this.logger.log(`Broadcasting to ${chatIds.length} users...`);

    const results = await Promise.allSettled(
      chatIds.map((chatId) => this.sendMessageToChat(chatId, text)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Broadcast complete: ${successful} successful, ${failed} failed`,
    );
  }

  async sendFormattedMessage(message: string): Promise<void> {
    // Convert markdown-style formatting to Telegram HTML
    const formatted = message
      .replace(/🚄/g, '🚄')
      .replace(/📅/g, '📅')
      .replace(/🕐/g, '🕐')
      .replace(/🚉/g, '🚉')
      .replace(/🚂/g, '🚂')
      .replace(/👥/g, '👥')
      .replace(/✅/g, '✅')
      .replace(/📊/g, '📊')
      .replace(/⚠️/g, '⚠️');

    await this.broadcastMessage(formatted);
  }

  async getUpdates(offset?: number): Promise<any> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    const url = `${this.baseUrl}/getUpdates`;
    const params: any = { timeout: 30 };
    if (offset) {
      params.offset = offset;
    }

    const response = await axios.get(url, { params });
    return response.data;
  }

  isConfigured(): boolean {
    return !!this.botToken;
  }
}
