# Nankai Seat Checker

Automated seat availability checker for Nankai Railway (Kansai Airport to Tengachaya route). Sends daily updates via Telegram at 8am.

## Features

- Checks seat availability for Nankai Rapi:t trains
- Parses real-time seat data from official Nankai website
- Sends formatted notifications to Telegram
- Scheduled to run daily at 8am (until Oct 26, 2025)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Telegram Bot

#### a. Create a new bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts:
   - Choose a name for your bot (e.g., "Nankai Seat Checker")
   - Choose a username (must end in 'bot', e.g., "nankai_seat_bot")
4. BotFather will give you a **BOT TOKEN** - save this!
   - Example: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

#### b. Get your Chat ID

1. Start a conversation with your new bot (click the link BotFather provides)
2. Send any message to your bot (e.g., "hello")
3. Visit this URL in your browser (replace `YOUR_BOT_TOKEN` with your actual token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. Look for `"chat":{"id":` in the response - this is your **CHAT ID**
   - Example: `123456789`

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 4. Test the Bot

Run a manual check:

```bash
npm run test:checker
```

Run a test Telegram notification:

```bash
npm run test:telegram
```

## Usage

### Manual Check

Check seat availability once:

```bash
npm run check
```

### Start Scheduled Service

Run the service with daily 8am notifications:

```bash
npm start
```

Or in development mode with auto-reload:

```bash
npm run dev
```

## Configuration

Edit `src/seat-checker/seat-checker.service.ts` to customize:

- **Date**: Change `depYmd` in `buildFormData()`
- **Time**: Change `depHh` and `depMm`
- **Route**: Change `depSta` and `arrSta` station codes
- **Train**: Change `trainCode`
- **Passengers**: Adjust the default passenger count

## Scheduling

The service uses NestJS Schedule with cron. Default: daily at 8am until Oct 26.

To change the schedule, edit `src/seat-checker/seat-checker.cron.ts`.

## Project Structure

```
nankai-seat-checker/
├── src/
│   ├── seat-checker/
│   │   ├── seat-checker.service.ts   # Core logic for fetching/parsing
│   │   ├── seat-checker.module.ts    # NestJS module
│   │   └── seat-checker.cron.ts      # Scheduled task
│   ├── telegram/
│   │   ├── telegram.service.ts       # Telegram bot integration
│   │   └── telegram.module.ts        # NestJS module
│   ├── app.module.ts                 # Root module
│   └── main.ts                       # Entry point
├── .env                              # Your bot credentials (create this!)
├── package.json
└── README.md
```

## License

ISC
