import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Save, Folder, RefreshCw, Check } from 'lucide-react';
import { AppSettings } from '../../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadSettings = async () => {
    try {
      const s = await window.electronAPI.getSettings();
      setSettings(s);
    } catch (e) {}
  };

  const handleSelectWorkspacesDir = async () => {
    const dir = await window.electronAPI.selectDirectoryDialog();
    if (dir && settings) {
      setSettings({ ...settings, workspacesDir: dir });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setIsSaving(true);
      await window.electronAPI.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-gray-100">Application Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {settings && (
          <div className="p-5 space-y-4 text-xs text-gray-300">
            {/* OmniRoute Port */}
            <div className="space-y-1.5">
              <label className="font-medium text-gray-200 block">OmniRoute Port</label>
              <input
                type="number"
                value={settings.omniRoutePort}
                onChange={(e) =>
                  setSettings({ ...settings, omniRoutePort: parseInt(e.target.value, 10) || 20128 })
                }
                className="w-full px-3 py-1.5 bg-[#10141b] border border-border rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-gray-500">
                Default OpenAI-compatible proxy port (defaults to 20128).
              </p>
            </div>

            {/* OpenCode Port */}
            <div className="space-y-1.5">
              <label className="font-medium text-gray-200 block">OpenCode CLI Server Port</label>
              <input
                type="number"
                value={settings.openCodePort}
                onChange={(e) =>
                  setSettings({ ...settings, openCodePort: parseInt(e.target.value, 10) || 4096 })
                }
                className="w-full px-3 py-1.5 bg-[#10141b] border border-border rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-gray-500">
                Port used for OpenCode CLI headless server instances.
              </p>
            </div>

            {/* Workspaces Directory */}
            <div className="space-y-1.5">
              <label className="font-medium text-gray-200 block">Workspaces Root Directory</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={settings.workspacesDir}
                  className="flex-1 px-3 py-1.5 bg-[#10141b] border border-border rounded-lg text-gray-400 font-mono text-[11px] truncate"
                />
                <button
                  onClick={handleSelectWorkspacesDir}
                  className="px-3 py-1.5 bg-surface-hover hover:bg-border border border-border rounded-lg text-gray-200 flex items-center space-x-1"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Browse</span>
                </button>
              </div>
            </div>

            {/* Auto Prompt for Commit */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-200 block">Automatic Git Diff Notification</span>
                <p className="text-[11px] text-gray-500">
                  Highlight uncommitted changes when OpenCode modifies workspace files.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoCommitPrompt}
                onChange={(e) => setSettings({ ...settings, autoCommitPrompt: e.target.checked })}
                className="rounded bg-[#10141b] border-border text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border bg-[#10141b] flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Settings saved successfully
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-surface-hover rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
