'use client';

import type { BranchOption } from '@/lib/dag/types';

interface BranchOptionCardProps {
  option: BranchOption;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function BranchOptionCard({ option, selected, onToggle }: BranchOptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option.id)}
      className={`w-full text-left p-4 rounded-lg border transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selected
              ? 'border-blue-500 bg-blue-500'
              : 'border-zinc-300 dark:border-zinc-600'
          }`}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            {option.label}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {option.description}
          </div>
        </div>
      </div>
    </button>
  );
}
