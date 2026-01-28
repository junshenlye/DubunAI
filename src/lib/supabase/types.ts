export type NodeStatus = 'pending' | 'streaming' | 'completed' | 'partial' | 'failed';
export type NodeType = 'user' | 'assistant' | 'explore_root' | 'explore_branch' | 'merge';
export type NodeRole = 'user' | 'assistant' | 'system';
export type BranchStatus = 'active' | 'merged' | 'abandoned';

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      nodes: {
        Row: {
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
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          parent_ids?: string[];
          type: NodeType;
          status?: NodeStatus;
          role: NodeRole;
          input: string;
          reasoning?: string | null;
          output?: string | null;
          summary?: string | null;
          branch_label?: string | null;
          branch_id?: string | null;
          merge_strategy?: string | null;
          sequence?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: NodeStatus;
          reasoning?: string | null;
          output?: string | null;
          summary?: string | null;
          metadata?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nodes_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      branches: {
        Row: {
          id: string;
          conversation_id: string;
          label: string;
          description: string | null;
          parent_node_id: string;
          root_node_id: string | null;
          status: BranchStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          label: string;
          description?: string | null;
          parent_node_id: string;
          root_node_id?: string | null;
          status?: BranchStatus;
          created_at?: string;
        };
        Update: {
          label?: string;
          description?: string | null;
          root_node_id?: string | null;
          status?: BranchStatus;
        };
        Relationships: [
          {
            foreignKeyName: 'branches_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'branches_parent_node_id_fkey';
            columns: ['parent_node_id'];
            isOneToOne: false;
            referencedRelation: 'nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'branches_root_node_id_fkey';
            columns: ['root_node_id'];
            isOneToOne: false;
            referencedRelation: 'nodes';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
