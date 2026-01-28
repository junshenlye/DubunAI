'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ConversationNode } from '@/lib/dag/types';

/**
 * Subscribe to realtime changes on nodes for a conversation.
 * Updates the conversation state when nodes are inserted or updated.
 */
export function useRealtimeNodes(
  conversationId: string | null,
  onNodeChange: (node: ConversationNode) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`nodes:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            onNodeChange(payload.new as unknown as ConversationNode);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNodeChange]);
}
