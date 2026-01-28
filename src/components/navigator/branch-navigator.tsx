'use client';

import { useState } from 'react';
import { BranchTab } from './branch-tab';
import { TreeVisualizer } from './tree-visualizer';
import type { Branch } from '@/lib/dag/types';

interface BranchNavigatorProps {
  branches: Branch[];
  activeBranchId: string | null;
  onSwitchBranch: (branchId: string | null) => void;
}

export function BranchNavigator({ branches, activeBranchId, onSwitchBranch }: BranchNavigatorProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (branches.length === 0) return null;

  const activeBranches = branches.filter(b => b.status === 'active');

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden w-64">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <span>Branches ({activeBranches.length})</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {!collapsed && (
          <>
            {/* Main trunk */}
            <div className="px-2 pb-1">
              <button
                onClick={() => onSwitchBranch(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeBranchId === null
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  Main Conversation
                </div>
              </button>
            </div>

            {/* Branch tabs */}
            <div className="px-2 pb-2 space-y-0.5">
              {activeBranches.map(branch => (
                <BranchTab
                  key={branch.id}
                  branch={branch}
                  isActive={activeBranchId === branch.id}
                  onClick={() => onSwitchBranch(branch.id)}
                />
              ))}
            </div>

            {/* Tree visualization */}
            <TreeVisualizer
              branches={branches}
              activeBranchId={activeBranchId}
            />
          </>
        )}
      </div>
    </div>
  );
}
