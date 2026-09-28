import React from 'react';
import { 
  Sparkles, 
  GitBranch, 
  Github, 
  RefreshCw, 
  Settings as SettingsIcon,
  FolderGit2
} from 'lucide-react';
import { ServiceStatus, GitHubUser, Workspace, GitStatusResult } from '../../../types';

interface HeaderProps {
  status: ServiceStatus | null;
  activeModel: string;
  gitHubUser: GitHubUser | null;
  currentWorkspace: Workspace | null;
  gitStatus: GitStatusResult | null;
  onOpenModelSelector: () => void;
  onOpenGitHubModal: () => void;
  onOpenGitCommitModal: () => void;
  onOpenSettings: () => void;
  onRestartServices: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeModel,
  gitHubUser,
  currentWorkspace,
  gitStatus,
  onOpenModelSelector,
  onOpenGitHubModal,
  onOpenGitCommitModal,
  onOpenSettings,
  onRestartServices,
}) => {
  const isHealthy = status?.omniRoute.running && status?.openCode.running;
  const modifiedCount = gitStatus?.files.length || 0;

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between select-none">
      {/* Left: Branding & Active Workspace */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            CD
          </div>
          <span className="font-semibold tracking-tight text-white">CoDriver</span>
        </div>

        {currentWorkspace && (
          <div className="flex items-center space-x-2 bg-surface-hover px-3 py-1 rounded-md text-xs border border-border">
            <FolderGit2 className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium text-gray-200">{currentWorkspace.name}</span>
            {gitStatus?.currentBranch && (
              <span className="text-gray-400 flex items-center gap-1 pl-1 border-l border-border">
                <GitBranch className="w-3 h-3" />
                {gitStatus.currentBranch}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center: OmniRoute Model Selector Button */}
      <div className="flex items-center">
        <button
          onClick={onOpenModelSelector}
          className="flex items-center space-x-2 px-3 py-1.5 bg-surface-hover hover:bg-[#282e37] border border-border rounded-lg text-xs font-medium transition-colors"
          title="Click to switch OmniRoute model"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-gray-300 font-mono">{activeModel}</span>
          <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-semibold border border-green-500/20">
            Free/NoAuth
          </span>
        </button>
      </div>

      {/* Right: Git Changes, GitHub Account, Status & Settings */}
      <div className="flex items-center space-x-3">
        {/* Git Review & Push Button */}
        {currentWorkspace && (
          <button
            onClick={onOpenGitCommitModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              modifiedCount > 0
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
                : 'bg-surface-hover text-gray-400 border-border hover:text-gray-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Changes</span>
            {modifiedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-bold text-[10px] flex items-center justify-center">
                {modifiedCount}
              </span>
            )}
          </button>
        )}

        {/* GitHub Login / Profile */}
        <button
          onClick={onOpenGitHubModal}
          className="flex items-center space-x-2 px-2.5 py-1.5 bg-surface-hover hover:bg-[#282e37] border border-border rounded-md text-xs transition-colors"
        >
          <Github className="w-3.5 h-3.5 text-gray-300" />
          {gitHubUser ? (
            <span className="text-gray-200 font-medium">{gitHubUser.login}</span>
          ) : (
            <span className="text-gray-400">Connect GitHub</span>
          )}
        </button>

        {/* Service Status Indicator */}
        <div
          onClick={onRestartServices}
          className="flex items-center space-x-1.5 cursor-pointer px-2 py-1 bg-surface-hover border border-border rounded-md text-[11px]"
          title="OmniRoute + OpenCode Status (Click to restart)"
        >
          <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500'}`} />
          <span className="text-gray-400 font-mono">
            {isHealthy ? 'Ready' : 'Offline'}
          </span>
          <RefreshCw className="w-3 h-3 text-gray-500 hover:text-gray-300" />
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
