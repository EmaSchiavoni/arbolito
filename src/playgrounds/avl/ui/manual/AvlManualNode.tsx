import * as React from 'react';
import { ArrowDownToLine, Crown, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/common/components/ui/input';
import { cn } from '@/common/lib/utils';
import type { KeyType } from '@/common/types';
import type { AvlManualNode as AvlManualNodeData } from '@/playgrounds/avl/model/validate';
import { MANUAL_SLOT_W as SLOT_W } from '@/playgrounds/avl/ui/node-metrics';

interface AvlManualNodeActions {
  onPointerDown: (event: React.PointerEvent, id: string) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: () => void;
  onFocusKey: (id: string) => void;
  onSetRoot: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onCommitKey: (id: string, raw: string) => void;
  onStartLink: (id: string, slot: number) => void;
  onRemoveLink: (id: string, slot: number) => void;
  onCompleteLink: (id: string) => void;
}

interface AvlManualNodeProps {
  node: AvlManualNodeData;
  keyType: KeyType;
  isRoot: boolean;
  isSelected: boolean;
  isTarget: boolean;
  bad: boolean;
  linking: { nodeId: string; slot: number } | null;
  actions: AvlManualNodeActions;
}

export function AvlManualNode({
  node,
  keyType,
  isRoot,
  isSelected,
  isTarget,
  bad,
  linking,
  actions,
}: AvlManualNodeProps) {
  function renderSlot(slot: number) {
    const linked = node.slots[slot] ?? null;
    if (linked) {
      return (
        <button
          type="button"
          title={`Quitar puntero ${slot === 0 ? 'izquierdo' : 'derecho'}`}
          onClick={() => actions.onRemoveLink(node.id, slot)}
          className="flex size-5 items-center justify-center rounded-full border border-zinc-900 dark:border-zinc-100"
        >
          <X className="size-3" />
        </button>
      );
    }
    return (
      <button
        type="button"
        title={`Crear puntero ${slot === 0 ? 'izquierdo' : 'derecho'}`}
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
    );
  }

  return (
    <div
      data-node
      className={cn(
        'rounded-md border bg-card shadow-sm',
        bad
          ? 'border-red-500 ring-1 ring-red-500 dark:border-red-400 dark:ring-red-400'
          : 'border-border dark:border-zinc-700',
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
        <button
          type="button"
          title="Ir a la celda de clave"
          onClick={() => actions.onFocusKey(node.id)}
          className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="size-3" />
        </button>
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

      <div className="grid h-6 w-full" style={{ gridTemplateColumns: `${SLOT_W}px minmax(0,1fr) ${SLOT_W}px` }}>
        <span className="flex items-center justify-center">{renderSlot(0)}</span>
        <span className="flex min-w-0 items-center border-x border-border dark:border-zinc-700">
          <Input
            defaultValue={node.key ?? ''}
            key={`${node.id}-${node.key ?? 'empty'}`}
            data-key-cell={node.id}
            inputMode={keyType === 'string' ? 'text' : 'numeric'}
            aria-label="Clave"
            className={cn(
              'h-6 min-w-0 flex-1 select-text rounded-none border-0 bg-transparent px-0 text-center text-sm font-medium shadow-none focus-visible:ring-0',
              bad && 'text-red-600 dark:text-red-400',
            )}
            onBlur={(e) => actions.onCommitKey(node.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
        </span>
        <span className="flex items-center justify-center">{renderSlot(1)}</span>
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
