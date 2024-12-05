export enum KnownMergeTaskKeys {
  CODEOWNERS = 'ch.mibex.codeowner.merge-checks',
}

export enum MergeTaskState {
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  INPROGRESS = 'INPROGRESS',
  STOPPED = 'STOPPED',
}

export interface MergeTask {
  key: KnownMergeTaskKeys | string
  state: MergeTaskState
}

export interface PullRequest {
  id: number
  title: string
  created_on: string
  links: {
    html: {
      href: string
    }
  }
  author: {
    display_name: string
  }
  participants: Array<{
    role: 'REVIEWER' | 'PARTICIPANT'
    user: {
      display_name: string
      account_id: string
    }
    approved: boolean
  }>
  mergeTasks: Array<MergeTask>
}

export interface PullRequestRepository {
  findOpenPullRequests: () => Promise<PullRequest[]>
  getRepositoryName: () => string
}
