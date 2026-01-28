import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNode, updateBranchStatus, getConversationNodes } from '@/lib/dag/operations';
import { generateGeminiResponse } from '@/lib/gemini/stream';
import { MERGE_SYSTEM_PROMPT } from '@/lib/gemini/prompts';
import type { ConversationNode, Branch } from '@/lib/dag/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const conversationId = body.conversationId as string;
    const branchIds = body.branchIds as string[];
    const supabase = await createClient();

    // Fetch the branches
    const { data: branchesRaw, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .in('id', branchIds);

    if (branchError || !branchesRaw) {
      throw new Error('Failed to fetch branches');
    }

    const branches = branchesRaw as unknown as Branch[];

    // Load all conversation nodes and filter by branch
    const allNodes = await getConversationNodes(supabase, conversationId);

    const branchSummaries: { label: string; summary: string; latestNodeId: string }[] = [];

    for (const branch of branches) {
      const branchNodes = allNodes
        .filter(n => n.branch_id === branch.id)
        .sort((a, b) => a.sequence - b.sequence);

      if (branchNodes.length === 0) continue;

      const summary = branchNodes
        .map(n => {
          const role = n.role === 'user' ? 'User' : 'Assistant';
          const content = n.output || n.input;
          return `${role}: ${content}`;
        })
        .filter(Boolean)
        .join('\n');

      branchSummaries.push({
        label: branch.label,
        summary,
        latestNodeId: branchNodes[branchNodes.length - 1].id,
      });
    }

    if (branchSummaries.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 branches with content to merge' },
        { status: 400 }
      );
    }

    // Ask Gemini to synthesize
    const mergePromptContent = branchSummaries
      .map(b => `## Branch: ${b.label}\n${b.summary}`)
      .join('\n\n');

    const mergeOutput = await generateGeminiResponse(
      [{
        role: 'user',
        parts: [{
          text: `You are merging multiple exploration branches back into a single conversation thread.\n\nHere are the branches:\n\n${mergePromptContent}\n\nProvide a synthesis that:\n1. Identifies the key insights from each branch\n2. Notes where branches agree and disagree\n3. Proposes a unified path forward combining the best elements\n\nBe concise but thorough.`,
        }],
      }],
      MERGE_SYSTEM_PROMPT
    );

    // Create the merge node with multiple parents
    const parentIds = branchSummaries.map(b => b.latestNodeId);

    // Get next sequence number
    const maxSequence = allNodes.reduce((max, n) => Math.max(max, n.sequence), 0);
    const nextSequence = maxSequence + 1;

    const mergeNode = await createNode(supabase, {
      conversation_id: conversationId,
      parent_ids: parentIds,
      type: 'merge',
      status: 'completed',
      role: 'assistant',
      input: `/merge [${branches.map(b => b.label).join(', ')}]`,
      output: mergeOutput,
      branch_id: null, // Returns to main trunk
      merge_strategy: 'shared_prefix_branch_summaries',
      sequence: nextSequence,
      metadata: { model: 'gemini-2.5-flash' },
    });

    // Mark merged branches
    await updateBranchStatus(supabase, branchIds, 'merged');

    return NextResponse.json({
      mergeNode: mergeNode as unknown as ConversationNode,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
