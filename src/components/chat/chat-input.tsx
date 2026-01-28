'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onExplore: () => void;
  onMerge: () => void;
  disabled: boolean;
}

export function ChatInput({ onSendMessage, onExplore, onMerge, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    if (trimmed === '/explore') {
      onExplore();
      setInput('');
      return;
    }

    if (trimmed === '/merge') {
      onMerge();
      setInput('');
      return;
    }

    onSendMessage(trimmed);
    setInput('');
  }, [input, disabled, onSendMessage, onExplore, onMerge]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message, /explore to branch, or /merge to combine..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
