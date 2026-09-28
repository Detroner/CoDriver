export interface OmniRouteModel {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  noAuth: boolean;
  description?: string;
  contextWindow?: number;
}

export interface ServiceStatus {
  omniRoute: {
    running: boolean;
    port: number;
    url: string;
    version?: string;
    error?: string;
  };
  openCode: {
    running: boolean;
    port: number;
    url: string;
    version?: string;
    error?: string;
  };
}

export interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  description: string | null;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  githubRepo?: string;
  branch?: string;
  lastActive: number;
}

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

export interface GitStatusResult {
  currentBranch: string;
  isClean: boolean;
  files: GitFileStatus[];
  ahead: number;
  behind: number;
}

export interface GitDiffResult {
  filePath: string;
  diff: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  toolCalls?: ToolCall[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  workspacePath: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
}

export interface AppSettings {
  defaultModel: string;
  omniRoutePort: number;
  openCodePort: number;
  workspacesDir: string;
  autoCommitPrompt: boolean;
  theme: 'dark' | 'light';
}

export interface ElectronAPI {
  // Service controls & status
  getServiceStatus: () => Promise<ServiceStatus>;
  restartServices: () => Promise<ServiceStatus>;
  getModels: () => Promise<OmniRouteModel[]>;
  getActiveModel: () => Promise<string>;
  setActiveModel: (modelId: string) => Promise<boolean>;

  // OpenCode & Chat
  createSession: (workspacePath: string, title?: string) => Promise<ChatSession>;
  getSessions: (workspacePath?: string) => Promise<ChatSession[]>;
  sendMessage: (sessionId: string, message: string, modelId?: string) => Promise<void>;
  abortMessage: (sessionId: string) => Promise<void>;
  onStreamEvent: (callback: (data: { sessionId: string; chunk?: string; thought?: string; toolCall?: ToolCall; completed?: boolean; error?: string }) => void) => () => void;

  // GitHub Auth & Repos
  getGitHubAuthStatus: () => Promise<{ authenticated: boolean; user?: GitHubUser }>;
  startGitHubLogin: () => Promise<{ userCode: string; verificationUri: string; interval: number }>;
  logoutGitHub: () => Promise<void>;
  listGitHubRepos: () => Promise<GitHubRepo[]>;
  cloneGitHubRepo: (repo: GitHubRepo) => Promise<Workspace>;

  // Workspaces
  getWorkspaces: () => Promise<Workspace[]>;
  createLocalWorkspace: (name: string, folderPath?: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectDirectoryDialog: () => Promise<string | null>;

  // Git Operations
  getGitStatus: (workspacePath: string) => Promise<GitStatusResult>;
  getGitDiff: (workspacePath: string, filePath?: string) => Promise<string>;
  commitAndPush: (workspacePath: string, message: string, branch?: string) => Promise<{ success: boolean; error?: string }>;
  createBranch: (workspacePath: string, branchName: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
