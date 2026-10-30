import { cn } from '@/common/lib/utils';
import type { PlaygroundDefinition } from '@/common/playground';
import { AvlArt } from '@/landing/art/AvlArt';
import { BTreeArt } from '@/landing/art/BTreeArt';
import { NaryArt } from '@/landing/art/NaryArt';

export function PlaygroundPreview({ playground }: { playground: PlaygroundDefinition }) {
  const isBTree = playground.id === 'btree';
  const isAvl = playground.id === 'avl';
  const meta = isBTree ? '[p configurable]' : isAvl ? '[auto-balanceado]' : '[muchas ramas]';

  return (
    <div className="flex h-full min-h-[340px] flex-col">
      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-[9px] uppercase tracking-[0.26em] text-muted-foreground">vista previa</span>
        <span
          className={cn(
            'font-display text-[8px] uppercase tracking-[0.18em] text-muted-foreground',
            isBTree && 'rounded-full border border-border/80 px-2.5 py-1',
          )}
        >
          {meta}
        </span>
      </div>
      <div className="landing-card relative mt-4 flex-1 overflow-hidden rounded-2xl border border-border/80 bg-background/60">
        <div className="absolute inset-0 bg-canvas-grid opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background/80" />
        <div className="absolute inset-0 grid place-items-center p-4">
          {isBTree ? (
            <BTreeArt className="w-full max-w-md" />
          ) : isAvl ? (
            <AvlArt className="w-full max-w-md" />
          ) : (
            <NaryArt className="w-full max-w-md" />
          )}
        </div>
        <span className="landing-scan pointer-events-none absolute inset-0" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['historial paso a paso', 'validar', 'deshacer / rehacer'].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border/80 bg-background/50 px-2.5 py-1 font-display text-[8px] uppercase tracking-[0.14em] text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
