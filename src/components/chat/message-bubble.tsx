'use client';

import type { ConversationNode } from '@/lib/dag/types';

interface MessageBubbleProps {
  node: ConversationNode;
  streamingText?: string;
}

export function MessageBubble({ node, streamingText }: MessageBubbleProps) {
  const isUser = node.role === 'user';
  const isMerge = node.type === 'merge';
  const isExploreRoot = node.type === 'explore_root';
  const displayText = streamingText ?? node.output ?? node.input;
  const isStreaming = node.status === 'streaming';
  const isFailed = node.status === 'failed';

  if (isExploreRoot) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm">
          Exploration branches created
        </div>
      </div>
    );
  }

  if (isMerge) {
    return (
      <div className="my-4 mx-auto max-w-2xl">
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
            Merged Branches
          </div>
          <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {displayText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white'
            : isFailed
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {node.branch_label && (
          <div className="text-xs opacity-70 mb-1">{node.branch_label}</div>
        )}
        <div className="whitespace-pre-wrap">{displayText}</div>
        {isStreaming && !streamingText && (
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}
