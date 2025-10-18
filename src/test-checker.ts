import { SeatCheckerService } from './seat-checker/seat-checker.service';

async function test() {
  const service = new SeatCheckerService();

  console.log('Testing seat availability check...\n');

  try {
    // Test with 4 passengers
    const availability = await service.checkAvailability(4);
    const message = service.formatMessage(availability);

    console.log(message);
    console.log('\n--- Raw Data ---');
    console.log(JSON.stringify(availability, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
