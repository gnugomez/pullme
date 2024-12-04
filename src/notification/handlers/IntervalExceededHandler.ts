import type { NotificationDecisionHandler, NotificationDecisionHandlerContext, NotificationInterval } from '../types'
import { differenceInHours, formatDistanceToNow } from 'date-fns'
import { log } from '../..'

export class IntervalExceededHandler implements NotificationDecisionHandler {
  canHandle(context: NotificationDecisionHandlerContext): boolean {
    const record = context.notificationHistory[context.pr.id]
    return !!record
  }

  handle(context: NotificationDecisionHandlerContext) {
    log.debug(`IntervalExceededHandler: Checking if notification should be sent for PR: ${context.pr.id}`)
    const record = context.notificationHistory[context.pr.id]
    const currentDate = new Date()
    const lastNotifiedDate = new Date(record.lastNotifiedAt)
    const hoursSinceLastNotification = differenceInHours(currentDate, lastNotifiedDate)
    const notificationInterval = this.getCurrentNotificationInterval(record.notificationCount, context.notificationIntervals)
    const sendNotification = hoursSinceLastNotification >= notificationInterval.hours

    log.debug(`IntervalExceededHandler: Notification decision for PR ${context.pr.id}: ${sendNotification ? 'send' : 'do not send'} (last notified ${formatDistanceToNow(lastNotifiedDate)} ago, interval: ${notificationInterval.hours} hours).`)

    return {
      sendNotification,
      lastNotifiedDate,
    }
  }

  private getCurrentNotificationInterval(notificationCount: number, notificationIntervals: NotificationInterval[]): NotificationInterval {
    return notificationIntervals[Math.min(notificationCount, notificationIntervals.length - 1)]
  }
}
