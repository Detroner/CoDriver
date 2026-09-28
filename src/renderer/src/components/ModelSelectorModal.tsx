import React, { useState } from 'react';
import { X, Search, Sparkles, Check, Zap, Shield } from 'lucide-react';
import { OmniRouteModel } from '../../../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  models: OmniRouteModel[];
  activeModel: string;
  onSelectModel: (modelId: string) => void;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  models,
  activeModel,
  onSelectModel,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = models.filter((m) =>
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-gray-100">Select OmniRoute Model</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border bg-[#10141b]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search free & no-auth models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Model List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filtered.map((model) => {
            const isSelected = activeModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                    : 'bg-[#10141b] border-border hover:border-gray-600 hover:bg-surface-hover'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-gray-200">{model.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{model.id}</p>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      <Zap className="w-2.5 h-2.5" />
                      {model.provider}
                    </span>
                    {model.noAuth && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Shield className="w-2.5 h-2.5" />
                        No-Auth Required
                      </span>
                    )}
                    {model.isFree && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        100% Free Tier
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-6">No matching models found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
