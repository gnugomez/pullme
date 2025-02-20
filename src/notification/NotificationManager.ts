import type { PullRequest } from '../pr/type'
import { log } from '..'
import { type HandleNotificationResult, type NotificationClient, type NotificationDecisionHandler, type NotificationDecisionHandlerContext, type NotificationInterval, type NotificationRecord, type NotificationRepository, NotificationStatus } from './types'

export class NotificationManager {
  constructor(
    private notificationRepo: NotificationRepository,
    private communicationClient: NotificationClient,
    private notificationIntervals: NotificationInterval[] = [],
    private handlers: NotificationDecisionHandler[] = [],
  ) {}

  async handleNotification(pr: PullRequest): Promise<HandleNotificationResult> {
    const notificationHistory = await this.notificationRepo.findAllNotifications()
    const notificationCount = notificationHistory[pr.id]?.notificationCount || 0
    const interval = this.getCurrentNotificationInterval(notificationCount)

    const context: NotificationDecisionHandlerContext = {
      pr,
      notificationHistory,
      notificationIntervals: this.notificationIntervals,
    }

    const decision = this.shouldNotify(context)

    if (decision.sendNotification) {
      await this.communicationClient.sendReminder(pr, interval.tone)
      await this.updateNotificationTracker(pr, notificationHistory)

      return { status: NotificationStatus.SENT, interval }
    }

    if (decision.lastNotifiedDate) {
      return { status: NotificationStatus.PENDING, interval, lastNotifiedDate: decision.lastNotifiedDate }
    }

    return { status: NotificationStatus.NOT_REQUESTED, interval }
  }

  private shouldNotify(context: NotificationDecisionHandlerContext) {
    log.debug(`Determining if notification should be sent for PR: ${context.pr.id}`)
    const decision = this.handlers.find(h => h.canHandle(context))?.handle(context)
    return decision || { sendNotification: false }
  }

  private getCurrentNotificationInterval(notificationCount: number): NotificationInterval {
    return this.notificationIntervals[Math.min(notificationCount, this.notificationIntervals.length - 1)]
  }

  private async updateNotificationTracker(pr: PullRequest, notificationHistory: NotificationRecord) {
    log.debug(`Updating notification tracker for PR: ${pr.id}`)
    notificationHistory[pr.id] = {
      lastNotifiedAt: new Date().toISOString(),
      notificationCount: (notificationHistory[pr.id]?.notificationCount || 0) + 1,
    }
    await this.notificationRepo.save(notificationHistory)
    log.debug(`Notification tracker updated for PR: ${pr.id}`)
  }
}
