import { log } from "../..";
import type { NotificationDecisionHandler, NotificationDecisionHandlerContext } from "../types";

export class NoPriorRecordHandler implements NotificationDecisionHandler {
  canHandle(context: NotificationDecisionHandlerContext): boolean {
    return !context.notificationHistory[context.pr.id];
  }

  handle(context: NotificationDecisionHandlerContext) {
    log.debug(`NoPriorRecordHandler: Notification should be sent for PR ${context.pr.id} because it has no prior record.`);
    return { sendNotification: true, lastNotifiedDate: new Date() };
  }
}