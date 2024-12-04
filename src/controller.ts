import type { NotificationManager } from './notification/NotificatonManager'
import type { PullRequestRepository } from './pr/type'
import chalk from 'chalk'
import { formatDistanceToNow } from 'date-fns'
import { log } from '.'
import { NotificationStatus } from './notification/types'
import { limitStringLen } from './utils'

export class PRReviewReminderController {
  constructor(
    private pullRequestRepo: PullRequestRepository,
    private notificationManager: NotificationManager,
  ) { }

  async run() {
    log.info(`Checking for open pull requests in ${this.pullRequestRepo.getRepositoryName()}...`)

    // Fetch open PRs
    const openPRs = await this.pullRequestRepo.findOpenPullRequests()
    log.info(`Found ${openPRs.length} open pull requests.\n`)
    log.info('Digging into...')

    for (const pr of openPRs) {
      try {
        const result = await this.notificationManager.handleNotification(pr)
        if (result.status === NotificationStatus.SENT) {
          log.success(`${limitStringLen(pr.title)} ${chalk.bold.green('SENT')} ${chalk.gray(result.interval.tone)}`)
        }
        else if (result.status === NotificationStatus.PENDING) {
          log.info(`${limitStringLen(pr.title)} ${chalk.bold.blue('PENDING')} ${chalk.gray(`${result.interval.hours}h (${formatDistanceToNow(result.lastNotifiedDate)} ago)`)}`)
        }
        else if (result.status === NotificationStatus.NOT_REQUESTED) {
          log.info(`${limitStringLen(pr.title)} ${chalk.bold.yellow('NOT REQUESTED')}`)
        }
      }
      catch (error) {
        log.error(`Failed to handle notification for PR ${pr.id}:`, error)
      }
    }

    // eslint-disable-next-line no-console
    console.log('\n')
    log.success('All done!')
  }
}
