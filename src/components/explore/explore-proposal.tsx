'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { BranchOptionCard } from './branch-option-card';
import type { BranchOption } from '@/lib/dag/types';

interface ExploreProposalProps {
  options: BranchOption[];
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function ExploreProposal({ options, onConfirm, onCancel }: ExploreProposalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOption = (id: string) => {
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
    <Modal open={true} onClose={onCancel} title="Explore Directions">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Select the directions you want to explore. Each will create a new conversation branch.
      </p>

      <div className="space-y-3 mb-6">
        {options.map(option => (
          <BranchOptionCard
            key={option.id}
            option={option}
            selected={selected.has(option.id)}
            onToggle={toggleOption}
          />
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={selected.size === 0}
          onClick={() => onConfirm(Array.from(selected))}
        >
          Explore {selected.size > 0 ? `(${selected.size})` : ''}
        </Button>
      </div>
    </Modal>
  );
}
