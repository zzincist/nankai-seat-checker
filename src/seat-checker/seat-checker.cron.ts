import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeatCheckerService } from './seat-checker.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class SeatCheckerCron {
  private readonly logger = new Logger(SeatCheckerCron.name);

  constructor(
    private readonly seatCheckerService: SeatCheckerService,
    private readonly telegramService: TelegramService,
  ) {}

  // Run twice daily at 8am and 8pm
  @Cron('0 8,20 * * *', {
    name: 'daily-seat-check',
    timeZone: 'Asia/Singapore', // Adjust to your timezone
  })
  async checkSeatsDaily() {
    const targetDate = new Date('2025-10-26');
    const today = new Date();

    // Stop running after Oct 26, 2025
    if (today > targetDate) {
      this.logger.log('Target date passed. Stopping scheduled checks.');
      return;
    }

    this.logger.log('Starting daily seat availability check...');

    try {
      const availability = await this.seatCheckerService.checkAvailability(4);
      const message = this.seatCheckerService.formatMessage(availability);

      // Log to console
      console.log('\n' + message);

      // Send to Telegram if configured
      if (this.telegramService.isConfigured()) {
        await this.telegramService.sendFormattedMessage(message);
        this.logger.log('Notification sent to Telegram');
      } else {
        this.logger.warn('Telegram not configured - skipping notification');
      }
    } catch (error) {
      this.logger.error('Daily seat check failed', error);

      // Try to send error notification
      if (this.telegramService.isConfigured()) {
        try {
          await this.telegramService.broadcastMessage(
            `⚠️ Nankai Seat Check Failed\n\nError: ${error.message}`,
          );
        } catch (telegramError) {
          this.logger.error('Failed to send error notification', telegramError);
        }
      }
    }
  }

  // Manual trigger method
  async checkNow() {
    this.logger.log('Manual seat check triggered');
    await this.checkSeatsDaily();
  }
}
