'use client';

import { useCallback, useRef, useState } from 'react';

interface StreamCallbacks {
  onChunk: (text: string, nodeId: string) => void;
  onNodeIds: (userNodeId: string, assistantNodeId: string, sequence: number) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      message: string,
      parentNodeId: string | null,
      branchId: string | null,
      callbacks: StreamCallbacks
    ) => {
      if (isStreaming) return;

      abortRef.current = new AbortController();
      setIsStreaming(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, message, parentNodeId, branchId }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.userNodeId && data.assistantNodeId) {
                callbacks.onNodeIds(data.userNodeId, data.assistantNodeId, data.sequence);
              } else if (data.text) {
                callbacks.onChunk(data.text, data.nodeId);
              } else if (data.done) {
                callbacks.onDone();
              } else if (data.error) {
                callbacks.onError(data.error);
              }
            } catch {
              // Ignore malformed JSON chunks
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          callbacks.onError(error.message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, isStreaming, abort };
}
