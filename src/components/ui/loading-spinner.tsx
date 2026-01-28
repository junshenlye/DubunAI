'use client';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div
      className={`${sizeClass} animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600`}
    />
  );
}
