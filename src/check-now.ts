import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeatCheckerCron } from './seat-checker/seat-checker.cron';

async function checkNow() {
  console.log('Starting manual seat check...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const cronService = app.get(SeatCheckerCron);

  try {
    await cronService.checkNow();
    console.log('\n✅ Check completed successfully');
  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

checkNow();
