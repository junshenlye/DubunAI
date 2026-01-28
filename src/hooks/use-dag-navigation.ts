'use client';

import { useMemo } from 'react';
import { getDisplayNodes, getLatestNode } from '@/lib/dag/traverse';
import type { ConversationNode } from '@/lib/dag/types';

/**
 * Derives display-ready data from the conversation state.
 */
export function useDagNavigation(
  nodes: Map<string, ConversationNode>,
  activeBranchId: string | null
) {
  const displayNodes = useMemo(
    () => getDisplayNodes(activeBranchId, nodes),
    [activeBranchId, nodes]
  );

  const latestNode = useMemo(
    () => getLatestNode(activeBranchId, nodes),
    [activeBranchId, nodes]
  );

  return { displayNodes, latestNode };
}
