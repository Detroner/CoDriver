import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatContainer } from './components/ChatContainer';
import { PromptInput } from './components/PromptInput';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { GitHubModal } from './components/GitHubModal';
import { GitCommitModal } from './components/GitCommitModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  ServiceStatus, 
  OmniRouteModel, 
  GitHubUser, 
  Workspace, 
  ChatSession, 
  ChatMessage, 
  GitStatusResult 
} from '../../types';

export const App: React.FC = () => {
  // Application State
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [models, setModels] = useState<OmniRouteModel[]>([]);
  const [activeModel, setActiveModel] = useState<string>('auto/best-coding');
  const [gitHubUser, setGitHubUser] = useState<GitHubUser | null>(null);
  
  // Workspaces & Sessions
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentThought, setCurrentThought] = useState<string | undefined>(undefined);

  // Git State
  const [gitStatus, setGitStatus] = useState<GitStatusResult | null>(null);

  // Modals
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isGitCommitModalOpen, setIsGitCommitModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. Fetch Service Status
      const status = await window.electronAPI.getServiceStatus();
      setServiceStatus(status);

      // 2. Fetch Models
      const availableModels = await window.electronAPI.getModels();
      setModels(availableModels);

      const active = await window.electronAPI.getActiveModel();
      if (active) setActiveModel(active);

      // 3. Fetch GitHub Auth
      const auth = await window.electronAPI.getGitHubAuthStatus();
      if (auth.authenticated && auth.user) {
        setGitHubUser(auth.user);
      }

      // 4. Fetch Workspaces
      const wsList = await window.electronAPI.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        selectWorkspace(wsList[0]);
      }
    } catch (e) {
      console.error('Initialization error:', e);
    }
  };

  // Listen for openCode streams
  useEffect(() => {
    const unsubscribe = window.electronAPI.onStreamEvent((data) => {
      if (data.thought) {
        setCurrentThought(data.thought);
      }

      if (data.chunk) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + data.chunk },
            ];
          } else {
            return [
              ...prev,
              {
                id: `msg-${Date.now()}`,
                sessionId: data.sessionId,
                role: 'assistant',
                content: data.chunk || '',
                timestamp: Date.now(),
              },
            ];
          }
        });
      }

      if (data.completed || data.error) {
        setIsGenerating(false);
        setCurrentThought(undefined);
        if (currentWorkspace) {
          refreshGitStatus(currentWorkspace.path);
        }
      }
    });

    return () => unsubscribe();
  }, [currentWorkspace]);

  // Periodic Git Status Checker
  useEffect(() => {
    if (!currentWorkspace) return;
    refreshGitStatus(currentWorkspace.path);
    const interval = setInterval(() => {
      refreshGitStatus(currentWorkspace.path);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentWorkspace]);

  const refreshGitStatus = async (wsPath: string) => {
    try {
      const status = await window.electronAPI.getGitStatus(wsPath);
      setGitStatus(status);
    } catch (e) {}
  };

  const selectWorkspace = async (ws: Workspace) => {
    setCurrentWorkspace(ws);
    refreshGitStatus(ws.path);
    const sessList = await window.electronAPI.getSessions(ws.path);
    setSessions(sessList);

    if (sessList.length > 0) {
      setCurrentSessionId(sessList[0].id);
      setMessages([]);
    } else {
      handleCreateNewSession(ws);
    }
  };

  const handleCreateNewSession = async (ws?: Workspace) => {
    const targetWs = ws || currentWorkspace;
    if (!targetWs) return;

    const newSession = await window.electronAPI.createSession(targetWs.path, `Task ${sessions.length + 1}`);
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentSessionId || !currentWorkspace) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: currentSessionId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setCurrentThought('OpenCode agent initializing...');

    try {
      await window.electronAPI.sendMessage(currentSessionId, text, activeModel);
    } catch (e) {
      setIsGenerating(false);
      setCurrentThought(undefined);
    }
  };

  const handleAbortMessage = async () => {
    if (!currentSessionId) return;
    await window.electronAPI.abortMessage(currentSessionId);
    setIsGenerating(false);
    setCurrentThought(undefined);
  };

  const handleSelectModel = async (modelId: string) => {
    setActiveModel(modelId);
    await window.electronAPI.setActiveModel(modelId);
  };

  const handleCreateLocalWorkspace = async () => {
    const folder = await window.electronAPI.selectDirectoryDialog();
    if (!folder) return;
    const name = folder.split(/[/\\]/).pop() || 'local-project';
    const ws = await window.electronAPI.createLocalWorkspace(name, folder);
    setWorkspaces((prev) => [ws, ...prev]);
    selectWorkspace(ws);
  };

  const handleDeleteWorkspace = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await window.electronAPI.deleteWorkspace(id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(null);
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleRestartServices = async () => {
    const newStatus = await window.electronAPI.restartServices();
    setServiceStatus(newStatus);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      {/* Top Header */}
      <Header
        status={serviceStatus}
        activeModel={activeModel}
        gitHubUser={gitHubUser}
        currentWorkspace={currentWorkspace}
        gitStatus={gitStatus}
        onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenGitCommitModal={() => setIsGitCommitModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRestartServices={handleRestartServices}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <Sidebar
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectWorkspace={selectWorkspace}
          onSelectSession={(s) => {
            setCurrentSessionId(s.id);
            setMessages([]);
          }}
          onNewSession={() => handleCreateNewSession()}
          onCreateLocalWorkspace={handleCreateLocalWorkspace}
          onOpenGitHubImport={() => setIsGitHubModalOpen(true)}
          onDeleteWorkspace={handleDeleteWorkspace}
        />

        {/* Center Chat & Agent Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          <ChatContainer
            messages={messages}
            currentThought={currentThought}
            isGenerating={isGenerating}
          />
          <PromptInput
            currentWorkspace={currentWorkspace}
            activeModel={activeModel}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
            onAbortMessage={handleAbortMessage}
          />
        </main>
      </div>

      {/* Modals */}
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        models={models}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        onClose={() => setIsModelSelectorOpen(false)}
      />

      <GitHubModal
        isOpen={isGitHubModalOpen}
        user={gitHubUser}
        onClose={() => setIsGitHubModalOpen(false)}
        onRepoCloned={(ws) => {
          setWorkspaces((prev) => [ws, ...prev]);
          selectWorkspace(ws);
        }}
      />

      <GitCommitModal
        isOpen={isGitCommitModalOpen}
        workspace={currentWorkspace}
        onClose={() => setIsGitCommitModalOpen(false)}
        onSuccess={() => {
          if (currentWorkspace) refreshGitStatus(currentWorkspace.path);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
