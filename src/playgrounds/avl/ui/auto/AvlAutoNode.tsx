import { cn } from '@/common/lib/utils';
import type { PlacedNode } from '@/common/tree/layout';
import { balanceOf, type AvlNode } from '@/playgrounds/avl/model/avl';
import { displayHeight, type HeightMode } from '@/playgrounds/avl/model/stats';

interface AvlAutoNodeProps {
  placed: PlacedNode<AvlNode>;
  traversed: boolean;
  hot: boolean;
  isNew: boolean;
  heightMode: HeightMode;
}

export function AvlAutoNode({ placed, traversed, hot, isNew, heightMode }: AvlAutoNodeProps) {
  const n = placed.node;
  const bf = balanceOf(n);

  return (
    <div
      data-node
      className={cn(
        'flex h-14 flex-col items-center justify-center rounded-md border bg-card shadow-sm',
        traversed
          ? 'border-2 border-zinc-900 bg-zinc-900/5 dark:border-zinc-100 dark:bg-zinc-100/10'
          : hot
            ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100'
            : 'border-border dark:border-zinc-700',
        isNew && 'bg-emerald-100/60 dark:bg-emerald-950/50',
      )}
    >
      <span className="text-sm font-semibold">{n.key}</span>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        h {displayHeight(n, heightMode)} · bf {bf > 0 ? `+${bf}` : bf}
      </span>
    </div>
  );
}
