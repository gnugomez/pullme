import type { NotificationDecision, NotificationDecisionHandler, NotificationDecisionHandlerContext } from '../types'
import { log } from '../..'
import { KnownMergeTaskKeys, MergeTaskState } from '../../pr/type'

const IGNORED_MERGE_TASK_KEYS: string[] = [KnownMergeTaskKeys.CODEOWNERS]

export class InProgressMergeTasksHandler implements NotificationDecisionHandler {
  canHandle(context: NotificationDecisionHandlerContext): boolean {
    return context.pr.mergeTasks
      .filter(({ key }) => !IGNORED_MERGE_TASK_KEYS.includes(key))
      .some(task => task.state !== MergeTaskState.SUCCESSFUL)
  }

  handle(): NotificationDecision {
    log.debug(`InProgressMergeTasksHandler: Notification should not be sent because there are in-progress merge tasks.`)

    return {
      sendNotification: false,
    }
  }
}
