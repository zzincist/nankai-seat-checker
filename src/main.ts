import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3008);
  console.log('\n🤖 Nankai Seat Checker Bot is running...');
  console.log('📅 Monitoring seat availability for Oct 26, 2025');
  console.log('⏰ Daily updates at 8:00 AM');
  console.log('💬 Users can register by sending /start to the bot\n');
}

bootstrap();
