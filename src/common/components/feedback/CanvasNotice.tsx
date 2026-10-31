import type * as React from 'react';
import { cn } from '@/common/lib/utils';

export function CanvasNotice({
  hidden,
  children,
  className,
}: {
  hidden: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute left-2 z-10 flex max-w-[calc(100vw-190px)] flex-col gap-2',
        hidden ? 'top-12' : 'top-2',
        className,
      )}
    >
      <p className="w-max max-w-full rounded-full bg-zinc-900/85 px-3 py-1 text-xs text-zinc-100 dark:bg-zinc-100/90 dark:text-zinc-900">
        {children}
      </p>
    </div>
  );
}
