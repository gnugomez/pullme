import { log } from "..";
import type { MergeTask, PullRequest, PullRequestRepository } from "./type";

export class BitBucketPullRequestRepository implements PullRequestRepository {
  constructor(
    private workspace: string,
    private repository: string,
    private user: string,
    private token: string
  ) { }

  getRepositoryName(): string {
    return `${this.workspace}/${this.repository}`;
  }

  async findOpenPullRequests(): Promise<PullRequest[]> {
    try {
      log.debug('Fetching open pull requests...');
      const credentials = Buffer.from(`${this.user}:${this.token}`).toString('base64');
      const url = new URL(`https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repository}/pullrequests`);
      url.searchParams.append('state', 'OPEN');
      url.searchParams.append('pagelen', '50');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error.message);
      }


      const pullRequestsWithMergeTasks = await Promise.all(data.values.map(async (pr: PullRequest) => {
        pr.mergeTasks = await this.fetchMergeTasks(pr.id);
        return pr;
      }));

      log.trace('Fetched PRs:', pullRequestsWithMergeTasks);

      return pullRequestsWithMergeTasks;
    } catch (error) {
      log.error('Error fetching PRs:', error);
      return [];
    }
  }

  private async fetchMergeTasks(prId: number): Promise<MergeTask[]> {
    try {
      log.debug(`Fetching merge tasks for PR: ${prId}`);
      const credentials = Buffer.from(`${this.user}:${this.token}`).toString('base64');
      const url = new URL(`https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repository}/pullrequests/${prId}/statuses`);
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error.message);
      }

      log.trace('Fetched merge tasks:', data);
      return data.values;
    } catch (error) {
      log.error('Error fetching merge tasks:', error);
      return [];
    }
  }
}
