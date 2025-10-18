import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ChatStorageService } from './chat-storage.service';
import { SeatCheckerService } from '../seat-checker/seat-checker.service';

@Injectable()
export class BotCommandsService implements OnModuleInit {
  private readonly logger = new Logger(BotCommandsService.name);
  private lastUpdateId = 0;
  private pollingInterval: NodeJS.Timeout;

  constructor(
    private telegramService: TelegramService,
    private chatStorage: ChatStorageService,
    private seatCheckerService: SeatCheckerService,
  ) {}

  async onModuleInit() {
    if (this.telegramService.isConfigured()) {
      this.logger.log('Starting bot command polling...');
      this.startPolling();
    }
  }

  private startPolling() {
    // Poll every 10 seconds (less aggressive to avoid conflicts)
    this.pollingInterval = setInterval(() => {
      this.pollUpdates();
    }, 10000);
  }

  private async pollUpdates() {
    try {
      const updates = await this.telegramService.getUpdates(
        this.lastUpdateId + 1,
      );

      if (updates.ok && updates.result.length > 0) {
        for (const update of updates.result) {
          this.lastUpdateId = update.update_id;
          await this.handleUpdate(update);
        }
      }
    } catch (error) {
      this.logger.error('Error polling updates', error.message);
    }
  }

  private async handleUpdate(update: any) {
    if (!update.message || !update.message.text) {
      return;
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const firstName = update.message.from.first_name || 'User';

    this.logger.log(`Received command from ${firstName} (${chatId}): ${text}`);

    if (text === '/start' || text === '/register') {
      await this.handleStart(chatId, firstName);
    } else if (text === '/stop' || text === '/unregister') {
      await this.handleStop(chatId, firstName);
    } else if (text === '/status') {
      await this.handleStatus(chatId);
    } else if (text === '/help') {
      await this.handleHelp(chatId);
    } else if (text === '/check') {
      await this.handleCheckRequest(chatId);
    }
  }

  private async handleStart(chatId: number, firstName: string) {
    const isNew = this.chatStorage.registerChatId(chatId);

    if (isNew) {
      const message = `👋 Welcome ${firstName}!\n\nYou're now registered for Nankai seat availability updates.\n\nYou'll receive daily notifications at 8:00 AM about seat availability for:\n🚂 Rapi:tβ - Oct 26, 2025, 10:35 AM\n🚉 Kansai Airport → Tengachaya\n\n🔔 Commands:\n/status - Check your registration status\n/check - Get current seat availability\n/stop - Unregister from notifications\n/help - Show this help message`;

      await this.telegramService.sendMessageToChat(chatId, message);
    } else {
      await this.telegramService.sendMessageToChat(
        chatId,
        `Hi ${firstName}! You're already registered for seat updates. 👍`,
      );
    }
  }

  private async handleStop(chatId: number, firstName: string) {
    const wasRegistered = this.chatStorage.unregisterChatId(chatId);

    if (wasRegistered) {
      await this.telegramService.sendMessageToChat(
        chatId,
        `👋 Goodbye ${firstName}!\n\nYou've been unregistered from seat notifications.\n\nSend /start anytime to register again.`,
      );
    } else {
      await this.telegramService.sendMessageToChat(
        chatId,
        `You're not currently registered. Send /start to register for notifications.`,
      );
    }
  }

  private async handleStatus(chatId: number) {
    const isRegistered = this.chatStorage.isRegistered(chatId);
    const totalUsers = this.chatStorage.getRegisteredCount();

    if (isRegistered) {
      await this.telegramService.sendMessageToChat(
        chatId,
        `✅ You're registered for seat notifications!\n\n📊 Total registered users: ${totalUsers}\n\nNext update: Daily at 8:00 AM (until Oct 26, 2025)`,
      );
    } else {
      await this.telegramService.sendMessageToChat(
        chatId,
        `❌ You're not registered.\n\nSend /start to register for notifications.`,
      );
    }
  }

  private async handleHelp(chatId: number) {
    const message = `🤖 Nankai Seat Checker Bot\n\nThis bot monitors seat availability for Nankai Rapi:t trains and sends daily updates.\n\n🔔 Available Commands:\n/start - Register for notifications\n/stop - Unregister from notifications\n/status - Check registration status\n/check - Get current seat availability (coming soon)\n/help - Show this message\n\n📅 Monitoring:\nTrain: Rapi:tβ\nDate: Oct 26, 2025, 10:35 AM\nRoute: Kansai Airport → Tengachaya\nPassengers: 4\n\n⏰ Updates sent daily at 8:00 AM`;

    await this.telegramService.sendMessageToChat(chatId, message);
  }

  private async handleCheckRequest(chatId: number) {
    try {
      await this.telegramService.sendMessageToChat(
        chatId,
        '⏳ Checking seat availability...',
      );

      const availability = await this.seatCheckerService.checkAvailability(4);
      const message = this.seatCheckerService.formatMessage(availability);

      await this.telegramService.sendMessageToChat(chatId, message);
    } catch (error) {
      this.logger.error('Manual check failed', error);
      await this.telegramService.sendMessageToChat(
        chatId,
        `❌ Failed to check seat availability.\n\nError: ${error.message}`,
      );
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.logger.log('Stopped bot command polling');
    }
  }
}
