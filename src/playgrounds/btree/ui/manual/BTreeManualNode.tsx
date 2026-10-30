import * as React from 'react';
import { ArrowDownToLine, Crown, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/common/components/ui/input';
import { cn } from '@/common/lib/utils';
import type { KeyType } from '@/common/types';
import type { ManualNode } from '@/playgrounds/btree/model/validate';
import { MANUAL_SLOT_W as SLOT_COL_W } from '@/playgrounds/btree/ui/node-metrics';

interface BTreeManualNodeActions {
  onPointerDown: (event: React.PointerEvent, id: string) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: () => void;
  onFocusEmptyKey: (id: string) => void;
  onSetRoot: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onStartLink: (id: string, slot: number) => void;
  onRemoveLink: (id: string, slot: number) => void;
  onCompleteLink: (id: string) => void;
  onCommitKeyCell: (id: string, slot: number, raw: string) => void;
  onRemoveKey: (id: string, slot: number) => void;
  onAddKey: (id: string, raw: string) => void;
}

interface BTreeManualNodeProps {
  node: ManualNode;
  p: number;
  keyType: KeyType;
  isRoot: boolean;
  isSelected: boolean;
  isTarget: boolean;
  bad: boolean;
  linking: { nodeId: string; slot: number } | null;
  actions: BTreeManualNodeActions;
}

export function BTreeManualNode({
  node,
  p,
  keyType,
  isRoot,
  isSelected,
  isTarget,
  bad,
  linking,
  actions,
}: BTreeManualNodeProps) {
  const isStr = keyType === 'string';
  const full = node.keys.length >= p - 1;
  const cols: string[] = [];
  for (let s = 0; s < p; s += 1) {
    cols.push(`${SLOT_COL_W}px`);
    if (s < p - 1) cols.push('minmax(0,1fr)');
  }

  return (
    <div
      data-node
      className={cn(
        'rounded-md border bg-card shadow-sm',
        bad ? 'border-red-500 ring-1 ring-red-500 dark:border-red-400 dark:ring-red-400' : 'border-border dark:border-zinc-700',
        isRoot && 'bg-zinc-100 dark:bg-zinc-800',
        isTarget && 'ring-2 ring-dashed ring-zinc-500',
        isSelected && 'outline-2 outline-offset-2 outline-zinc-500 [outline-style:solid] dark:outline-zinc-400',
      )}
    >
      <div
        className="flex h-6 cursor-move touch-none items-center gap-1 border-b border-border px-1 text-muted-foreground dark:border-zinc-700"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('input,button')) return;
          actions.onPointerDown(e, node.id);
        }}
        onPointerMove={actions.onPointerMove}
        onPointerUp={actions.onPointerUp}
      >
        <GripVertical className="size-3.5 shrink-0" />
        {isRoot ? (
          <span className="min-w-0 flex-1 truncate text-center text-[10px]">raíz</span>
        ) : (
          <span className="min-w-0 flex-1" />
        )}
        {!full && (
          <button
            type="button"
            title="Ir a la primera celda vacía"
            onClick={() => actions.onFocusEmptyKey(node.id)}
            className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Plus className="size-3" />
          </button>
        )}
        {!isRoot && (
          <button
            type="button"
            title="Marcar como raíz"
            onClick={() => actions.onSetRoot(node.id)}
            className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Crown className="size-3" />
          </button>
        )}
        <button
          type="button"
          title="Eliminar nodo"
          onClick={() => actions.onDeleteNode(node.id)}
          className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      <div className="grid h-10 w-full" style={{ gridTemplateColumns: cols.join(' ') }}>
        {Array.from({ length: p }, (_, slot) => {
          const live = slot <= node.keys.length; // slots existentes: |claves|+1
          const linked = live ? node.slots[slot] : null;
          return (
            <span key={`cells-${slot}`} className="contents">
              <span className={cn('flex items-center justify-center', slot > 0 && 'border-l border-border dark:border-zinc-700')}>
                {!live ? (
                  <span
                    className="size-1.5 rounded-full border border-zinc-300 dark:border-zinc-600"
                    title={`Puntero ${slot} (se habilita al agregar claves)`}
                  />
                ) : linked ? (
                  <button
                    type="button"
                    title={`Quitar puntero ${slot}`}
                    onClick={() => actions.onRemoveLink(node.id, slot)}
                    className="flex size-5 items-center justify-center rounded-full border border-zinc-900 dark:border-zinc-100"
                  >
                    <X className="size-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    title={`Crear puntero ${slot} desde aquí`}
                    onClick={() => actions.onStartLink(node.id, slot)}
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border border-dashed',
                      linking?.nodeId === node.id && linking?.slot === slot
                        ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-zinc-400 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-500 dark:hover:border-zinc-100 dark:hover:text-zinc-100',
                    )}
                  >
                    <Plus className="size-3" />
                  </button>
                )}
              </span>
              {slot < p - 1 &&
                (slot < node.keys.length ? (
                  <span className="group/key relative flex min-w-0 items-center border-l border-border dark:border-zinc-700">
                    <Input
                      defaultValue={node.keys[slot]}
                      key={`${node.id}-${slot}-${node.keys[slot]}`}
                      data-key-cell={`${node.id}:${slot}`}
                      inputMode={isStr ? 'text' : 'numeric'}
                      aria-label={`Clave ${slot + 1}`}
                      className={cn(
                        'h-8 min-w-0 flex-1 select-text rounded-none border-0 bg-transparent px-0 text-center text-sm font-medium shadow-none focus-visible:ring-0',
                        bad && 'text-red-600 dark:text-red-400',
                      )}
                      onBlur={(e) => actions.onCommitKeyCell(node.id, slot, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                    />
                    <button
                      type="button"
                      title="Quitar clave"
                      onClick={() => actions.onRemoveKey(node.id, slot)}
                      className="absolute -top-0.5 right-0 rounded-full bg-card p-0.5 text-muted-foreground hover:text-foreground max-sm:opacity-100 sm:opacity-0 sm:group-hover/key:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span className="flex min-w-0 items-center border-l border-border dark:border-zinc-700">
                    <Input
                      key={`${node.id}-empty-${slot}`}
                      data-empty-cell={node.id}
                      inputMode={isStr ? 'text' : 'numeric'}
                      aria-label={`Clave vacía ${slot + 1}`}
                      className="h-8 min-w-0 flex-1 select-text rounded-none border-0 bg-transparent px-0 text-center text-sm font-medium text-muted-foreground shadow-none focus-visible:ring-0"
                      onBlur={(e) => {
                        actions.onAddKey(node.id, e.target.value);
                        e.target.value = '';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          actions.onAddKey(node.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </span>
                ))}
            </span>
          );
        })}
      </div>

      {isTarget && (
        <button
          type="button"
          onClick={() => actions.onCompleteLink(node.id)}
          className="absolute -top-3 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 shadow dark:bg-zinc-100 dark:text-zinc-900"
          title="Conectar aquí"
        >
          <ArrowDownToLine className="size-4" />
        </button>
      )}
    </div>
  );
}
