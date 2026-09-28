import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import { getWorkspacesBaseDir, getCoDriverDataDir } from './config-builder';
import { Workspace, GitHubRepo } from '../../types';
import { gitHubAuthService } from './github-auth';

export class WorkspaceManager {
  private metadataPath = path.join(getCoDriverDataDir(), 'workspaces.json');
  private workspaces: Workspace[] = [];

  constructor() {
    this.loadWorkspaces();
  }

  private loadWorkspaces(): void {
    if (fs.existsSync(this.metadataPath)) {
      try {
        const raw = fs.readFileSync(this.metadataPath, 'utf-8');
        this.workspaces = JSON.parse(raw);
      } catch (e) {
        this.workspaces = [];
      }
    }
  }

  private saveWorkspaces(): void {
    fs.writeFileSync(this.metadataPath, JSON.stringify(this.workspaces, null, 2), 'utf-8');
  }

  public getWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  public async createLocalWorkspace(name: string, folderPath?: string): Promise<Workspace> {
    const wsPath = folderPath || path.join(getWorkspacesBaseDir(), name.replace(/[^a-zA-Z0-9_-]/g, '_'));
    if (!fs.existsSync(wsPath)) {
      fs.mkdirSync(wsPath, { recursive: true });
      const git = simpleGit(wsPath);
      await git.init();
      fs.writeFileSync(path.join(wsPath, 'README.md'), `# ${name}\n\nCreated with CoDriver.`, 'utf-8');
    }

    const workspace: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      path: wsPath,
      lastActive: Date.now(),
    };

    this.workspaces.unshift(workspace);
    this.saveWorkspaces();
    return workspace;
  }

  public async cloneGitHubRepo(repo: GitHubRepo): Promise<Workspace> {
    const safeFolderName = repo.fullName.replace('/', '-');
    const targetDir = path.join(getWorkspacesBaseDir(), safeFolderName);

    // Check if already cloned
    const existing = this.workspaces.find((w) => w.path === targetDir);
    if (existing && fs.existsSync(targetDir)) {
      existing.lastActive = Date.now();
      this.saveWorkspaces();
      return existing;
    }

    if (fs.existsSync(targetDir)) {
      // already exists on disk
      const ws: Workspace = {
        id: `ws-${Date.now()}`,
        name: repo.name,
        path: targetDir,
        githubRepo: repo.fullName,
        branch: repo.defaultBranch,
        lastActive: Date.now(),
      };
      this.workspaces.unshift(ws);
      this.saveWorkspaces();
      return ws;
    }

    // Clone repo
    const token = gitHubAuthService.getToken();
    let cloneUrl = repo.cloneUrl;

    if (token && !token.startsWith('gho_mock')) {
      // Inject token for private repo clone
      cloneUrl = cloneUrl.replace('https://', `https://${token}@`);
    }

    try {
      if (token?.startsWith('gho_mock')) {
        // Create mock repository directory for development/demo
        fs.mkdirSync(targetDir, { recursive: true });
        const git = simpleGit(targetDir);
        await git.init();
        fs.writeFileSync(
          path.join(targetDir, 'README.md'),
          `# ${repo.name}\n\n${repo.description || 'Cloned repository workspace.'}\n`,
          'utf-8'
        );
        fs.writeFileSync(
          path.join(targetDir, 'index.js'),
          `console.log("Hello from ${repo.name}!");\n`,
          'utf-8'
        );
        await git.add('.');
        await git.commit('Initial clone commit');
      } else {
        await simpleGit().clone(cloneUrl, targetDir);
      }

      const workspace: Workspace = {
        id: `ws-${Date.now()}`,
        name: repo.name,
        path: targetDir,
        githubRepo: repo.fullName,
        branch: repo.defaultBranch,
        lastActive: Date.now(),
      };

      this.workspaces.unshift(workspace);
      this.saveWorkspaces();
      return workspace;
    } catch (e: any) {
      console.error('[WorkspaceManager] Clone failed:', e);
      throw new Error(`Failed to clone ${repo.fullName}: ${e.message}`);
    }
  }

  public deleteWorkspace(id: string): void {
    this.workspaces = this.workspaces.filter((w) => w.id !== id);
    this.saveWorkspaces();
  }
}

export const workspaceManager = new WorkspaceManager();
