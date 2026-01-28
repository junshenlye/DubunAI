'use client';

import { use } from 'react';
import { ConversationProvider } from '@/providers/conversation-provider';
import { ChatContainer } from '@/components/chat/chat-container';

export default function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);

  return (
    <ConversationProvider>
      <ChatContainer conversationId={conversationId} />
    </ConversationProvider>
  );
}
