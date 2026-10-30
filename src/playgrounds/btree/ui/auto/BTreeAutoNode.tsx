import { cn } from '@/common/lib/utils';
import type { PlacedNode } from '@/common/tree/layout';
import type { Key } from '@/common/types';
import type { BNode } from '@/playgrounds/btree/model/btree';
import { AUTO_KEY_W, AUTO_PTR_W } from '@/playgrounds/btree/ui/node-metrics';

interface BTreeAutoNodeProps {
  placed: PlacedNode<BNode>;
  p: number;
  hot: boolean;
  lastKey: Key | null;
  connected: Set<string>;
}

export function BTreeAutoNode({ placed, p, hot, lastKey, connected }: BTreeAutoNodeProps) {
  const n = placed.node;
  const cols: string[] = [];
  for (let s = 0; s < p; s += 1) {
    cols.push(`${AUTO_PTR_W}px`);
    if (s < p - 1) cols.push(`${AUTO_KEY_W}px`);
  }

  return (
    <div
      data-node
      className={cn(
        'rounded-md border bg-card shadow-sm',
        hot
          ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100'
          : 'border-border dark:border-zinc-700',
      )}
    >
      <div className="grid h-12 w-full" style={{ gridTemplateColumns: cols.join(' ') }}>
        {Array.from({ length: p }, (_, s) => (
          <span key={s} className="contents">
            <span className={cn('flex items-center justify-center', s > 0 && 'border-l border-border dark:border-zinc-700')}>
              <span
                title={connected.has(`${n.id}:${s}`) ? `Puntero ${s} conectado` : `Puntero ${s} nulo`}
                className={cn(
                  'size-1.5 rounded-full',
                  connected.has(`${n.id}:${s}`)
                    ? 'bg-zinc-700 dark:bg-zinc-300'
                    : 'border border-zinc-300 dark:border-zinc-600',
                )}
              />
            </span>
            {s < p - 1 && (
              <span
                className={cn(
                  'flex items-center justify-center border-l border-border text-sm font-medium dark:border-zinc-700',
                  lastKey !== null &&
                    n.keys[s] === lastKey &&
                    'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100',
                )}
              >
                {n.keys[s] ?? ''}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
