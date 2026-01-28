import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconstructContext } from '@/lib/dag/context';
import { createNode, updateNode, getConversationNodes, getNextSequence } from '@/lib/dag/operations';
import { streamGeminiResponse } from '@/lib/gemini/stream';
import type { ConversationNode } from '@/lib/dag/types';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message, parentNodeId, branchId } = await req.json();

    const supabase = await createClient();
    const sequence = await getNextSequence(supabase, conversationId);

    // 1. Create user node immediately (always completed — we have the full input)
    const userNode = await createNode(supabase, {
      conversation_id: conversationId,
      parent_ids: parentNodeId ? [parentNodeId] : [],
      type: 'user',
      status: 'completed',
      role: 'user',
      input: message,
      output: message,
      branch_id: branchId ?? null,
      sequence,
      metadata: {},
    });

    // 2. Create assistant node as pending
    const assistantNode = await createNode(supabase, {
      conversation_id: conversationId,
      parent_ids: [userNode.id],
      type: 'assistant',
      status: 'pending',
      role: 'assistant',
      input: message,
      branch_id: branchId ?? null,
      sequence: sequence + 1,
      metadata: { model: 'gemini-2.5-flash' },
    });

    // 3. Load all nodes for context reconstruction
    const allNodesRaw = await getConversationNodes(supabase, conversationId);
    const allNodes = new Map<string, ConversationNode>(
      allNodesRaw.map(n => [n.id, n])
    );

    // 4. Reconstruct context (up to the user node)
    const contextMessages = reconstructContext(userNode.id, allNodes);

    // 5. Mark assistant node as streaming
    await updateNode(supabase, assistantNode.id, { status: 'streaming' });

    // 6. Stream from Gemini
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullOutput = '';

          // Send the node IDs first so the client knows what was created
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                userNodeId: userNode.id,
                assistantNodeId: assistantNode.id,
                sequence,
              })}\n\n`
            )
          );

          for await (const chunk of streamGeminiResponse(contextMessages)) {
            fullOutput += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: chunk, nodeId: assistantNode.id })}\n\n`
              )
            );
          }

          // Mark completed with full output
          await updateNode(supabase, assistantNode.id, {
            status: 'completed',
            output: fullOutput,
            metadata: {
              model: 'gemini-2.5-flash',
              duration_ms: Date.now() - new Date(assistantNode.created_at).getTime(),
            },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';

          // Mark node as failed
          await updateNode(supabase, assistantNode.id, {
            status: 'failed',
            output: `Error: ${errorMsg}`,
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
