'use client';

import { useCallback, useEffect, useState } from 'react';
import { useConversationContext } from '@/providers/conversation-provider';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useDagNavigation } from '@/hooks/use-dag-navigation';
import { useRealtimeNodes } from '@/hooks/use-realtime-nodes';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { BranchNavigator } from '@/components/navigator/branch-navigator';
import { ExploreProposal } from '@/components/explore/explore-proposal';
import { MergeDialog } from '@/components/merge/merge-dialog';
import { createClient } from '@/lib/supabase/client';
import type { ConversationNode, Conversation, Branch } from '@/lib/dag/types';

interface ChatContainerProps {
  conversationId: string;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const {
    state,
    loadConversation,
    addNode,
    updateNode,
    switchBranch,
    setStreaming,
    showExploreProposal,
    hideExploreProposal,
    addBranches,
    completeMerge,
  } = useConversationContext();

  const { sendMessage, isStreaming } = useChatStream();
  const { displayNodes, latestNode } = useDagNavigation(state.nodes, state.activeBranchId);

  const [streamingNodeId, setStreamingNodeId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);

  // Load conversation data on mount
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const [convRes, nodesRes, branchesRes] = await Promise.all([
        supabase.from('conversations').select().eq('id', conversationId).single(),
        supabase.from('nodes').select().eq('conversation_id', conversationId).order('sequence'),
        supabase.from('branches').select().eq('conversation_id', conversationId).order('created_at'),
      ]);

      if (convRes.data) {
        loadConversation(
          convRes.data as unknown as Conversation,
          (nodesRes.data ?? []) as unknown as ConversationNode[],
          (branchesRes.data ?? []) as unknown as Branch[]
        );
      }
    };

    load();
  }, [conversationId, loadConversation]);

  // Realtime subscription
  const handleNodeChange = useCallback(
    (node: ConversationNode) => {
      if (state.nodes.has(node.id)) {
        updateNode(node.id, node);
      } else {
        addNode(node);
      }
    },
    [state.nodes, updateNode, addNode]
  );

  useRealtimeNodes(conversationId, handleNodeChange);

  // Send a chat message
  const handleSendMessage = useCallback(
    async (message: string) => {
      const parentId = latestNode?.id ?? null;
      const branchId = state.activeBranchId;

      setStreaming(true);
      setStreamingText('');
      setStreamingNodeId(null);

      await sendMessage(conversationId, message, parentId, branchId, {
        onNodeIds: (userNodeId, assistantNodeId, sequence) => {
          // Add user node to state immediately
          addNode({
            id: userNodeId,
            conversation_id: conversationId,
            parent_ids: parentId ? [parentId] : [],
            type: 'user',
            status: 'completed',
            role: 'user',
            input: message,
            reasoning: null,
            output: message,
            summary: null,
            branch_label: null,
            branch_id: branchId,
            merge_strategy: null,
            sequence,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Add assistant node as streaming
          addNode({
            id: assistantNodeId,
            conversation_id: conversationId,
            parent_ids: [userNodeId],
            type: 'assistant',
            status: 'streaming',
            role: 'assistant',
            input: message,
            reasoning: null,
            output: null,
            summary: null,
            branch_label: null,
            branch_id: branchId,
            merge_strategy: null,
            sequence: sequence + 1,
            metadata: { model: 'gemini-2.5-flash' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          setStreamingNodeId(assistantNodeId);
        },
        onChunk: (text, nodeId) => {
          setStreamingText(prev => prev + text);
          setStreamingNodeId(nodeId);
        },
        onDone: () => {
          // Update the node with full output
          if (streamingNodeId) {
            updateNode(streamingNodeId, {
              status: 'completed',
              output: streamingText,
            });
          }
          setStreaming(false);
          setStreamingNodeId(null);
          setStreamingText('');
        },
        onError: (error) => {
          console.error('Stream error:', error);
          setStreaming(false);
          setStreamingNodeId(null);
          setStreamingText('');
        },
      });
    },
    [conversationId, latestNode, state.activeBranchId, sendMessage, addNode, updateNode, setStreaming, streamingNodeId, streamingText]
  );

  // Trigger /explore
  const handleExplore = useCallback(async () => {
    const currentNodeId = latestNode?.id;
    if (!currentNodeId) return;

    setExploreLoading(true);
    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, currentNodeId }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      showExploreProposal(data.options, data.exploreRootNodeId);
    } catch (error) {
      console.error('Explore error:', error);
    } finally {
      setExploreLoading(false);
    }
  }, [conversationId, latestNode, showExploreProposal]);

  // Confirm explore — create branches
  const handleConfirmExplore = useCallback(
    async (selectedOptionIds: string[]) => {
      if (!state.exploreProposal) return;

      const { options, exploreRootNodeId } = state.exploreProposal;
      const selectedOptions = options.filter(o => selectedOptionIds.includes(o.id));

      hideExploreProposal();

      const supabase = createClient();
      const newBranches: Branch[] = [];

      for (const option of selectedOptions) {
        // Create branch record
        const { data: branchRaw } = await supabase
          .from('branches')
          .insert({
            conversation_id: conversationId,
            label: option.label,
            description: option.description,
            parent_node_id: exploreRootNodeId,
          })
          .select()
          .single();

        if (!branchRaw) continue;
        const branch = branchRaw as unknown as Branch;

        // Create the initial explore_branch node
        const { data: branchNodeRaw } = await supabase
          .from('nodes')
          .insert({
            conversation_id: conversationId,
            parent_ids: [exploreRootNodeId],
            type: 'explore_branch' as const,
            status: 'completed' as const,
            role: 'assistant' as const,
            input: option.initial_prompt,
            output: option.initial_prompt,
            branch_id: branch.id,
            branch_label: option.label,
            sequence: 0,
            metadata: { model: 'gemini-2.5-flash' },
          })
          .select()
          .single();

        if (branchNodeRaw) {
          const branchNode = branchNodeRaw as unknown as ConversationNode;
          await supabase
            .from('branches')
            .update({ root_node_id: branchNode.id })
            .eq('id', branch.id);

          addNode(branchNode);
        }

        newBranches.push(branch);
      }

      if (newBranches.length > 0) {
        addBranches(newBranches);
        switchBranch(newBranches[0].id);
      }
    },
    [state.exploreProposal, conversationId, hideExploreProposal, addNode, addBranches, switchBranch]
  );

  // Trigger /merge
  const handleMerge = useCallback(() => {
    const activeBranches = state.branches.filter(b => b.status === 'active');
    if (activeBranches.length < 2) {
      console.warn('Need at least 2 active branches to merge');
      return;
    }
    setShowMergeDialog(true);
  }, [state.branches]);

  // Confirm merge
  const handleConfirmMerge = useCallback(
    async (branchIds: string[]) => {
      setShowMergeDialog(false);

      try {
        const response = await fetch('/api/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, branchIds }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        completeMerge(data.mergeNode as ConversationNode, branchIds);
      } catch (error) {
        console.error('Merge error:', error);
      }
    },
    [conversationId, completeMerge]
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Branch navigator */}
      <BranchNavigator
        branches={state.branches}
        activeBranchId={state.activeBranchId}
        onSwitchBranch={switchBranch}
      />

      {/* Messages */}
      <MessageList
        nodes={displayNodes}
        streamingNodeId={streamingNodeId}
        streamingText={streamingText}
      />

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onExplore={handleExplore}
        onMerge={handleMerge}
        disabled={isStreaming || exploreLoading}
      />

      {/* Explore proposal modal */}
      {state.exploreProposal && (
        <ExploreProposal
          options={state.exploreProposal.options}
          onConfirm={handleConfirmExplore}
          onCancel={hideExploreProposal}
        />
      )}

      {/* Merge dialog */}
      {showMergeDialog && (
        <MergeDialog
          branches={state.branches.filter(b => b.status === 'active')}
          onConfirm={handleConfirmMerge}
          onCancel={() => setShowMergeDialog(false)}
        />
      )}
    </div>
  );
}
