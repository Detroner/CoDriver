import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  GitCommit, 
  UploadCloud, 
  FileCode, 
  Plus, 
  Trash, 
  Edit3, 
  Check, 
  Loader2,
  FileCheck
} from 'lucide-react';
import { Workspace, GitStatusResult } from '../../../types';

interface GitCommitModalProps {
  isOpen: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const GitCommitModal: React.FC<GitCommitModalProps> = ({
  isOpen,
  workspace,
  onClose,
  onSuccess,
}) => {
  const [gitStatus, setGitStatus] = useState<GitStatusResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('feat: AI code updates via CoDriver');
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [creatingBranch, setCreatingBranch] = useState(false);

  useEffect(() => {
    if (isOpen && workspace) {
      loadStatus();
    }
  }, [isOpen, workspace]);

  if (!isOpen || !workspace) return null;

  const loadStatus = async () => {
    try {
      const status = await window.electronAPI.getGitStatus(workspace.path);
      setGitStatus(status);
      if (status.files.length > 0) {
        handleSelectFile(status.files[0].path);
      } else {
        setSelectedFile(null);
        setFileDiff('');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load git status');
    }
  };

  const handleSelectFile = async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const diff = await window.electronAPI.getGitDiff(workspace.path, filePath);
      setFileDiff(diff || '(New untracked file or empty diff)');
    } catch (e) {
      setFileDiff('');
    }
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) return;

    try {
      setIsCommitting(true);
      setError(null);
      const res = await window.electronAPI.commitAndPush(workspace.path, commitMessage);
      if (!res.success) {
        throw new Error(res.error || 'Failed to commit and push');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to commit & push');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      setCreatingBranch(true);
      await window.electronAPI.createBranch(workspace.path, newBranchName.trim());
      setNewBranchName('');
      await loadStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreatingBranch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-gray-100">Review & Push Changes</h2>
            <span className="text-xs text-gray-400 font-mono px-2 py-0.5 bg-surface-hover rounded border border-border">
              {workspace.name} ({gitStatus?.currentBranch})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex min-h-0">
          {/* Files List Left Panel */}
          <div className="w-72 border-r border-border flex flex-col bg-[#10141b]">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-gray-400">
                Changed Files ({gitStatus?.files.length || 0})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {gitStatus?.files.map((file) => {
                const isSelected = selectedFile === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1 rounded uppercase ${
                        file.status === 'modified'
                          ? 'text-amber-400 bg-amber-500/10'
                          : file.status === 'added' || file.status === 'untracked'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {file.status[0]}
                    </span>
                  </button>
                );
              })}
              {gitStatus?.files.length === 0 && (
                <div className="p-6 text-center text-xs text-gray-500 italic">
                  Working tree clean. No uncommitted changes.
                </div>
              )}
            </div>

            {/* Branch Switcher / Creator */}
            <div className="p-3 border-t border-border bg-surface">
              <label className="text-[11px] font-medium text-gray-400 block mb-1">
                Branch out:
              </label>
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder="new-feature-branch"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-[#10141b] border border-border rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim() || creatingBranch}
                  className="px-2 py-1 bg-surface-hover hover:bg-border text-xs rounded border border-border text-gray-300"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Diff Viewer Right Panel */}
          <div className="flex-1 flex flex-col bg-[#0d1117] min-w-0">
            <div className="p-2.5 border-b border-border bg-[#161b22] flex items-center justify-between">
              <span className="text-xs font-mono text-gray-300 truncate">
                {selectedFile || 'Select a file to inspect diff'}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-3 font-mono text-xs text-gray-300 leading-relaxed select-text">
              {fileDiff ? (
                <pre className="whitespace-pre-wrap">
                  {fileDiff.split('\n').map((line, idx) => {
                    let color = 'text-gray-400';
                    let bg = '';
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                      color = 'text-emerald-400';
                      bg = 'bg-emerald-950/30';
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                      color = 'text-rose-400';
                      bg = 'bg-rose-950/30';
                    } else if (line.startsWith('@@')) {
                      color = 'text-indigo-400 font-semibold';
                    }
                    return (
                      <div key={idx} className={`${color} ${bg} px-1.5 py-0.5 rounded-sm`}>
                        {line || ' '}
                      </div>
                    );
                  })}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 italic">
                  No changes or diff to display.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Commit Action Footer */}
        <div className="p-4 border-t border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
          {error && (
            <span className="text-xs text-rose-400 truncate max-w-sm">{error}</span>
          )}

          <div className="flex-1 max-w-lg w-full">
            <input
              type="text"
              placeholder="Commit message (e.g., feat: implemented login component)"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 bg-[#10141b] border border-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitAndPush}
              disabled={isCommitting || !gitStatus?.files.length}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium rounded-lg text-xs transition-colors shadow-lg shadow-emerald-600/20"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Pushing to GitHub...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Commit & Push</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
