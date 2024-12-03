import { log } from "../..";
import { MergeTaskState, KnownMergeTaskKeys } from "../../pr/type";
import type { NotificationDecision, NotificationDecisionHandler, NotificationDecisionHandlerContext } from "../types";

const IGNORED_MERGE_TASK_KEYS: string[] = [KnownMergeTaskKeys.CODEOWNERS];

export class InProgressMergeTasksHandler implements NotificationDecisionHandler {
  canHandle(context: NotificationDecisionHandlerContext): boolean {
    return context.pr.mergeTasks
    .filter(({ key }) => !IGNORED_MERGE_TASK_KEYS.includes(key))
    .some(task => task.state !== MergeTaskState.SUCCESSFUL);
  }

  handle(): NotificationDecision {
    log.debug(`InProgressMergeTasksHandler: Notification should not be sent because there are in-progress merge tasks.`);

    return {
      sendNotification: false,
    }
  }
}