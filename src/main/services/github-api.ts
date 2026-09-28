import { gitHubAuthService } from './github-auth';
import { GitHubRepo } from '../../types';

export class GitHubApiService {
  public async listUserRepositories(): Promise<GitHubRepo[]> {
    const token = gitHubAuthService.getToken();
    if (!token) {
      throw new Error('Not authenticated with GitHub');
    }

    if (token.startsWith('gho_mock')) {
      return [
        {
          id: 101,
          name: 'my-awesome-project',
          fullName: 'developer/my-awesome-project',
          private: false,
          htmlUrl: 'https://github.com/developer/my-awesome-project',
          cloneUrl: 'https://github.com/developer/my-awesome-project.git',
          defaultBranch: 'main',
          description: 'A sample project to test OpenCode AI coding',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 102,
          name: 'backend-microservice',
          fullName: 'developer/backend-microservice',
          private: true,
          htmlUrl: 'https://github.com/developer/backend-microservice',
          cloneUrl: 'https://github.com/developer/backend-microservice.git',
          defaultBranch: 'main',
          description: 'High throughput backend service',
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CoDriver-Desktop-App',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repos = (await response.json()) as any[];
      return repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        htmlUrl: r.html_url,
        cloneUrl: r.clone_url,
        defaultBranch: r.default_branch || 'main',
        description: r.description,
        updatedAt: r.updated_at,
      }));
    } catch (e: any) {
      console.error('[GitHub API] Failed to fetch repositories:', e);
      throw e;
    }
  }
}

export const gitHubApiService = new GitHubApiService();
