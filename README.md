# CoDriver — All-in-One Desktop GUI for OpenCode CLI & OmniRoute

**CoDriver** is a native Electron desktop application for PC that combines **OpenCode CLI** and **OmniRoute AI Gateway** into an intuitive, zero-configuration GUI with built-in **GitHub Workspace Isolation** and interactive Git diff/commit tracking.

---

## 🌟 Key Features

1. **Auto-Configured OpenCode CLI & OmniRoute**
   - Spawns and manages OmniRoute and OpenCode CLI background processes with automatic port conflict resolution.
   - Automatically generates and synchronizes `opencode.json` with OmniRoute OpenAI-compatible endpoints (`http://127.0.0.1:20128/v1`).
   - Default routing set to `omniroute/auto/best-coding` out of the box.

2. **NoAuth & Free AI Model Aggregation**
   - Pre-configured to utilize no-auth and free tier models without mandatory billing:
     - `auto/best-coding`: Dynamic model router selecting the best available free coding models with automatic fallback.
     - `auto/free`: General free provider aggregator.
     - `ddgw/gpt-4o-mini`: DuckDuckGo anonymous AI chat endpoint.
     - `horde/default`: AI Horde decentralized anonymous AI engine.
     - `openrouter/free`: OpenRouter free tier models.
   - User-selectable model switcher directly in the GUI header.

3. **Isolated GitHub Workspaces**
   - One-click GitHub login via **OAuth Device Authorization Flow** (`https://github.com/login/device`).
   - Search and select your GitHub repositories.
   - Automatically clones repositories into an isolated directory (`~/.codriver/workspaces/<owner>-<repo>`).
   - Scopes OpenCode CLI file editing and terminal execution strictly to that workspace folder.

4. **Interactive Git Review & Push**
   - Real-time Git status detection for modified, added, deleted, and untracked files.
   - Side-by-side colorized unified diff inspector.
   - Create new feature branches with one click.
   - Interactive prompt allowing users to review AI changes, write a commit message, and push directly to GitHub.

---

## 🏗️ Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                  CoDriver Electron Desktop                   │
 │                                                             │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │        Renderer Process (React 18 + TailwindCSS)       │  │
 │  │  • Model Selector (auto/best-coding, noAuth free)     │  │
 │  │  • GitHub Importer & Device Flow Auth Modal           │  │
 │  │  • Real-Time Agent Reasoning & SSE Chat Stream        │  │
 │  │  • Unified Git Diff Viewer & Push Interface           │  │
 │  └──────────────────────────┬────────────────────────────┘  │
 │                             │ IPC Bridge (contextBridge)    │
 │  ┌──────────────────────────▼────────────────────────────┐  │
 │  │                     Main Process                      │  │
 │  │  • Process Supervisor (OmniRoute + OpenCode CLI)       │  │
 │  │  • Port Manager & Health Check Poller                 │  │
 │  │  • Config Builder (opencode.json & omniroute.json)    │  │
 │  │  • Git Service (simple-git diff/commit/push)          │  │
 │  │  • GitHub API Service (Octokit / Device Flow)         │  │
 │  │  • Workspace Manager (~/.codriver/workspaces/)        │  │
 │  └──────────────┬────────────────────────┬───────────────┘  │
 └─────────────────┼────────────────────────┼──────────────────┘
                   │                        │
       ┌───────────▼──────────┐ ┌───────────▼──────────┐
       │     OmniRoute        │ │     OpenCode CLI     │
       │   (Port: 20128)      │ │   (Port: 4096)       │
       │  Auto Free Routing   │ │  Agentic Code Engine │
       └──────────────────────┘ └──────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or higher)
- **npm** or **yarn** / **pnpm**
- **Git** installed on your PC

### 1. Installation

Clone or open the project folder in your terminal:

```bash
cd C:\Users\rgryt\Desktop\CoDriver
npm install
```

### 2. Development Mode

Start both the Vite frontend and the Electron application in hot-reload mode:

```bash
npm run dev:electron
```

### 3. Packaging & Windows Distribution

Build the production binaries and generate a standalone Windows NSIS installer:

```bash
npm run package:win
```

The installer executable (`.exe`) will be generated inside the `release/` folder.

---

## 📁 Project Directory Structure

```
CoDriver/
├── package.json
├── tsconfig.json
├── tsconfig.electron.json
├── vite.config.ts
├── tailwind.config.js
├── electron-builder.yml
├── src/
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript interfaces & IPC definitions
│   ├── main/
│   │   ├── index.ts                 # Electron Main lifecycle & window creation
│   │   ├── ipc-handlers.ts          # IPC route registration
│   │   └── services/
│   │       ├── process-supervisor.ts# OmniRoute & OpenCode CLI lifecycle manager
│   │       ├── port-manager.ts      # Dynamic port conflict resolution
│   │       ├── config-builder.ts    # opencode.json & omniroute.json generator
│   │       ├── github-auth.ts       # GitHub OAuth Device Flow implementation
│   │       ├── github-api.ts        # GitHub repository search & metadata
│   │       ├── git-service.ts       # Git diff, staging, commit & push engine
│   │       ├── workspace-manager.ts # Isolated workspace directory management
│   │       ├── opencode-client.ts   # SSE chat streaming & session manager
│   │       └── settings-manager.ts  # Persistent app configuration
│   ├── preload/
│   │   └── index.ts                 # Secure contextBridge API exposer
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx             # React DOM root entry
│           ├── index.css            # Tailwind base & custom scrollbars
│           ├── App.tsx              # Main layout & application state orchestration
│           └── components/
│               ├── Header.tsx       # Status bar, active model pill & GitHub user
│               ├── Sidebar.tsx      # Workspaces & chat sessions sidebar
│               ├── ModelSelectorModal.tsx # Free/NoAuth OmniRoute model picker
│               ├── GitHubModal.tsx  # GitHub Device login & repo clone browser
│               ├── GitCommitModal.tsx # Diff viewer & interactive commit/push
│               ├── ChatContainer.tsx# Streaming bubbles, agent reasoning & tools
│               ├── PromptInput.tsx  # Dynamic textarea with send/stop buttons
│               └── SettingsModal.tsx# Port & storage directory settings
```

---

## 🔒 Security & Workspace Isolation

- Workspaces are stored in dedicated subdirectories under `~/.codriver/workspaces/`.
- File writes, bash commands, and edits triggered by OpenCode are strictly restricted to the selected workspace folder.
- All Git operations verify working tree integrity and require explicit user review through the Diff Inspector before committing or pushing to GitHub remotes.
