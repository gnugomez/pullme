import type { PullRequest } from '../../../pr/type'
import type { NotificationClient, NotificationTone } from '../../types'
import { WebClient } from '@slack/web-api'
import { differenceInDays } from 'date-fns'
import { createPlainTextNotification, createSlackMessageBlocks } from './messageTemplates'

export class SlackNotificationClient implements NotificationClient {
  private slackClient: WebClient
  private channel: string

  constructor(token: string, channel: string) {
    this.slackClient = new WebClient(token)
    this.channel = channel
  }

  async sendReminder(pr: PullRequest, tone: NotificationTone): Promise<void> {
    const prCreatedDate = new Date(pr.created_on)
    const currentDate = new Date()
    const daysSinceCreation = differenceInDays(currentDate, prCreatedDate)

    await this.ensureBotInChannel().then(() => this.slackClient.chat.postMessage({
      channel: this.channel,
      text: createPlainTextNotification(tone),
      blocks: createSlackMessageBlocks(pr, tone, daysSinceCreation),
    }))
  }

  async sendNotification(message: string): Promise<void> {
    await this.ensureBotInChannel().then(() => this.slackClient.chat.postMessage({
      channel: this.channel,
      text: message,
    }))
  }

  private async ensureBotInChannel(): Promise<void> {
    await this.joinChannel()
  }

  private async joinChannel(): Promise<void> {
    try {
      await this.slackClient.conversations.join({
        channel: this.channel,
      })
    }
    catch (error: any) {
      if (error.data?.error === 'not_in_channel' || error.data?.error === 'channel_not_found') {
        throw new Error(
          `The bot cannot join or access the channel: ${this.channel}. Ensure it is a public channel or invite the bot to a private channel.`,
        )
      }
      throw error
    }
  }
}
