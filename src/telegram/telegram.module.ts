import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ChatStorageService } from './chat-storage.service';
import { BotCommandsService } from './bot-commands.service';
import { SeatCheckerModule } from '../seat-checker/seat-checker.module';

@Module({
  imports: [forwardRef(() => SeatCheckerModule)],
  providers: [TelegramService, ChatStorageService, BotCommandsService],
  exports: [TelegramService, ChatStorageService],
})
export class TelegramModule {}
