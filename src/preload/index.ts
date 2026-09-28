import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI, GitHubRepo, AppSettings } from '../types';

const api: ElectronAPI = {
  // Service controls & status
  getServiceStatus: () => ipcRenderer.invoke('services:getStatus'),
  restartServices: () => ipcRenderer.invoke('services:restart'),
  getModels: () => ipcRenderer.invoke('models:list'),
  getActiveModel: () => ipcRenderer.invoke('models:getActive'),
  setActiveModel: (modelId: string) => ipcRenderer.invoke('models:setActive', modelId),

  // OpenCode & Chat
  createSession: (workspacePath: string, title?: string) => ipcRenderer.invoke('opencode:createSession', workspacePath, title),
  getSessions: (workspacePath?: string) => ipcRenderer.invoke('opencode:getSessions', workspacePath),
  sendMessage: (sessionId: string, message: string, modelId?: string) => ipcRenderer.invoke('opencode:sendMessage', sessionId, message, modelId),
  abortMessage: (sessionId: string) => ipcRenderer.invoke('opencode:abortMessage', sessionId),
  onStreamEvent: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('opencode-stream', handler);
    return () => {
      ipcRenderer.removeListener('opencode-stream', handler);
    };
  },

  // GitHub Auth & Repos
  getGitHubAuthStatus: () => ipcRenderer.invoke('github:getStatus'),
  startGitHubLogin: () => ipcRenderer.invoke('github:startLogin'),
  logoutGitHub: () => ipcRenderer.invoke('github:logout'),
  listGitHubRepos: () => ipcRenderer.invoke('github:listRepos'),
  cloneGitHubRepo: (repo: GitHubRepo) => ipcRenderer.invoke('github:cloneRepo', repo),

  // Workspaces
  getWorkspaces: () => ipcRenderer.invoke('workspaces:list'),
  createLocalWorkspace: (name: string, folderPath?: string) => ipcRenderer.invoke('workspaces:createLocal', name, folderPath),
  deleteWorkspace: (id: string) => ipcRenderer.invoke('workspaces:delete', id),
  selectDirectoryDialog: () => ipcRenderer.invoke('dialog:selectDirectory'),

  // Git Operations
  getGitStatus: (workspacePath: string) => ipcRenderer.invoke('git:getStatus', workspacePath),
  getGitDiff: (workspacePath: string, filePath?: string) => ipcRenderer.invoke('git:getDiff', workspacePath, filePath),
  commitAndPush: (workspacePath: string, message: string, branch?: string) => ipcRenderer.invoke('git:commitAndPush', workspacePath, message, branch),
  createBranch: (workspacePath: string, branchName: string) => ipcRenderer.invoke('git:createBranch', workspacePath, branchName),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', settings),
};

contextBridge.exposeInMainWorld('electronAPI', api);
