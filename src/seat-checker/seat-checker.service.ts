import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface SeatAvailability {
  train: string;
  date: string;
  time: string;
  route: string;
  passengers: number;
  totalAvailableSeats: number;
  seatsByCar: Record<string, number>;
  availableSeats: string[];
}

@Injectable()
export class SeatCheckerService {
  private readonly logger = new Logger(SeatCheckerService.name);

  async checkAvailability(passengers: number = 4): Promise<SeatAvailability> {
    this.logger.log(`Checking seat availability for ${passengers} passengers...`);

    try {
      const response = await axios.post(
        'https://www.club-nankai.jp/sta/web/OnetimePurchInput.do',
        this.buildFormData(passengers),
        {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'JSESSIONID=KSv54zwUMkuRzLqgLarqRNZ7NsCEHX7g2iOI1ir5nRJbICMabtYe0PdsK90r1PMC.TicketLess_001; FJNADDSPID=3kFqtf; _gid=GA1.2.1564319722.1760773997; _gat_UA-151092508-1=1; _ga_C6P3KKY5YJ=GS2.1.s1760773997$o1$g1$t1760774340$j32$l0$h0; _ga=GA1.1.1343805746.1760773997',
            'Origin': 'https://www.club-nankai.jp',
            'Referer': 'https://www.club-nankai.jp/sta/web/OnetimePurchInput.do',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          },
        },
      );

      return this.parseResponse(response.data, passengers);
    } catch (error) {
      this.logger.error('Failed to check seat availability', error);
      throw error;
    }
  }

  private buildFormData(passengers: number): string {
    // Complete form data matching the original curl request
    const formData = `EactionRedisplay=&depRoute=1&depSta=1853&arrSta=1105&trainCode=3256&personAd=${passengers}&personCh=0&payKbn=2&coachTrain=&wndPassCode=&seatPd=14&displayPurchaseInputFlag=1&displaySeatSelectFlag=1&depRouteName=NANKAI+LINE+%EF%BD%A5+AIRPORT+LINE&depStaName=KANSAI-AIRPORT&arrStaName=TENGACHAYA&errorCode=&agree=0&seatAll=&coachAll=&trainName=&paymentMethod=&wndPass=&minCalDate=2025%2F10%2F18&maxCalDate=2025%2F11%2F30&displayRoute=0&displayReserve=0&ttlSite=%2Fassets%2Fimages%2Fcommon%2Fimg_logo.png&ttlSiteSp=%2Fassets%2Fimages%2Fcommon%2Fimg_logo_sp.png&routeTop2=%2Fassets%2Fimages%2Fcommon%2Fimg_title.png&search=Search&back=Back&exchangeSearchCondition=Change+search+condition&seatDisp=Seat+Selection&purch=Next&cancel=Cancel&purchGuide=Next&seatInfoClear=Clear&reDisp=Refresh&ttlSeatCondition=%2Fassets%2Fimages%2F012%2Fimg_legend_seat-en.png&ttlSeatConditionSp=%2Fassets%2Fimages%2F012%2Fimg_legend_seat_sp-en.png&btnNameYes=Yes&btnNameNo=No&modalPopupMessage1=&direction=%2Fassets%2Fimages%2Ficon%2Fdirection-southern-icon-en.png&top=Top&routeTop1=Purchase&routeTop3=Input+Train+Search+Condition&screenSpec=Please+select+boarding+time+and+boarding+area.&ttlAntInputRequired=are+required+fields&ttlDepYmd=Boarding+Date&ttlDepTime=Boarding+Time&ttlDepRoute=Boarding+Route&ttlDdtlDepSec=Boarding+Area&ttlDepYmd=Boarding+Date&depYmd=2025%2F10%2F26&ttlDepTime=Boarding+Time&depHh=10&depMm=30&ttlDepRoute=Boarding+Route&depRouteName=NANKAI+LINE+%EF%BD%A5+AIRPORT+LINE&ttlDdtlDepSec=Boarding+Area&depStaName=KANSAI-AIRPORT&arrStaName=TENGACHAYA&ttlTrainName=Train+Name&ttlPerson=Number+of+Passengers&ttlPersonAd=Adult&ttlAdUnit=&ttlPersonCh=Child&ttlChUnit=&ttlMaxPurchSeat=No.+of+seats+you+can+purchase&maxPurchSeat=8&ttlSeatUnit=&ttlPayMethod=Payment+method&ttlOmakasePurch=Random+Seat+Purchase&ttlCoach=Car&ttlWndPass=Window%2F+Aisle&ttlSeatKbn=Seat+Type&antOmakasePurch=*When+Random+Seat+Purchase+is+selected%2C+you+cannot+specify+a+seat.&routeSeatAppoint=Seat+selection&seatAppointSpec=Please+click+the+Car+link+and+select+a+seat.%0D%0A*Car+with+available+seats+less+than+the+specified+desired+number+of+passengers+cannot+be+clicked.&dispNoSeat=Car%EF%BC%88Impossible+to+purchase%EF%BC%89&coachDeploy=Car&downDirection=Headed+for+KANSAI-AIRPORT&upDirection=Headed+for+NAMBA&downDirection=Headed+for+KANSAI-AIRPORT&upDirection=Headed+for+NAMBA&purchaseMethod=&depRoute=1&depSta=1853&arrSta=1105&wndPassCode=&depTimeUnit=Departure&stopService=Out+of+Service&seatList=&depSecDepSta=boarding+area%EF%BC%88get+on+station%EF%BC%89&depSecArrSta=boarding+area%EF%BC%88get+off+station%EF%BC%89&seatPd=14&cKey=f28d41a9-0334-4071-a98b-3f701dc52056&formFuncId=XW280W&lang=02`;

    return formData;
  }

  private parseResponse(html: string, passengers: number): SeatAvailability {
    const $ = cheerio.load(html);

    // Extract booking details
    const date = $('.box__content:contains("Boarding Date") .form__label.-selected').text().trim();
    const time = $('.box__content:contains("Boarding Time") .form__label.-selected').first().text().trim();
    const route = $('input[name="depStaName"]').val() as string + ' → ' + $('input[name="arrStaName"]').val() as string;
    const train = $('select[name="trainCode"] option:selected').text().trim();

    // Find all available seats
    const availableSeats: string[] = [];
    const seatsByCar: Record<string, number> = {};

    // Parse each car section
    $('p.train-number').each((_, carElement) => {
      const carNumber = $(carElement).text().replace('Car', '').trim();

      // Find the seats div for this car
      const seatsDiv = $(carElement).next('.seats');

      // Count available seats in this car
      const carSeats: string[] = [];
      seatsDiv.find('input.availableSeat').each((_, seatInput) => {
        const seatValue = $(seatInput).val() as string;
        const seatNumber = $(seatInput).next('span').find('span').text().trim();

        availableSeats.push(`Car ${carNumber} - Seat ${seatNumber}`);
        carSeats.push(seatNumber);
      });

      if (carSeats.length > 0) {
        seatsByCar[`Car ${carNumber}`] = carSeats.length;
      }
    });

    this.logger.log(`Found ${availableSeats.length} available seats across ${Object.keys(seatsByCar).length} cars`);

    return {
      train,
      date,
      time,
      route,
      passengers,
      totalAvailableSeats: availableSeats.length,
      seatsByCar,
      availableSeats,
    };
  }

  formatMessage(availability: SeatAvailability): string {
    let message = `🚄 Nankai Seat Availability\n\n`;
    message += `📅 Date: ${availability.date}\n`;
    message += `🕐 Time: ${availability.time}\n`;
    message += `🚉 Route: ${availability.route}\n`;
    message += `🚂 Train: ${availability.train}\n`;
    message += `👥 Passengers: ${availability.passengers}\n\n`;
    message += `✅ Total Available Seats: ${availability.totalAvailableSeats}\n\n`;

    if (Object.keys(availability.seatsByCar).length > 0) {
      message += `📊 Breakdown by Car:\n`;
      Object.entries(availability.seatsByCar).forEach(([car, count]) => {
        message += `  ${car}: ${count} seats\n`;
      });
    } else {
      message += `⚠️ No available seats found\n`;
    }

    return message;
  }
}
