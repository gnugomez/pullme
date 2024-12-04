import path from 'node:path'
import process from 'node:process'
import { Command } from 'commander'
import { createConsola } from 'consola'
import { PRReviewReminderController } from './controller'
import { SlackNotificationClient } from './notification/client/slack/SlackNotificationClient'
import { InProgressMergeTasksHandler } from './notification/handlers/InProgressMergeTasksHandler'
import { IntervalExceededHandler } from './notification/handlers/IntervalExceededHandler'
import { NoPriorRecordHandler } from './notification/handlers/NoPriorRecordHandler'
import { FileNotificationHistoryRepository } from './notification/history/FileNotificationHistoryRepository'
import { NotificationManager } from './notification/NotificatonManager'
import { NotificationTone } from './notification/types'
import { BitBucketPullRequestRepository } from './pr/BitBucketPullRequestRepository'

export const log = createConsola()

interface ProgramOptions {
  token: string
  username: string
  workspace: string
  repository: string
  channel: string
  slackToken: string
  pollingInterval?: string
  logLevel: string
  notificationTrackerPath: string
}

async function runPeriodically(fn: () => Promise<void>, waitTimeMs: number) {
  log.info('Starting press Ctrl+C to stop')
  while (true) {
    await fn()
    log.info(`Waiting for ${waitTimeMs / 1000} seconds before next run (press Ctrl+C to stop)...`)
    await new Promise(resolve => setTimeout(resolve, waitTimeMs))
  }
}

async function main() {
  const program = new Command('pullme')

  program
    .description('CLI tool to remind about Bitbucket pull requests')
    .requiredOption('-t, --token <token>', 'Bitbucket token')
    .requiredOption('-u, --username <username>', 'Bitbucket username')
    .requiredOption('-w, --workspace <workspace>', 'Bitbucket workspace')
    .requiredOption('-r, --repository <repository>', 'Bitbucket repository')
    .requiredOption('-c, --channel <channel>', 'Slack channel')
    .requiredOption('-st, --slack-token <slackToken>', 'Slack token')
    .option('-p, --polling-interval <interval>', 'Polling interval in seconds')
    .option('-l, --log-level <level>', 'Log level', '3')
    .option('-n, --notification-tracker-path <path>', 'Notification tracker path', path.join(process.cwd(), 'pr_notification_tracker.json'))
    .parse(process.argv)

  const options = program.opts<ProgramOptions>()

  log.level = Number.parseInt(options.logLevel)

  const pullRequestRepo = new BitBucketPullRequestRepository(
    options.workspace,
    options.repository,
    options.username,
    options.token,
  )

  const notificationHistoryRepo = new FileNotificationHistoryRepository(
    options.notificationTrackerPath,
  )

  const communicationClient = new SlackNotificationClient(options.slackToken, options.channel)

  const intervals = [
    { tone: NotificationTone.FRIENDLY_REMINDER, hours: 0 },
    { tone: NotificationTone.SLOWING_DOWN, hours: 3 },
    { tone: NotificationTone.URGENT_REVIEW_REQUEST, hours: 24 },
    { tone: NotificationTone.CRITICAL, hours: 36 },
  ]

  const notificationDecisionHandlers = [
    new InProgressMergeTasksHandler(),
    new NoPriorRecordHandler(),
    new IntervalExceededHandler(),
  ]

  const notificationManager = new NotificationManager(
    notificationHistoryRepo,
    communicationClient,
    intervals,
    notificationDecisionHandlers,
  )

  const prReminder = new PRReviewReminderController(
    pullRequestRepo,
    notificationManager,
  )

  if (!options.pollingInterval) {
    await prReminder.run()
    return
  }

  await runPeriodically(() => prReminder.run(), Number.parseInt(options.pollingInterval) * 1000)
}

main().catch(log.fatal)
