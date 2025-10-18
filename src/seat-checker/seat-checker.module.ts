import { Module, forwardRef } from '@nestjs/common';
import { SeatCheckerService } from './seat-checker.service';
import { SeatCheckerCron } from './seat-checker.cron';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [forwardRef(() => TelegramModule)],
  providers: [SeatCheckerService, SeatCheckerCron],
  exports: [SeatCheckerService, SeatCheckerCron],
})
export class SeatCheckerModule {}
