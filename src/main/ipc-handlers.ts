import { ipcMain, dialog, BrowserWindow } from 'electron';
import { processSupervisor } from './services/process-supervisor';
import { openCodeClient } from './services/opencode-client';
import { gitHubAuthService } from './services/github-auth';
import { gitHubApiService } from './services/github-api';
import { gitService } from './services/git-service';
import { workspaceManager } from './services/workspace-manager';
import { settingsManager } from './services/settings-manager';
import open from 'open';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Service status & models
  ipcMain.handle('services:getStatus', async () => {
    return processSupervisor.getStatus();
  });

  ipcMain.handle('services:restart', async () => {
    const settings = settingsManager.getSettings();
    return await processSupervisor.startServices(settings.omniRoutePort, settings.openCodePort);
  });

  ipcMain.handle('models:list', async () => {
    const settings = settingsManager.getSettings();
    return await openCodeClient.getAvailableModels(settings.omniRoutePort);
  });

  ipcMain.handle('models:getActive', async () => {
    return openCodeClient.getActiveModel();
  });

  ipcMain.handle('models:setActive', async (_, modelId: string) => {
    return openCodeClient.setActiveModel(modelId);
  });

  // OpenCode & Chat Sessions
  ipcMain.handle('opencode:createSession', async (_, workspacePath: string, title?: string) => {
    return openCodeClient.createSession(workspacePath, title);
  });

  ipcMain.handle('opencode:getSessions', async (_, workspacePath?: string) => {
    return openCodeClient.getSessions(workspacePath);
  });

  ipcMain.handle('opencode:sendMessage', async (_, sessionId: string, message: string, modelId?: string) => {
    const settings = settingsManager.getSettings();
    await openCodeClient.sendMessage(mainWindow, sessionId, message, modelId, settings.omniRoutePort);
  });

  ipcMain.handle('opencode:abortMessage', async (_, sessionId: string) => {
    openCodeClient.abortMessage(sessionId);
  });

  // GitHub Auth & Repos
  ipcMain.handle('github:getStatus', async () => {
    const token = gitHubAuthService.getToken();
    if (!token) return { authenticated: false };
    const user = await gitHubAuthService.getAuthenticatedUser();
    return {
      authenticated: !!user,
      user: user || undefined,
    };
  });

  ipcMain.handle('github:startLogin', async () => {
    const flow = await gitHubAuthService.startDeviceFlow();
    
    // Automatically open browser for user convenience
    if (flow.verificationUri) {
      open(flow.verificationUri).catch(() => {});
    }

    // In background, poll for token
    gitHubAuthService.pollForToken(flow.deviceCode, flow.interval).then(async () => {
      const user = await gitHubAuthService.getAuthenticatedUser();
      mainWindow.webContents.send('github-auth-changed', { authenticated: !!user, user });
    }).catch(console.error);

    return {
      userCode: flow.userCode,
      verificationUri: flow.verificationUri,
      interval: flow.interval,
    };
  });

  ipcMain.handle('github:logout', async () => {
    gitHubAuthService.logout();
    mainWindow.webContents.send('github-auth-changed', { authenticated: false });
  });

  ipcMain.handle('github:listRepos', async () => {
    return await gitHubApiService.listUserRepositories();
  });

  ipcMain.handle('github:cloneRepo', async (_, repo) => {
    return await workspaceManager.cloneGitHubRepo(repo);
  });

  // Workspaces
  ipcMain.handle('workspaces:list', async () => {
    return workspaceManager.getWorkspaces();
  });

  ipcMain.handle('workspaces:createLocal', async (_, name: string, folderPath?: string) => {
    return await workspaceManager.createLocalWorkspace(name, folderPath);
  });

  ipcMain.handle('workspaces:delete', async (_, id: string) => {
    workspaceManager.deleteWorkspace(id);
  });

  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Git Operations
  ipcMain.handle('git:getStatus', async (_, workspacePath: string) => {
    return await gitService.getStatus(workspacePath);
  });

  ipcMain.handle('git:getDiff', async (_, workspacePath: string, filePath?: string) => {
    return await gitService.getDiff(workspacePath, filePath);
  });

  ipcMain.handle('git:commitAndPush', async (_, workspacePath: string, message: string, branch?: string) => {
    return await gitService.commitAndPush(workspacePath, message, branch);
  });

  ipcMain.handle('git:createBranch', async (_, workspacePath: string, branchName: string) => {
    return await gitService.createBranch(workspacePath, branchName);
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return settingsManager.getSettings();
  });

  ipcMain.handle('settings:update', async (_, partial) => {
    return settingsManager.updateSettings(partial);
  });
}
