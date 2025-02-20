import type { NotificationDecisionHandler, NotificationDecisionHandlerContext } from '../types'
import { log } from '../..'

const DRAFT_TAG_REGEX = /\[(?:draft|wip|do not merge)\]/i

export class TaggedAsDraftHandler implements NotificationDecisionHandler {
  canHandle({ pr }: NotificationDecisionHandlerContext): boolean {
    return DRAFT_TAG_REGEX.test(pr.title)
  }

  handle(context: NotificationDecisionHandlerContext) {
    log.debug(`TaggedAsDraftHandler: the PR ${context.pr.id} is tagged as draft, skipping notification.`)
    return { sendNotification: false }
  }
}
