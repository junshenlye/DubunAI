'use client';

import type { Branch } from '@/lib/dag/types';

interface BranchTabProps {
  branch: Branch;
  isActive: boolean;
  onClick: () => void;
}

export function BranchTab({ branch, isActive, onClick }: BranchTabProps) {
  const statusColors = {
    active: 'bg-green-400',
    merged: 'bg-amber-400',
    abandoned: 'bg-zinc-400',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
      }`}
      title={branch.description ?? undefined}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[branch.status]}`} />
        <span className="truncate">{branch.label}</span>
      </div>
    </button>
  );
}
