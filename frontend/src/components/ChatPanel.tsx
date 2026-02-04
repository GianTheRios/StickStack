import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectDirectory?: string;
  allowShellCommands?: boolean;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-xl ${
          isUser
            ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
        }`}
      >
        <pre className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed">
          {message.content}
        </pre>
      </div>
    </div>
  );
}

export function ChatPanel({
  isOpen,
  onClose,
  projectDirectory,
  allowShellCommands,
}: ChatPanelProps) {
  const { messages, isLoading, sendMessage, cancelMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(input, projectDirectory, allowShellCommands);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] lg:w-[450px] bg-white dark:bg-gray-900 border-l-2 border-gray-900 dark:border-gray-600 shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Chat with Claude
            </h2>
            {isLoading && (
              <span className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400 font-medium">
                <span className="w-1.5 h-1.5 bg-orange-500 dark:bg-orange-400 rounded-full animate-pulse" />
                Thinking...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Project context indicator */}
        {projectDirectory && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="truncate font-medium">{projectDirectory}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
              <span className="text-4xl mb-3">🤖</span>
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="text-xs mt-1">
                Ask Claude anything about your project
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={cancelMessage}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl border-2 border-red-600 dark:border-red-400 transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl border-2 border-gray-900 dark:border-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
  );
}
