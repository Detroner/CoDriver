import fs from 'fs';
import path from 'path';
import os from 'os';

export interface OpenCodeConfigOptions {
  omniRoutePort: number;
  defaultModel?: string;
  configDir?: string;
}

export function getCoDriverDataDir(): string {
  const baseDir = path.join(os.homedir(), '.codriver');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
}

export function getWorkspacesBaseDir(): string {
  const wsDir = path.join(getCoDriverDataDir(), 'workspaces');
  if (!fs.existsSync(wsDir)) {
    fs.mkdirSync(wsDir, { recursive: true });
  }
  return wsDir;
}

/**
 * Generates and writes opencode.json configured with OmniRoute
 */
export function generateOpenCodeConfig(options: OpenCodeConfigOptions): string {
  const { omniRoutePort, defaultModel = 'auto/best-coding', configDir } = options;
  const targetDir = configDir || path.join(getCoDriverDataDir(), 'config');
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const opencodeConfig = {
    "$schema": "https://opencode.ai/config.json",
    "provider": {
      "omniroute": {
        "npm": "@ai-sdk/openai",
        "name": "OmniRoute AI Gateway",
        "baseURL": `http://127.0.0.1:${omniRoutePort}/v1`,
        "apiKey": "no-key-required",
        "models": {
          "auto/best-coding": {
            "name": "Auto / Best Coding Model",
            "contextWindow": 128000,
            "maxOutputTokens": 8192
          },
          "auto/free": {
            "name": "Auto Free Tier Router",
            "contextWindow": 64000,
            "maxOutputTokens": 4096
          },
          "ddgw/gpt-4o-mini": {
            "name": "DuckDuckGo GPT-4o Mini (NoAuth)",
            "contextWindow": 32000,
            "maxOutputTokens": 4096
          },
          "horde/default": {
            "name": "AI Horde Anonymous (NoAuth)",
            "contextWindow": 16000,
            "maxOutputTokens": 2048
          },
          "openrouter/free": {
            "name": "OpenRouter Free Models",
            "contextWindow": 32000,
            "maxOutputTokens": 4096
          }
        }
      }
    },
    "model": `omniroute/${defaultModel}`,
    "permission": {
      "write": "allow",
      "edit": "allow",
      "shell": "allow",
      "read": "allow"
    },
    "tools": {
      "websearch": true,
      "webfetch": true,
      "execute": true
    }
  };

  const configPath = path.join(targetDir, 'opencode.json');
  fs.writeFileSync(configPath, JSON.stringify(opencodeConfig, null, 2), 'utf-8');
  return configPath;
}

/**
 * Generates omniroute configuration enabling noAuth and free models
 */
export function generateOmniRouteConfig(port: number): string {
  const configDir = path.join(getCoDriverDataDir(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const omniRouteConfig = {
    "server": {
      "port": port,
      "host": "127.0.0.1",
      "cors": true
    },
    "routing": {
      "default_strategy": "auto_fallback",
      "auto_best_coding": {
        "providers": [
          "ddgw",
          "felo",
          "horde",
          "openrouter_free",
          "groq_free"
        ],
        "fallback_on_rate_limit": true
      }
    },
    "providers": {
      "ddgw": { "enabled": true, "noAuth": true },
      "felo": { "enabled": true, "noAuth": true },
      "horde": { "enabled": true, "noAuth": true },
      "cloudflare-playground": { "enabled": true, "noAuth": true }
    }
  };

  const configPath = path.join(configDir, 'omniroute.json');
  fs.writeFileSync(configPath, JSON.stringify(omniRouteConfig, null, 2), 'utf-8');
  return configPath;
}
