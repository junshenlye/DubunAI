import type { ConversationNode } from './types';
import { walkToRoot } from './traverse';
import { truncate } from '@/lib/utils';

const MAX_RECENT_FULL_NODES = 10;
const MAX_SUMMARY_NODES = 20;

export interface ContextMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

/**
 * Reconstruct the LLM context from the DAG.
 *
 * Strategy: walk parent pointers from currentNodeId to root, then split into:
 * - Recent zone (last N nodes): full content
 * - Summary zone (next M nodes): summaries or truncated output
 * - Discarded zone (older): dropped
 *
 * For merge nodes: the merge output already contains the synthesis,
 * so following parent_ids[0] and including the merge output is sufficient.
 */
export function reconstructContext(
  currentNodeId: string,
  allNodes: Map<string, ConversationNode>
): ContextMessage[] {
  // Walk to root and reverse to chronological order
  const path = walkToRoot(currentNodeId, allNodes);
  path.reverse(); // now [root, ..., parent, current]

  const messages: ContextMessage[] = [];
  const totalNodes = path.length;
  const recentStart = Math.max(0, totalNodes - MAX_RECENT_FULL_NODES);
  const summaryStart = Math.max(0, recentStart - MAX_SUMMARY_NODES);

  // Add summarized older context
  const summaryNodes = path.slice(summaryStart, recentStart);
  if (summaryNodes.length > 0) {
    const summaryText = summaryNodes
      .filter(n => n.role !== 'system')
      .map(n => n.summary || truncate(n.output || n.input, 200))
      .join('\n');

    if (summaryText.trim()) {
      messages.push({
        role: 'user',
        parts: [{ text: `[Earlier conversation summary]:\n${summaryText}` }],
      });
      messages.push({
        role: 'model',
        parts: [{ text: 'Understood. I have the context from our earlier conversation.' }],
      });
    }
  }

  // Add recent full nodes
  const recentNodes = path.slice(recentStart);
  for (const node of recentNodes) {
    if (node.role === 'user') {
      messages.push({
        role: 'user',
        parts: [{ text: node.output || node.input }],
      });
    } else if (node.role === 'assistant') {
      const text = node.output || node.input || '';
      if (text) {
        messages.push({
          role: 'model',
          parts: [{ text }],
        });
      }
    }
  }

  return messages;
}
