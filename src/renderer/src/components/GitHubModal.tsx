import React, { useState, useEffect } from 'react';
import { 
  X, 
  Github, 
  KeyRound, 
  ExternalLink, 
  Download, 
  Search, 
  Lock, 
  Globe, 
  CheckCircle2, 
  Loader2,
  LogOut
} from 'lucide-react';
import { GitHubUser, GitHubRepo, Workspace } from '../../../types';

interface GitHubModalProps {
  isOpen: boolean;
  user: GitHubUser | null;
  onClose: () => void;
  onRepoCloned: (ws: Workspace) => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  user,
  onClose,
  onRepoCloned,
}) => {
  const [deviceFlow, setDeviceFlow] = useState<{ userCode: string; verificationUri: string } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [cloningRepoId, setCloningRepoId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadRepos();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleStartLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      const flow = await window.electronAPI.startGitHubLogin();
      setDeviceFlow({
        userCode: flow.userCode,
        verificationUri: flow.verificationUri,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to start login flow');
      setIsLoggingIn(false);
    }
  };

  const loadRepos = async () => {
    try {
      setLoadingRepos(true);
      setError(null);
      const list = await window.electronAPI.listGitHubRepos();
      setRepos(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleClone = async (repo: GitHubRepo) => {
    try {
      setCloningRepoId(repo.id);
      const ws = await window.electronAPI.cloneGitHubRepo(repo);
      onRepoCloned(ws);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to clone repository');
    } finally {
      setCloningRepoId(null);
    }
  };

  const handleLogout = async () => {
    await window.electronAPI.logoutGitHub();
    setRepos([]);
    setDeviceFlow(null);
    setIsLoggingIn(false);
  };

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5 text-gray-200" />
            <h2 className="font-semibold text-gray-100">GitHub Workspace Integration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {!user ? (
            // Authentication Step
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center border border-border">
                <Github className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Connect your GitHub Account</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Seamlessly clone repositories into isolated workspaces, make AI edits, review diffs, and push commits.
                </p>
              </div>

              {!deviceFlow ? (
                <button
                  onClick={handleStartLogin}
                  disabled={isLoggingIn}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Sign in with GitHub Device Flow</span>
                </button>
              ) : (
                <div className="p-4 bg-[#10141b] border border-border rounded-xl w-full max-w-md space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Your One-Time Code:</span>
                    <span className="font-mono text-lg font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded border border-indigo-500/20">
                      {deviceFlow.userCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    A browser tab has been opened. Enter the code above at GitHub to authorize CoDriver.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-300 pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Waiting for authorization...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Authenticated: Repo Browser
            <div className="space-y-4">
              {/* Profile Bar */}
              <div className="flex items-center justify-between p-3 bg-[#10141b] border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.login}
                    className="w-8 h-8 rounded-full border border-border"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{user.name}</p>
                    <p className="text-xs text-gray-400 font-mono">@{user.login}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search your GitHub repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-[#10141b] border border-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Repositories List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {loadingRepos ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading repositories...</span>
                  </div>
                ) : (
                  filteredRepos.map((repo) => {
                    const isCloning = cloningRepoId === repo.id;
                    return (
                      <div
                        key={repo.id}
                        className="p-3 bg-[#10141b] border border-border hover:border-gray-600 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-0.5 truncate max-w-[70%]">
                          <div className="flex items-center space-x-2 truncate">
                            {repo.private ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-sm text-gray-200 truncate">
                              {repo.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              ({repo.defaultBranch})
                            </span>
                          </div>
                          {repo.description && (
                            <p className="text-xs text-gray-400 truncate">{repo.description}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleClone(repo)}
                          disabled={isCloning}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          {isCloning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Cloning...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Open Workspace</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
                {!loadingRepos && filteredRepos.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-6">No repositories found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
