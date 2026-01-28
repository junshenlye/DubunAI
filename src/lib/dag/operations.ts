import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { ConversationNode, Conversation, Branch } from './types';

type Client = SupabaseClient<Database>;

// ============================================
// CONVERSATIONS
// ============================================

export async function createConversation(
  supabase: Client,
  title: string = 'New Conversation'
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title })
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data as Conversation;
}

export async function getConversation(
  supabase: Client,
  id: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select()
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Conversation;
}

// ============================================
// NODES
// ============================================

export async function createNode(
  supabase: Client,
  node: Database['public']['Tables']['nodes']['Insert']
): Promise<ConversationNode> {
  const { data, error } = await supabase
    .from('nodes')
    .insert(node)
    .select()
    .single();

  if (error) throw new Error(`Failed to create node: ${error.message}`);
  return data as unknown as ConversationNode;
}

export async function updateNode(
  supabase: Client,
  id: string,
  updates: Database['public']['Tables']['nodes']['Update']
): Promise<ConversationNode> {
  const { data, error } = await supabase
    .from('nodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update node: ${error.message}`);
  return data as unknown as ConversationNode;
}

export async function getConversationNodes(
  supabase: Client,
  conversationId: string
): Promise<ConversationNode[]> {
  const { data, error } = await supabase
    .from('nodes')
    .select()
    .eq('conversation_id', conversationId)
    .order('sequence', { ascending: true });

  if (error) throw new Error(`Failed to fetch nodes: ${error.message}`);
  return (data ?? []) as unknown as ConversationNode[];
}

export async function getNextSequence(
  supabase: Client,
  conversationId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('nodes')
    .select('sequence')
    .eq('conversation_id', conversationId)
    .order('sequence', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return 0;
  return data[0].sequence + 1;
}

// ============================================
// BRANCHES
// ============================================

export async function createBranch(
  supabase: Client,
  branch: Database['public']['Tables']['branches']['Insert']
): Promise<Branch> {
  const { data, error } = await supabase
    .from('branches')
    .insert(branch)
    .select()
    .single();

  if (error) throw new Error(`Failed to create branch: ${error.message}`);
  return data as unknown as Branch;
}

export async function getConversationBranches(
  supabase: Client,
  conversationId: string
): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select()
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch branches: ${error.message}`);
  return (data ?? []) as unknown as Branch[];
}

export async function updateBranchStatus(
  supabase: Client,
  branchIds: string[],
  status: 'active' | 'merged' | 'abandoned'
): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .update({ status })
    .in('id', branchIds);

  if (error) throw new Error(`Failed to update branch status: ${error.message}`);
}

export async function updateBranchRootNode(
  supabase: Client,
  branchId: string,
  rootNodeId: string
): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .update({ root_node_id: rootNodeId })
    .eq('id', branchId);

  if (error) throw new Error(`Failed to update branch root node: ${error.message}`);
}
