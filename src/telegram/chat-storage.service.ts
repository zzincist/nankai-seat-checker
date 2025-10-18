import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface ChatData {
  chatIds: number[];
}

@Injectable()
export class ChatStorageService {
  private readonly logger = new Logger(ChatStorageService.name);
  private readonly storageFile: string;
  private chatData: ChatData;

  constructor() {
    this.storageFile = path.join(process.cwd(), 'registered-users.json');
    this.loadChatIds();
  }

  private loadChatIds(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8');
        this.chatData = JSON.parse(data);
        this.logger.log(`Loaded ${this.chatData.chatIds.length} registered users`);
      } else {
        this.chatData = { chatIds: [] };
        this.saveChatIds();
        this.logger.log('Created new user registry');
      }
    } catch (error) {
      this.logger.error('Failed to load chat IDs', error);
      this.chatData = { chatIds: [] };
    }
  }

  private saveChatIds(): void {
    try {
      fs.writeFileSync(
        this.storageFile,
        JSON.stringify(this.chatData, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('Failed to save chat IDs', error);
    }
  }

  registerChatId(chatId: number): boolean {
    if (!this.chatData.chatIds.includes(chatId)) {
      this.chatData.chatIds.push(chatId);
      this.saveChatIds();
      this.logger.log(`Registered new user: ${chatId}`);
      return true;
    }
    return false;
  }

  unregisterChatId(chatId: number): boolean {
    const index = this.chatData.chatIds.indexOf(chatId);
    if (index > -1) {
      this.chatData.chatIds.splice(index, 1);
      this.saveChatIds();
      this.logger.log(`Unregistered user: ${chatId}`);
      return true;
    }
    return false;
  }

  getAllChatIds(): number[] {
    return [...this.chatData.chatIds];
  }

  isRegistered(chatId: number): boolean {
    return this.chatData.chatIds.includes(chatId);
  }

  getRegisteredCount(): number {
    return this.chatData.chatIds.length;
  }
}
