'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { Branch } from '@/lib/dag/types';

interface MergeDialogProps {
  branches: Branch[];
  onConfirm: (branchIds: string[]) => void;
  onCancel: () => void;
}

export function MergeDialog({ branches, onConfirm, onCancel }: MergeDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleBranch = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Modal open={true} onClose={onCancel} title="Merge Branches">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Select at least 2 branches to merge. Their insights will be synthesized into a single continuation.
      </p>

      <div className="space-y-2 mb-6">
        {branches.map(branch => (
          <button
            key={branch.id}
            type="button"
            onClick={() => toggleBranch(branch.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selected.has(branch.id)
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.has(branch.id)
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {selected.has(branch.id) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {branch.label}
                </div>
                {branch.description && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {branch.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={selected.size < 2}
          onClick={() => onConfirm(Array.from(selected))}
        >
          Merge {selected.size >= 2 ? `(${selected.size})` : ''}
        </Button>
      </div>
    </Modal>
  );
}
