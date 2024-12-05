import type { MergeTask, Participant, PullRequest, PullRequestRepository } from './type'
import { Buffer } from 'node:buffer'
import { log } from '..'

class BitBucketClient {
  constructor(private user: string, private token: string) {}

  async fetch(url: string | URL): Promise<any> {
    const credentials = Buffer.from(`${this.user}:${this.token}`).toString('base64')
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error.message)
    }

    return data
  }
}

export class BitBucketPullRequestRepository implements PullRequestRepository {
  private client: BitBucketClient

  constructor(
    private workspace: string,
    private repository: string,
    user: string,
    token: string,
  ) {
    this.client = new BitBucketClient(user, token)
  }

  getRepositoryName(): string {
    return `${this.workspace}/${this.repository}`
  }

  async findOpenPullRequests(): Promise<PullRequest[]> {
    try {
      log.debug('Fetching open pull requests...')
      const url = new URL(`https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repository}/pullrequests`)
      url.searchParams.append('state', 'OPEN')
      url.searchParams.append('pagelen', '50')

      const data = await this.client.fetch(url)

      const pullRequests = await Promise.all(data.values.map(async (pullRequest: PullRequest) => {
        const [mergeTasks, participants] = await Promise.all([this.fetchMergeTasks(pullRequest.id), this.fetchParticipants(pullRequest.id)])
        return {
          ...pullRequest,
          mergeTasks,
          participants,
        }
      }))

      log.trace('Fetched PRs:', pullRequests)

      return pullRequests
    }
    catch (error) {
      log.error('Error fetching PRs:', error)
      return []
    }
  }

  private async fetchMergeTasks(prId: number): Promise<MergeTask[]> {
    try {
      log.debug(`Fetching merge tasks for PR: ${prId}`)
      const data = await this.client.fetch(new URL(`https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repository}/pullrequests/${prId}/statuses`))
      log.trace('Fetched merge tasks:', data)
      return data.values
    }
    catch (error) {
      log.error('Error fetching merge tasks:', error)
      return []
    }
  }

  private async fetchParticipants(prId: number): Promise<Participant[]> {
    try {
      log.debug(`Fetching participants for PR: ${prId}`)
      const data = await this.client.fetch(new URL(`https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repository}/pullrequests/${prId}`))
      log.trace('Fetched participants:', data)

      return data.participants || []
    }
    catch (error) {
      log.error('Error fetching participants:', error)
      return []
    }
  }
}
