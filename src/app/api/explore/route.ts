import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconstructContext } from '@/lib/dag/context';
import { createNode, getConversationNodes, getNextSequence } from '@/lib/dag/operations';
import { generateStructuredResponse } from '@/lib/gemini/stream';
import { EXPLORE_SYSTEM_PROMPT } from '@/lib/gemini/prompts';
import type { ConversationNode, BranchOption } from '@/lib/dag/types';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, currentNodeId } = await req.json();
    const supabase = await createClient();

    // Load all nodes for context
    const allNodesRaw = await getConversationNodes(supabase, conversationId);
    const allNodes = new Map<string, ConversationNode>(
      allNodesRaw.map(n => [n.id, n])
    );

    // Build context and ask Gemini for exploration directions
    const contextMessages = reconstructContext(currentNodeId, allNodes);

    // Add the explore request to context
    contextMessages.push({
      role: 'user',
      parts: [{
        text: `Based on our conversation so far, propose multiple distinct exploration directions. Each direction should represent a meaningfully different approach, perspective, or line of reasoning. Return a JSON object with a "directions" array. Each direction should have "label" (short name), "description" (2-3 sentences), and "initial_prompt" (the opening question/message for this branch). The number of directions should match the complexity and breadth of the topic.`,
      }],
    });

    const rawResponse = await generateStructuredResponse(contextMessages, EXPLORE_SYSTEM_PROMPT);

    let parsed: { directions: Array<{ label: string; description: string; initial_prompt: string }> };
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // Fallback if JSON parsing fails
      parsed = {
        directions: [
          {
            label: 'Direction A',
            description: 'Explore the primary approach discussed.',
            initial_prompt: 'Let me explore the main approach further.',
          },
          {
            label: 'Direction B',
            description: 'Consider an alternative perspective.',
            initial_prompt: 'What if we took a completely different approach?',
          },
        ],
      };
    }

    const options: BranchOption[] = parsed.directions.map(d => ({
      id: generateId(),
      label: d.label,
      description: d.description,
      initial_prompt: d.initial_prompt,
    }));

    // Create the explore_root node
    const sequence = await getNextSequence(supabase, conversationId);
    const currentNode = allNodes.get(currentNodeId);

    const exploreRootNode = await createNode(supabase, {
      conversation_id: conversationId,
      parent_ids: [currentNodeId],
      type: 'explore_root',
      status: 'completed',
      role: 'assistant',
      input: '/explore',
      output: `Proposed ${options.length} exploration directions`,
      branch_id: currentNode?.branch_id ?? null,
      sequence,
      metadata: {
        model: 'gemini-2.5-flash',
        branch_options_proposed: options,
      },
    });

    return NextResponse.json({
      exploreRootNodeId: exploreRootNode.id,
      options,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
