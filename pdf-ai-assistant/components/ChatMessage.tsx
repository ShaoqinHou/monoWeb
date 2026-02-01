import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-msg-enter flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm
          ${isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-200'
          }`}
      >
        {/* Message text */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Operations list (assistant only) */}
        {message.operations && message.operations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Operations performed:
            </p>
            {message.operations.map((op, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300 mt-0.5">
                <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                  op.type === 'merge' ? 'bg-blue-400' :
                  op.type === 'delete' ? 'bg-red-400' :
                  op.type === 'extract' ? 'bg-green-400' :
                  op.type === 'insert' ? 'bg-purple-400' :
                  'bg-slate-400'
                }`} />
                <span>{op.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
