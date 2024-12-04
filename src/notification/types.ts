import type { PullRequest } from '../pr/type'

export interface NotificationRecord {
  [prId: number]: {
    lastNotifiedAt: string
    notificationCount: number
  }
}

export interface NotificationInterval {
  tone: NotificationTone
  hours: number
}

export interface NotificationRepository {
  findAllNotifications: () => Promise<NotificationRecord>
  save: (record: NotificationRecord) => Promise<void>
}

export interface NotificationClient {
  sendNotification: (message: string) => Promise<void>
  sendReminder: (pr: PullRequest, tone: NotificationTone) => Promise<void>
}

export enum NotificationTone {
  FRIENDLY_REMINDER = '⭐️ Friendly reminder',
  SLOWING_DOWN = '🐌 Code review is slowing down',
  URGENT_REVIEW_REQUEST = '🧨 Urgent review request',
  CRITICAL = '🚨 PR blocking progress',
}

export const NotificationMessages: Record<NotificationTone, string> = {
  [NotificationTone.FRIENDLY_REMINDER]: 'Just a friendly reminder to review this Pull Request at your earliest convenience. 🕰️',
  [NotificationTone.SLOWING_DOWN]: 'This PR is lagging behind. Your timely review would be greatly appreciated! 🐌',
  [NotificationTone.URGENT_REVIEW_REQUEST]: 'This PR has been pending review for a while. Please give it your immediate attention. 🚧',
  [NotificationTone.CRITICAL]: 'This PR is critically delaying our progress. Immediate review is required! 🛑',
}

export enum NotificationStatus {
  SENT,
  PENDING,
  NOT_REQUESTED,
}

export type HandleNotificationResult = {
  status: NotificationStatus.SENT
  interval: NotificationInterval
} | {
  status: NotificationStatus.PENDING
  interval: NotificationInterval
  lastNotifiedDate: Date
} | {
  status: NotificationStatus.NOT_REQUESTED
  interval: NotificationInterval
}

export interface NotificationDecisionHandlerContext {
  pr: PullRequest
  notificationHistory: NotificationRecord
  notificationIntervals: NotificationInterval[]
}

export interface NotificationDecision {
  sendNotification: boolean
  lastNotifiedDate?: Date
}

export interface NotificationDecisionHandler {
  canHandle: (context: NotificationDecisionHandlerContext) => boolean
  handle: (context: NotificationDecisionHandlerContext) => NotificationDecision
}
