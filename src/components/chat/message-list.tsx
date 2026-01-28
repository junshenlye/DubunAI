'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { ConversationNode } from '@/lib/dag/types';

interface MessageListProps {
  nodes: ConversationNode[];
  streamingNodeId: string | null;
  streamingText: string;
}

export function MessageList({ nodes, streamingNodeId, streamingText }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nodes.length, streamingText]);

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
            Start a conversation
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            Type a message to begin. Use <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs">/explore</code> to branch into multiple directions, and <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs">/merge</code> to combine them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {nodes.map(node => (
          <MessageBubble
            key={node.id}
            node={node}
            streamingText={
              node.id === streamingNodeId ? streamingText : undefined
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
