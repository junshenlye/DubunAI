'use client';

import type { Branch } from '@/lib/dag/types';

interface MergePreviewProps {
  branches: Branch[];
}

export function MergePreview({ branches }: MergePreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/50">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
        Merging
      </div>
      <div className="flex flex-wrap gap-2">
        {branches.map(branch => (
          <span
            key={branch.id}
            className="px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          >
            {branch.label}
          </span>
        ))}
      </div>
    </div>
  );
}
