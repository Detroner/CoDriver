import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import { GitStatusResult, GitFileStatus } from '../../types';
import { gitHubAuthService } from './github-auth';

export class GitService {
  private getGit(workspacePath: string): SimpleGit {
    if (!fs.existsSync(workspacePath)) {
      throw new Error(`Workspace path does not exist: ${workspacePath}`);
    }
    return simpleGit(workspacePath);
  }

  public async getStatus(workspacePath: string): Promise<GitStatusResult> {
    const git = this.getGit(workspacePath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        currentBranch: 'none',
        isClean: true,
        files: [],
        ahead: 0,
        behind: 0,
      };
    }

    const status = await git.status();
    const files: GitFileStatus[] = [];

    status.modified.forEach((f) => files.push({ path: f, status: 'modified', staged: false }));
    status.created.forEach((f) => files.push({ path: f, status: 'added', staged: false }));
    status.deleted.forEach((f) => files.push({ path: f, status: 'deleted', staged: false }));
    status.renamed.forEach((f) => files.push({ path: f.to, status: 'renamed', staged: false }));
    status.not_added.forEach((f) => files.push({ path: f, status: 'untracked', staged: false }));

    return {
      currentBranch: status.current || 'main',
      isClean: status.isClean(),
      files,
      ahead: status.ahead,
      behind: status.behind,
    };
  }

  public async getDiff(workspacePath: string, filePath?: string): Promise<string> {
    const git = this.getGit(workspacePath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return '';

    if (filePath) {
      return await git.diff([filePath]);
    }
    return await git.diff();
  }

  public async createBranch(workspacePath: string, branchName: string): Promise<boolean> {
    const git = this.getGit(workspacePath);
    await git.checkoutLocalBranch(branchName);
    return true;
  }

  public async commitAndPush(
    workspacePath: string,
    message: string,
    branch?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const git = this.getGit(workspacePath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return { success: false, error: 'Not a git repository' };
      }

      // Stage all modified & new files
      await git.add('.');

      // Commit
      await git.commit(message);

      // Push to remote if authenticated
      const token = gitHubAuthService.getToken();
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');

      if (origin && token && !token.startsWith('gho_mock')) {
        const currentStatus = await git.status();
        const targetBranch = branch || currentStatus.current || 'main';
        
        // Push using authenticated remote URL if needed
        await git.push('origin', targetBranch, ['--set-upstream']);
      }

      return { success: true };
    } catch (e: any) {
      console.error('[GitService] Commit/Push error:', e);
      return { success: false, error: e.message };
    }
  }
}

export const gitService = new GitService();
