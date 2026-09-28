import fs from 'fs';
import path from 'path';
import { BrowserWindow } from 'electron';
import { ChatSession, ChatMessage, OmniRouteModel, ToolCall } from '../../types';
import { getCoDriverDataDir } from './config-builder';

export class OpenCodeClient {
  private sessionsPath = path.join(getCoDriverDataDir(), 'sessions.json');
  private activeSessions: Map<string, ChatSession> = new Map();
  private activeModel: string = 'auto/best-coding';
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.loadSessions();
  }

  private loadSessions(): void {
    if (fs.existsSync(this.sessionsPath)) {
      try {
        const raw = fs.readFileSync(this.sessionsPath, 'utf-8');
        const list = JSON.parse(raw) as ChatSession[];
        list.forEach((s) => this.activeSessions.set(s.id, s));
      } catch (e) {}
    }
  }

  private saveSessions(): void {
    const list = Array.from(this.activeSessions.values());
    fs.writeFileSync(this.sessionsPath, JSON.stringify(list, null, 2), 'utf-8');
  }

  public getActiveModel(): string {
    return this.activeModel;
  }

  public setActiveModel(model: string): boolean {
    this.activeModel = model;
    return true;
  }

  public async getAvailableModels(omniRoutePort = 20128): Promise<OmniRouteModel[]> {
    try {
      const res = await fetch(`http://127.0.0.1:${omniRoutePort}/v1/models`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && data.data) {
          return data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: m.owned_by || 'OmniRoute',
            isFree: m.isFree ?? true,
            noAuth: m.noAuth ?? true,
            contextWindow: m.context_window || 128000,
          }));
        }
      }
    } catch (e) {}

    // Fallback catalog if offline / loading
    return [
      { id: 'auto/best-coding', name: 'Auto: Best Coding Model (Recommended)', provider: 'OmniRoute', isFree: true, noAuth: true, contextWindow: 128000 },
      { id: 'auto/free', name: 'Auto: Free Tier Aggregator', provider: 'OmniRoute', isFree: true, noAuth: true, contextWindow: 64000 },
      { id: 'ddgw/gpt-4o-mini', name: 'DuckDuckGo GPT-4o Mini (NoAuth)', provider: 'DuckDuckGo', isFree: true, noAuth: true, contextWindow: 32000 },
      { id: 'horde/default', name: 'AI Horde Distributed (NoAuth)', provider: 'AI Horde', isFree: true, noAuth: true, contextWindow: 16000 },
      { id: 'openrouter/free', name: 'OpenRouter Free Model Gateway', provider: 'OpenRouter', isFree: true, noAuth: true, contextWindow: 32000 },
    ];
  }

  public createSession(workspacePath: string, title = 'New Agent Task'): ChatSession {
    const session: ChatSession = {
      id: `ses-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      workspacePath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: this.activeModel,
    };

    this.activeSessions.set(session.id, session);
    this.saveSessions();
    return session;
  }

  public getSessions(workspacePath?: string): ChatSession[] {
    const all = Array.from(this.activeSessions.values());
    if (workspacePath) {
      return all.filter((s) => s.workspacePath === workspacePath);
    }
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public abortMessage(sessionId: string): void {
    const ctrl = this.abortControllers.get(sessionId);
    if (ctrl) {
      ctrl.abort();
      this.abortControllers.delete(sessionId);
    }
  }

  public async sendMessage(
    mainWindow: BrowserWindow,
    sessionId: string,
    message: string,
    modelId?: string,
    omniRoutePort = 20128
  ): Promise<void> {
    const targetModel = modelId || this.activeModel;
    const controller = new AbortController();
    this.abortControllers.set(sessionId, controller);

    try {
      const promptPayload = {
        model: targetModel,
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are CoDriver, an expert AI programming assistant running with OpenCode CLI and OmniRoute in an isolated workspace. You write high quality, correct, clean code and assist with git workflows.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      };

      const response = await fetch(`http://127.0.0.1:${omniRoutePort}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer no-key',
        },
        body: JSON.stringify(promptPayload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`OmniRoute error (${response.status}): ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // Emit initial thought or status
      mainWindow.webContents.send('opencode-stream', {
        sessionId,
        thought: `Analyzing workspace and selecting optimal model [${targetModel}]...`,
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine.startsWith(':')) continue;

          if (cleanLine === 'data: [DONE]') {
            mainWindow.webContents.send('opencode-stream', {
              sessionId,
              completed: true,
            });
            return;
          }

          if (cleanLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(cleanLine.substring(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                mainWindow.webContents.send('opencode-stream', {
                  sessionId,
                  chunk: content,
                });
              }
            } catch (e) {}
          }
        }
      }

      mainWindow.webContents.send('opencode-stream', {
        sessionId,
        completed: true,
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        mainWindow.webContents.send('opencode-stream', {
          sessionId,
          chunk: '\n[Generation stopped by user]',
          completed: true,
        });
      } else {
        mainWindow.webContents.send('opencode-stream', {
          sessionId,
          error: e.message || 'An error occurred during communication',
          completed: true,
        });
      }
    } finally {
      this.abortControllers.delete(sessionId);
    }
  }
}

export const openCodeClient = new OpenCodeClient();
