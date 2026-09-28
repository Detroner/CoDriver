import React, { useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BrainCircuit,
  Code2
} from 'lucide-react';
import { ChatMessage, ToolCall } from '../../../types';

interface ChatContainerProps {
  messages: ChatMessage[];
  currentThought?: string;
  isGenerating: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  currentThought,
  isGenerating,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentThought, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 select-text">
      {messages.length === 0 && !isGenerating && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Code2 className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-semibold text-gray-200">
              CoDriver is Ready
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              OpenCode CLI and OmniRoute are auto-configured. Ask questions, plan features, scaffold projects, or debug code in this workspace.
            </p>
          </div>
        </div>
      )}

      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                isUser
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-[#1f242c] border border-border text-indigo-400'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-surface border border-border text-gray-200 shadow-sm'
              }`}
            >
              {/* Agent Thought block */}
              {msg.thought && (
                <div className="mb-3 p-2.5 bg-[#10141b] border border-border/80 rounded-lg text-xs text-gray-400 font-mono space-y-1">
                  <div className="flex items-center space-x-1.5 text-indigo-300">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[11px]">Agent Reasoning</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.thought}</p>
                </div>
              )}

              {/* Tool Calls execution list */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {msg.toolCalls.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-2 bg-[#10141b] border border-border rounded-md text-xs font-mono flex items-center justify-between text-gray-300"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Terminal className="w-3.5 h-3.5 text-accent" />
                        <span className="text-accent font-semibold">{tool.name}</span>
                        <span className="text-gray-500 truncate">
                          {JSON.stringify(tool.arguments)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 pl-2">
                        {tool.status === 'completed' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {tool.status === 'running' && (
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        )}
                        {tool.status === 'failed' && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Message Content */}
              <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
            </div>
          </div>
        );
      })}

      {/* Streaming Active Thought Bubble */}
      {isGenerating && currentThought && (
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 rounded-lg bg-[#1f242c] border border-border flex items-center justify-center text-indigo-400 flex-shrink-0">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
          </div>
          <div className="bg-[#10141b] border border-indigo-500/30 rounded-xl px-4 py-2.5 text-xs text-indigo-200 font-mono flex items-center space-x-2">
            <span className="animate-spin text-indigo-400">⚡</span>
            <span>{currentThought}</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
