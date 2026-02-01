import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PdfFile, ChatMessage as ChatMessageType } from '../types';
import { processAIChatRequest, AIChatResponse } from '../services/geminiService';
import type { Content } from '@google/genai';
import ChatMessage from './ChatMessage';
import TemplateSuggestions from './TemplateSuggestions';

interface AIChatPanelProps {
  files: PdfFile[];
  filesRef: React.MutableRefObject<PdfFile[]>;
  chatMessages: ChatMessageType[];
  aiLoading: boolean;
  onAddChatMessage: (message: ChatMessageType) => void;
  onSetAiLoading: (loading: boolean) => void;
  onAddFile: (file: PdfFile) => void;
  onReplaceFile: (fileId: string, newFile: PdfFile) => void;
}

export default function AIChatPanel({
  files,
  filesRef,
  chatMessages,
  aiLoading,
  onAddChatMessage,
  onSetAiLoading,
  onAddFile,
  onReplaceFile,
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const chatHistoryRef = useRef<Content[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = (messageText || input).trim();
      if (!text || aiLoading) return;

      setInput('');

      // Add user message
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      onAddChatMessage(userMessage);
      onSetAiLoading(true);

      try {
        const response: AIChatResponse = await processAIChatRequest({
          userMessage: text,
          files: filesRef.current,
          chatHistory: chatHistoryRef.current,
          onAddFile,
          onReplaceFile,
        });

        chatHistoryRef.current = response.updatedHistory;

        const assistantMessage: ChatMessageType = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.assistantMessage,
          timestamp: Date.now(),
          operations: response.operations.length > 0 ? response.operations : undefined,
        };
        onAddChatMessage(assistantMessage);
      } catch (error) {
        const errorMessage: ChatMessageType = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: Date.now(),
        };
        onAddChatMessage(errorMessage);
      } finally {
        onSetAiLoading(false);
      }
    },
    [input, aiLoading, filesRef, onAddChatMessage, onSetAiLoading, onAddFile, onReplaceFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleTemplateSelect = useCallback(
    (prompt: string) => {
      handleSend(prompt);
    },
    [handleSend]
  );

  const hasMessages = chatMessages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700 shrink-0">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          May I Help?
        </h2>
        <p className="text-[10px] text-slate-600 mt-0.5">
          AI-powered PDF assistant
        </p>
      </div>

      {/* Template suggestions (shown when no messages) */}
      {!hasMessages && (
        <div className="border-b border-slate-700">
          <TemplateSuggestions files={files} onSelect={handleTemplateSelect} />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3">
        {!hasMessages && (
          <div className="text-center text-slate-500 text-sm mt-6 px-4">
            <p className="text-lg mb-3 text-slate-400 font-medium">AI-Powered PDF Tools</p>
            <div className="text-left space-y-2 text-xs">
              <p className="text-slate-400">I can help you:</p>
              <ul className="space-y-1.5 text-slate-500">
                <li><span className="text-blue-400 font-medium">Merge</span> — Combine pages from multiple files</li>
                <li><span className="text-red-400 font-medium">Delete</span> — Remove specific pages from a file</li>
                <li><span className="text-green-400 font-medium">Extract</span> — Pull pages into a new file</li>
                <li><span className="text-purple-400 font-medium">Complex</span> — Chain multiple operations at once</li>
              </ul>
              <p className="text-slate-600 mt-3 italic">Try a Quick Command above, or type your own request below</p>
            </div>
          </div>
        )}
        {chatMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {aiLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Template suggestions (shown after messages too, collapsed) */}
      {hasMessages && (
        <div className="border-t border-slate-700">
          <TemplateSuggestions files={files} onSelect={handleTemplateSelect} />
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-slate-700 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={files.length === 0 ? 'Upload PDFs first...' : 'Type a command...'}
            disabled={aiLoading || files.length === 0}
            rows={2}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200
              placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || aiLoading || files.length === 0}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-blue-600 self-end"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
