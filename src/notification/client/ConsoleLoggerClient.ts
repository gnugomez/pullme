import type { NotificationClient, NotificationTone } from "../types";
import type { PullRequest } from "../../pr/type";
import { log } from "../..";

export class ConsoleLoggerClient implements NotificationClient {
  sendReminder(pr: PullRequest, tone: NotificationTone): Promise<void> {
    log.info(`Sending PR reminder for PR: ${pr.id} with tone: ${tone}`);
    log.info(`PR Details:`);
    log.info(`Title: ${pr.title}`);
    log.info(`Author: ${pr.author.display_name}`);
    log.info(`View PR: ${pr.links.html.href}`);

    return Promise.resolve();

  }
  sendNotification(message: string): Promise<void> {
    log.debug('Sending console notification...');
    log.debug(message);
    return Promise.resolve();
  }
}
