export type NodeStatus = 'pending' | 'streaming' | 'completed' | 'partial' | 'failed';
export type NodeType = 'user' | 'assistant' | 'explore_root' | 'explore_branch' | 'merge';
export type NodeRole = 'user' | 'assistant' | 'system';

export interface BranchOption {
  id: string;
  label: string;
  description: string;
  initial_prompt: string;
}

export interface NodeMetadata {
  model?: string;
  tokens_used?: { input: number; output: number };
  branch_options_proposed?: BranchOption[];
  branch_options_selected?: string[];
  duration_ms?: number;
}

export interface ConversationNode {
  id: string;
  conversation_id: string;
  parent_ids: string[];
  type: NodeType;
  status: NodeStatus;
  role: NodeRole;
  input: string;
  reasoning: string | null;
  output: string | null;
  summary: string | null;
  branch_label: string | null;
  branch_id: string | null;
  merge_strategy: string | null;
  sequence: number;
  metadata: NodeMetadata;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  conversation_id: string;
  label: string;
  description: string | null;
  parent_node_id: string;
  root_node_id: string | null;
  status: 'active' | 'merged' | 'abandoned';
  created_at: string;
}

export interface ConversationState {
  conversation: Conversation | null;
  nodes: Map<string, ConversationNode>;
  branches: Branch[];
  activeBranchId: string | null;
  isStreaming: boolean;
  exploreProposal: { options: BranchOption[]; exploreRootNodeId: string } | null;
  mergeSelection: string[] | null;
}
