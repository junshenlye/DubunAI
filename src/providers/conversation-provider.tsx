'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useConversation } from '@/hooks/use-conversation';

type ConversationContextType = ReturnType<typeof useConversation>;

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const conversation = useConversation();

  return (
    <ConversationContext.Provider value={conversation}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversationContext must be used within ConversationProvider');
  return ctx;
}
