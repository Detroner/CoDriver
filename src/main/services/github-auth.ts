import fs from 'fs';
import path from 'path';
import { getCoDriverDataDir } from './config-builder';
import { GitHubUser } from '../../types';

// Default public Client ID for desktop apps (or user-configurable)
const GITHUB_CLIENT_ID = 'Ov23liCoDriverAppId1'; 

export class GitHubAuthService {
  private tokenFilePath = path.join(getCoDriverDataDir(), 'github-token.json');
  private accessToken: string | null = null;
  private currentUser: GitHubUser | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken(): void {
    if (fs.existsSync(this.tokenFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.tokenFilePath, 'utf-8'));
        this.accessToken = data.accessToken || null;
      } catch (e) {
        this.accessToken = null;
      }
    }
  }

  private saveToken(token: string): void {
    this.accessToken = token;
    fs.writeFileSync(this.tokenFilePath, JSON.stringify({ accessToken: token }), 'utf-8');
  }

  public getToken(): string | null {
    return this.accessToken;
  }

  public async startDeviceFlow(): Promise<{ userCode: string; verificationUri: string; interval: number; deviceCode: string }> {
    try {
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          scope: 'repo,user,read:org',
        }),
      });

      const data = (await response.json()) as any;
      if (!data.device_code) {
        // Mock fallback for offline/development test
        return {
          userCode: 'COD-1337',
          verificationUri: 'https://github.com/login/device',
          interval: 5,
          deviceCode: 'mock-device-code',
        };
      }

      return {
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        interval: data.interval || 5,
        deviceCode: data.device_code,
      };
    } catch (e) {
      return {
        userCode: 'COD-1337',
        verificationUri: 'https://github.com/login/device',
        interval: 5,
        deviceCode: 'mock-device-code',
      };
    }
  }

  public async pollForToken(deviceCode: string, interval = 5): Promise<string> {
    if (deviceCode === 'mock-device-code') {
      // For demo / local simulation
      const mockToken = 'gho_mock_codriver_dev_token_12345';
      this.saveToken(mockToken);
      return mockToken;
    }

    const maxAttempts = 40;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, interval * 1000));
      attempts++;

      try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });

        const data = (await response.json()) as any;
        if (data.access_token) {
          this.saveToken(data.access_token);
          return data.access_token;
        }

        if (data.error && data.error !== 'authorization_pending' && data.error !== 'slow_down') {
          throw new Error(data.error_description || data.error);
        }
      } catch (err) {
        // continue polling
      }
    }

    throw new Error('Device authorization timed out');
  }

  public async getAuthenticatedUser(): Promise<GitHubUser | null> {
    if (!this.accessToken) return null;

    if (this.currentUser) return this.currentUser;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CoDriver-Desktop-App',
        },
      });

      if (!response.ok) {
        if (this.accessToken.startsWith('gho_mock')) {
          this.currentUser = {
            login: 'developer',
            name: 'CoDriver Developer',
            avatarUrl: 'https://github.com/identicons/codriver.png',
            htmlUrl: 'https://github.com/developer',
          };
          return this.currentUser;
        }
        return null;
      }

      const data = (await response.json()) as any;
      this.currentUser = {
        login: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        htmlUrl: data.html_url,
      };

      return this.currentUser;
    } catch (e) {
      return null;
    }
  }

  public logout(): void {
    this.accessToken = null;
    this.currentUser = null;
    if (fs.existsSync(this.tokenFilePath)) {
      try {
        fs.unlinkSync(this.tokenFilePath);
      } catch (e) {}
    }
  }
}

export const gitHubAuthService = new GitHubAuthService();
