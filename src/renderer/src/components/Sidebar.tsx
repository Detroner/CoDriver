import React from 'react';
import { 
  Plus, 
  Folder, 
  MessageSquare, 
  Trash2, 
  Github, 
  FolderPlus,
  ChevronRight
} from 'lucide-react';
import { Workspace, ChatSession } from '../../../types';

interface SidebarProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onCreateLocalWorkspace: () => void;
  onOpenGitHubImport: () => void;
  onDeleteWorkspace: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  currentWorkspace,
  sessions,
  currentSessionId,
  onSelectWorkspace,
  onSelectSession,
  onNewSession,
  onCreateLocalWorkspace,
  onOpenGitHubImport,
  onDeleteWorkspace,
}) => {
  return (
    <aside className="w-64 border-r border-border bg-[#10141b] flex flex-col select-none">
      {/* Workspaces Header & Action */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Workspaces
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={onCreateLocalWorkspace}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-surface-hover rounded"
              title="Create Local Workspace"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenGitHubImport}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-surface-hover rounded"
              title="Clone GitHub Repo"
            >
              <Github className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Workspaces List */}
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {workspaces.map((ws) => {
            const isSelected = currentWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <span className="truncate font-medium">{ws.name}</span>
                </div>
                <button
                  onClick={(e) => onDeleteWorkspace(ws.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {workspaces.length === 0 && (
            <p className="text-[11px] text-gray-500 italic px-2">No active workspaces.</p>
          )}
        </div>
      </div>

      {/* Sessions Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Agent Tasks
          </span>
          <button
            onClick={onNewSession}
            disabled={!currentWorkspace}
            className="flex items-center space-x-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>New Task</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-3">
          {sessions.map((ses) => {
            const isSelected = currentSessionId === ses.id;
            return (
              <button
                key={ses.id}
                onClick={() => onSelectSession(ses)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-surface-hover text-white border border-border shadow-sm'
                    : 'text-gray-400 hover:bg-surface-hover/60 hover:text-gray-200'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-accent' : 'text-gray-500'}`} />
                <div className="truncate flex-1">
                  <p className="truncate font-medium">{ses.title}</p>
                  <p className="text-[10px] text-gray-500 truncate font-mono">
                    {new Date(ses.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
              </button>
            );
          })}
          {sessions.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-500 italic">
              {currentWorkspace ? 'No tasks yet. Click New Task to start!' : 'Select a workspace first.'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
