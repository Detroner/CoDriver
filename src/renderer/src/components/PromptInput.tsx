import React, { useState, useRef, useEffect } from 'react';
import { Square, Sparkles, CornerDownLeft } from 'lucide-react';
import { Workspace } from '../../../types';

interface PromptInputProps {
  currentWorkspace: Workspace | null;
  activeModel: string;
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
  onAbortMessage: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  currentWorkspace,
  activeModel,
  isGenerating,
  onSendMessage,
  onAbortMessage,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || isGenerating) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-4 border-t border-border bg-[#10141b]">
      <div className="relative border border-border focus-within:border-indigo-500 rounded-xl bg-surface transition-all shadow-lg overflow-hidden">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!currentWorkspace}
          placeholder={
            currentWorkspace
              ? `Ask OpenCode with ${activeModel}... (e.g. "Create a REST API with Express", "Fix the failing test")`
              : 'Please select or create a workspace to start coding'
          }
          className="w-full bg-transparent px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none max-h-44 disabled:opacity-50"
        />

        {/* Action Bar */}
        <div className="px-3 py-2 border-t border-border/50 bg-[#12161e] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-[11px]">{activeModel}</span>
          </div>

          <div className="flex items-center space-x-2">
            {isGenerating ? (
              <button
                onClick={onAbortMessage}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || !currentWorkspace}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-indigo-600/20"
              >
                <span>Send</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
