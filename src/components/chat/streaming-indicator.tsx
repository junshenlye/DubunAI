'use client';

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>Thinking...</span>
    </div>
  );
}
