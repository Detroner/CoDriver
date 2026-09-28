import { app, BrowserWindow } from 'electron';
import path from 'path';
import { processSupervisor } from './services/process-supervisor';
import { registerIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'CoDriver — OpenCode + OmniRoute GUI',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    frame: true,
    titleBarStyle: 'default',
  });

  // Register IPC handlers
  registerIpcHandlers(mainWindow);

  // Load renderer
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createWindow();

  // Start background OpenCode & OmniRoute instances
  try {
    await processSupervisor.startServices();
  } catch (e) {
    console.error('[Main] Service startup error:', e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  processSupervisor.stopServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  processSupervisor.stopServices();
});
