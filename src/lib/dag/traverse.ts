import type { ConversationNode } from './types';

/**
 * Walk from a node to the root by following parent_ids[0] (primary parent).
 * Returns [startNode, parent, grandparent, ..., root].
 */
export function walkToRoot(
  startNodeId: string,
  allNodes: Map<string, ConversationNode>
): ConversationNode[] {
  const path: ConversationNode[] = [];
  const visited = new Set<string>();
  let currentId: string | null = startNodeId;

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const node = allNodes.get(currentId);
    if (!node) break;

    path.push(node);

    if (node.parent_ids.length > 0) {
      currentId = node.parent_ids[0];
    } else {
      currentId = null;
    }
  }

  return path;
}

/**
 * Get all nodes belonging to a specific branch (or main trunk if null),
 * ordered by sequence.
 */
export function getBranchNodes(
  branchId: string | null,
  allNodes: Map<string, ConversationNode>
): ConversationNode[] {
  const nodes: ConversationNode[] = [];
  for (const node of allNodes.values()) {
    if (branchId === null) {
      if (node.branch_id === null) nodes.push(node);
    } else {
      if (node.branch_id === branchId) nodes.push(node);
    }
  }
  return nodes.sort((a, b) => a.sequence - b.sequence);
}

/**
 * Get the latest node in a branch (highest sequence).
 */
export function getLatestNode(
  branchId: string | null,
  allNodes: Map<string, ConversationNode>
): ConversationNode | null {
  const branchNodes = getBranchNodes(branchId, allNodes);
  return branchNodes.length > 0 ? branchNodes[branchNodes.length - 1] : null;
}

/**
 * Find the common ancestor of two nodes.
 * Walks both paths to root and finds the first shared node.
 */
export function findCommonAncestor(
  nodeAId: string,
  nodeBId: string,
  allNodes: Map<string, ConversationNode>
): ConversationNode | null {
  const pathA = new Set(walkToRoot(nodeAId, allNodes).map(n => n.id));
  const pathB = walkToRoot(nodeBId, allNodes);

  for (const node of pathB) {
    if (pathA.has(node.id)) return node;
  }
  return null;
}

/**
 * Get the display nodes for the current view.
 * For main trunk: nodes with branch_id === null, plus explore_root nodes.
 * For a branch: walk from the branch root back to the conversation root
 * (to show shared history), then append branch-specific nodes.
 */
export function getDisplayNodes(
  activeBranchId: string | null,
  allNodes: Map<string, ConversationNode>
): ConversationNode[] {
  if (activeBranchId === null) {
    // Main trunk: show all non-branch nodes
    return getBranchNodes(null, allNodes);
  }

  // For a branch: get branch nodes and include shared history
  const branchNodes = getBranchNodes(activeBranchId, allNodes);
  if (branchNodes.length === 0) return [];

  // Walk from the first branch node's parent back to root to get shared history
  const firstBranchNode = branchNodes[0];
  if (firstBranchNode.parent_ids.length === 0) return branchNodes;

  const parentId = firstBranchNode.parent_ids[0];
  const ancestorPath = walkToRoot(parentId, allNodes);
  ancestorPath.reverse(); // root → ... → parent

  return [...ancestorPath, ...branchNodes];
}
