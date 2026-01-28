'use client';

import type { Branch } from '@/lib/dag/types';

interface TreeVisualizerProps {
  branches: Branch[];
  activeBranchId: string | null;
}

/**
 * Minimal tree visualization showing the branch structure.
 * For prototype: just shows a text representation.
 */
export function TreeVisualizer({ branches, activeBranchId }: TreeVisualizerProps) {
  const activeBranches = branches.filter(b => b.status === 'active');
  const mergedBranches = branches.filter(b => b.status === 'merged');

  if (branches.length === 0) return null;

  return (
    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono px-3 py-2 border-t border-zinc-200 dark:border-zinc-700">
      <div className="mb-1">
        <span className={activeBranchId === null ? 'text-blue-500 font-bold' : ''}>
          main
        </span>
      </div>
      {activeBranches.map((b, i) => (
        <div key={b.id} className="ml-2">
          <span className="text-zinc-400">{i === activeBranches.length - 1 ? '└─' : '├─'}</span>
          <span className={b.id === activeBranchId ? ' text-blue-500 font-bold' : ''}>
            {' '}{b.label}
          </span>
        </div>
      ))}
      {mergedBranches.length > 0 && (
        <div className="mt-1 text-zinc-400">
          {mergedBranches.length} merged
        </div>
      )}
    </div>
  );
}
