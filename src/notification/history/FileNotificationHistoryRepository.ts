import type { NotificationRecord, NotificationRepository as NotificationHistoryRepository } from "../types";
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { log } from "../..";

export class FileNotificationHistoryRepository implements NotificationHistoryRepository {
  constructor(private filePath: string) {}

  async findAllNotifications(): Promise<NotificationRecord> {
    try {
      log.debug('Loading notification tracker...');
      if (existsSync(this.filePath)) {
        const content = await readFile(this.filePath, 'utf-8');
        log.debug('Notification tracker loaded.');
        log.trace('Notification tracker content:', content);
        return content ? JSON.parse(content) : {};
      }
    } catch (error) {
      log.error('Error loading notification tracker:', error);
    }
    return {};
  }

  async save(record: NotificationRecord): Promise<void> {
    try {
      log.debug('Saving notification tracker...');
      await writeFile(this.filePath, JSON.stringify(record, null, 2));
      log.debug('Notification tracker saved.');
    } catch (error) {
      log.error('Error saving notification tracker:', error);
    }
  }
}
