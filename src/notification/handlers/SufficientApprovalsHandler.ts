import type { NotificationDecision, NotificationDecisionHandler, NotificationDecisionHandlerContext } from '../types'
import { log } from '../..'

export class SufficientApprovalsHandler implements NotificationDecisionHandler {
  constructor(private requiredApprovals: number) { }

  canHandle(context: NotificationDecisionHandlerContext): boolean {
    return context.pr.participants.filter(p => p.role === 'REVIEWER' && p.approved).length >= this.requiredApprovals
  }

  handle(): NotificationDecision {
    log.debug(`SufficientApprovalsHandler: Notification should not be sent because there are sufficient approvals.`)
    return {
      sendNotification: false,
    }
  }
}
