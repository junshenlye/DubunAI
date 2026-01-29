import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/*
Simpler - No useEffect, no client state management
Faster - Database query happens on server, user sees result immediately
More secure - Database credentials never exposed to browser
No loading state needed - Server handles everything before sending page
*/


export default async function Home() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title: 'New Conversation' })
    .select()
    .single();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            DubunAI
          </h1>
          <p className="text-sm text-red-500 mb-4">{error.message}</p>
          <p className="text-xs text-zinc-500">
            Make sure your Supabase credentials are configured in .env.local
          </p>
        </div>
      </div>
    );
  }
  const conversation = data as { id: string };
  redirect(`/chat/${conversation.id}`);
}