import type { Block, KnownBlock } from '@slack/web-api'
import type { PullRequest } from '../../../pr/type'
import { NotificationMessages, type NotificationTone } from '../../types'

export function createSlackMessageBlocks(pr: PullRequest, tone: NotificationTone, daysSinceCreation: number): (KnownBlock | Block)[] {
  const participants = pr.participants.filter(p => p.role === 'REVIEWER')
    .map(participant => `${participant.approved ? '⭐️' : '🐢'} ${participant.user.display_name}`)
    .join(', ')

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${tone}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${NotificationMessages[tone]}`,
      },
    },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `${pr.title}`,
      }, {
        type: 'mrkdwn',
        text: `Author: ${pr.author.display_name} | Days Open: ${daysSinceCreation}`,
      }, ...(participants.length > 0
        ? [{
            type: 'mrkdwn',
            text: `Participants: ${participants}`,
          } as const]
        : [])],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👀 Review',
          },
          url: pr.links.html.href,
          action_id: 'noop',
        },
      ],
    },
  ]
}

export function createPlainTextNotification(tone: NotificationTone) {
  return `${tone} - ${NotificationMessages[tone]}`
}
