'use client';

import { useReducer, useCallback } from 'react';
import type {
  ConversationState,
  ConversationNode,
  Branch,
  BranchOption,
  Conversation,
} from '@/lib/dag/types';

type Action =
  | { type: 'SET_CONVERSATION'; payload: { conversation: Conversation; nodes: ConversationNode[]; branches: Branch[] } }
  | { type: 'ADD_NODE'; payload: ConversationNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<ConversationNode> } }
  | { type: 'SET_ACTIVE_BRANCH'; payload: string | null }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SHOW_EXPLORE_PROPOSAL'; payload: { options: BranchOption[]; exploreRootNodeId: string } }
  | { type: 'HIDE_EXPLORE_PROPOSAL' }
  | { type: 'ADD_BRANCHES'; payload: Branch[] }
  | { type: 'UPDATE_BRANCHES_STATUS'; payload: { ids: string[]; status: 'active' | 'merged' | 'abandoned' } }
  | { type: 'COMPLETE_MERGE'; payload: ConversationNode };

const initialState: ConversationState = {
  conversation: null,
  nodes: new Map(),
  branches: [],
  activeBranchId: null,
  isStreaming: false,
  exploreProposal: null,
  mergeSelection: null,
};

function reducer(state: ConversationState, action: Action): ConversationState {
  switch (action.type) {
    case 'SET_CONVERSATION': {
      const nodeMap = new Map(action.payload.nodes.map(n => [n.id, n]));
      return {
        ...state,
        conversation: action.payload.conversation,
        nodes: nodeMap,
        branches: action.payload.branches,
      };
    }
    case 'ADD_NODE': {
      const newNodes = new Map(state.nodes);
      newNodes.set(action.payload.id, action.payload);
      return { ...state, nodes: newNodes };
    }
    case 'UPDATE_NODE': {
      const newNodes = new Map(state.nodes);
      const existing = newNodes.get(action.payload.id);
      if (existing) {
        newNodes.set(action.payload.id, { ...existing, ...action.payload.updates });
      }
      return { ...state, nodes: newNodes };
    }
    case 'SET_ACTIVE_BRANCH':
      return { ...state, activeBranchId: action.payload };
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    case 'SHOW_EXPLORE_PROPOSAL':
      return { ...state, exploreProposal: action.payload };
    case 'HIDE_EXPLORE_PROPOSAL':
      return { ...state, exploreProposal: null };
    case 'ADD_BRANCHES':
      return { ...state, branches: [...state.branches, ...action.payload] };
    case 'UPDATE_BRANCHES_STATUS':
      return {
        ...state,
        branches: state.branches.map(b =>
          action.payload.ids.includes(b.id) ? { ...b, status: action.payload.status } : b
        ),
      };
    case 'COMPLETE_MERGE': {
      const newNodes = new Map(state.nodes);
      newNodes.set(action.payload.id, action.payload);
      return {
        ...state,
        nodes: newNodes,
        mergeSelection: null,
        activeBranchId: null,
      };
    }
    default:
      return state;
  }
}

export function useConversation() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadConversation = useCallback(
    (conversation: Conversation, nodes: ConversationNode[], branches: Branch[]) => {
      dispatch({ type: 'SET_CONVERSATION', payload: { conversation, nodes, branches } });
    },
    []
  );

  const addNode = useCallback((node: ConversationNode) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<ConversationNode>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } });
  }, []);

  const switchBranch = useCallback((branchId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_BRANCH', payload: branchId });
  }, []);

  const setStreaming = useCallback((streaming: boolean) => {
    dispatch({ type: 'SET_STREAMING', payload: streaming });
  }, []);

  const showExploreProposal = useCallback(
    (options: BranchOption[], exploreRootNodeId: string) => {
      dispatch({ type: 'SHOW_EXPLORE_PROPOSAL', payload: { options, exploreRootNodeId } });
    },
    []
  );

  const hideExploreProposal = useCallback(() => {
    dispatch({ type: 'HIDE_EXPLORE_PROPOSAL' });
  }, []);

  const addBranches = useCallback((branches: Branch[]) => {
    dispatch({ type: 'ADD_BRANCHES', payload: branches });
  }, []);

  const completeMerge = useCallback(
    (mergeNode: ConversationNode, mergedBranchIds: string[]) => {
      dispatch({ type: 'UPDATE_BRANCHES_STATUS', payload: { ids: mergedBranchIds, status: 'merged' } });
      dispatch({ type: 'COMPLETE_MERGE', payload: mergeNode });
    },
    []
  );

  return {
    state,
    dispatch,
    loadConversation,
    addNode,
    updateNode,
    switchBranch,
    setStreaming,
    showExploreProposal,
    hideExploreProposal,
    addBranches,
    completeMerge,
  };
}
