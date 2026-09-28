import fs from 'fs';
import path from 'path';
import { getCoDriverDataDir, getWorkspacesBaseDir } from './config-builder';
import { AppSettings } from '../../types';

export class SettingsManager {
  private settingsFilePath = path.join(getCoDriverDataDir(), 'settings.json');
  private settings: AppSettings = {
    defaultModel: 'auto/best-coding',
    omniRoutePort: 20128,
    openCodePort: 4096,
    workspacesDir: getWorkspacesBaseDir(),
    autoCommitPrompt: true,
    theme: 'dark',
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    if (fs.existsSync(this.settingsFilePath)) {
      try {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      } catch (e) {}
    }
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    return this.settings;
  }
}

export const settingsManager = new SettingsManager();
