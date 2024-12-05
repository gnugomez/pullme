import type { PullRequest } from '../../../pr/type'
import type { NotificationClient, NotificationTone } from '../../types'
import { type ChatPostMessageArguments, WebClient } from '@slack/web-api'
import { differenceInDays } from 'date-fns'
import { log } from '../../..'
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

    await this.sendMessageWithRetry({
      channel: this.channel,
      text: createPlainTextNotification(tone),
      blocks: createSlackMessageBlocks(pr, tone, daysSinceCreation),
    })
  }

  async sendNotification(message: string): Promise<void> {
    await this.sendMessageWithRetry({
      channel: this.channel,
      text: message,
    })
  }

  private async sendMessageWithRetry(messagePayload: ChatPostMessageArguments, retries = 2): Promise<void> {
    try {
      await this.slackClient.chat.postMessage(messagePayload)
    }
    catch (error: any) {
      if ((error.data?.error === 'not_in_channel') && retries > 0) {
        log.warn(`The bot is not in the channel: ${this.channel}. Attempting to join the channel...`)
        await this.joinChannel()
        log.info('Successfully joined the channel. Retrying message send...')
        await this.sendMessageWithRetry(messagePayload, retries - 1)
      }
      else {
        throw error
      }
    }
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
