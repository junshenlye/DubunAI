'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createAndRedirect = async () => {
      try {
        const supabase = createClient();
        const { data, error: createError } = await supabase
          .from('conversations')
          .insert({ title: 'New Conversation' })
          .select()
          .single();

        if (createError) throw createError;
        if (data) {
          const conv = data as unknown as { id: string };
          router.replace(`/chat/${conv.id}`);
        }
      } catch (err) {
        console.error('Failed to create conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to create conversation');
      }
    };

    createAndRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      {error ? (
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            DubunAI
          </h1>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <p className="text-xs text-zinc-500">
            Make sure your Supabase credentials are configured in .env.local
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm text-zinc-500">Starting conversation...</p>
        </div>
      )}
    </div>
  );
}
