import * as React from 'react';
import { ArrowDownToLine, Crown, GripVertical, Plus, Trash2, X, ShieldCheck, Eraser, Undo2, Redo2 } from 'lucide-react';
import { Input } from '../../../common/components/ui/input';
import { ConfirmDialog } from '../../../common/components/ui/alert-dialog';
import { ToolbarButton, ToolbarSeparator } from '../../../common/components/ui/toolbar';
import { AppShell } from '../../../app/AppShell';
import { useChrome } from '../../../app/use-chrome';
import { BottomToolbar } from '../../../common/components/BottomToolbar';
import { CanvasNotice } from '../../../common/components/CanvasNotice';
import { ValidationSheet } from '../../../common/components/ValidationSheet';
import { TreeCanvas } from '../../../common/components/TreeCanvas';
import { AvlConfig } from './AvlConfig';
import { validateManualAvl, type AvlManualNode } from '../model/validate';
import type { ValidationResult } from '../../../common/validate/graph';
import type { Key, KeyType } from '../../../common/types';
import { createScopedStorage } from '../../../common/storage/storage';
import { useViewPersistence } from '../../../common/hooks/use-view-persistence';
import { cn } from '../../../common/lib/utils';

const storage = createScopedStorage('avl');
const KEYS = {
  manual: storage.key('manual-draft'),
  manualView: storage.key('manual-view'),
};
const load = storage.load;
const save = storage.save;

const SLOT_W = 30;
const KEY_W = 96;
const NODE_W = SLOT_W * 2 + KEY_W;
const NODE_H = 48;

function slotX(x: number, slot: number): number {
  return x + (slot === 0 ? SLOT_W / 2 : NODE_W - SLOT_W / 2);
}

function uid(): string {
  return `av${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

interface Draft {
  nodes: AvlManualNode[];
  rootId: string | null;
  keyType: KeyType;
}

function seed(): Draft {
  const root: AvlManualNode = { id: uid(), key: 20, slots: [null, null], x: 700, y: 450 };
  const left: AvlManualNode = { id: uid(), key: 10, slots: [null, null], x: 350, y: 800 };
  const right: AvlManualNode = { id: uid(), key: 30, slots: [null, null], x: 1050, y: 800 };
  root.slots = [left.id, right.id];
  return { nodes: [root, left, right], rootId: root.id, keyType: 'number' };
}

export function ManualPlayground() {
  const { hidden } = useChrome();
  const [draft, setDraft] = React.useState<Draft>(() => {
    const saved = load<Draft | null>(KEYS.manual, null);
    if (saved && Array.isArray(saved.nodes)) {
      return {
        ...saved,
        keyType: saved.keyType === 'string' ? 'string' : 'number',
        nodes: saved.nodes.map((n) => ({ ...n, slots: [n.slots?.[0] ?? null, n.slots?.[1] ?? null] })),
      };
    }
    return seed();
  });
  const [linking, setLinking] = React.useState<{ nodeId: string; slot: number } | null>(null);
  const [result, setResult] = React.useState<ValidationResult | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<KeyType | null>(null);
  const [undoStack, setUndoStack] = React.useState<Draft[]>([]);
  const [redoStack, setRedoStack] = React.useState<Draft[]>([]);
  const dragRef = React.useRef<{ id: string; nx: number; ny: number; sx: number; sy: number; snap: Draft } | null>(null);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  const { nodes, rootId, keyType } = draft;

  const { initialView, viewRef, handleViewChange } = useViewPersistence(KEYS.manualView);

  const [initialCenter] = React.useState<{ x: number; y: number } | null>(() => {
    if (draft.nodes.length === 0) return null;
    const cx = draft.nodes.reduce((a, n) => a + n.x + NODE_W / 2, 0) / draft.nodes.length;
    const cy = draft.nodes.reduce((a, n) => a + n.y + NODE_H / 2, 0) / draft.nodes.length;
    return { x: cx, y: cy };
  });

  React.useEffect(() => {
    save(KEYS.manual, draft);
  }, [draft]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLinking(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    function onUndoKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const lower = e.key.toLowerCase();
      if (lower === 'z' && !e.shiftKey) {
        if (undoStack.length === 0) return;
        e.preventDefault();
        doUndo();
      } else if ((lower === 'z' && e.shiftKey) || lower === 'y') {
        if (redoStack.length === 0) return;
        e.preventDefault();
        doRedo();
      }
    }
    window.addEventListener('keydown', onUndoKey);
    return () => window.removeEventListener('keydown', onUndoKey);
  });

  const errorIds = React.useMemo(
    () => new Set((result?.issues ?? []).map((i) => i.nodeId).filter(Boolean) as string[]),
    [result],
  );

  const edges = React.useMemo(
    () =>
      nodes.flatMap((n) =>
        n.slots.map((t, slot) => (t ? { from: n.id, to: t, slot } : null)).filter(Boolean) as { from: string; to: string; slot: number }[],
      ),
    [nodes],
  );

  function pushUndo(snapshot: Draft) {
    setUndoStack((s) => [...s, structuredClone(snapshot)].slice(-6));
  }

  function update(fn: (d: Draft) => Draft) {
    pushUndo(draft);
    setRedoStack([]);
    setDraft((d) => fn(structuredClone(d)));
    setResult(null);
    setSheetOpen(false);
  }

  function doUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, structuredClone(draft)]);
    setDraft(structuredClone(prev));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
  }

  function doRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, structuredClone(draft)].slice(-6));
    setDraft(structuredClone(next));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
  }

  function changeKeyType(next: KeyType) {
    if (next === keyType) return;
    if (!nodes.some((n) => n.key !== null)) {
      setDraft((d) => ({ ...d, keyType: next }));
      setResult(null);
      return;
    }
    setConfirmType(next);
  }

  function confirmTypeChange() {
    if (!confirmType) return;
    update((d) => ({
      ...d,
      keyType: confirmType,
      nodes: d.nodes.map((n) => ({ ...n, key: null, slots: [null, null] })),
    }));
    setLinking(null);
    setConfirmType(null);
  }

  function addNode() {
    update((d) => {
      const v = viewRef.current;
      const k = v.k || 1;
      const cx = v.w > 0 ? (v.w / 2 - v.x) / k : 900;
      const cy = v.h > 0 ? (v.h / 2 - v.y) / k : 700;
      const j = d.nodes.length % 5;
      const n: AvlManualNode = {
        id: uid(),
        key: null,
        slots: [null, null],
        x: Math.max(0, cx - NODE_W / 2 + j * 30),
        y: Math.max(0, cy - NODE_H / 2 + j * 24),
      };
      d.nodes.push(n);
      if (!d.rootId) d.rootId = n.id;
      return d;
    });
  }

  function deleteNode(id: string) {
    update((d) => {
      d.nodes = d.nodes.filter((n) => n.id !== id);
      for (const n of d.nodes) n.slots = n.slots.map((s) => (s === id ? null : s));
      if (d.rootId === id) d.rootId = d.nodes[0]?.id ?? null;
      return d;
    });
    if (linking?.nodeId === id) setLinking(null);
  }

  function setRoot(id: string) {
    update((d) => ({ ...d, rootId: id }));
  }

  function parseCell(raw: string): Key | null {
    if (keyType === 'string') {
      const v = raw.trim();
      return v === '' ? null : v;
    }
    const v = Number(raw.trim());
    if (raw.trim() === '' || !Number.isInteger(v)) return null;
    return v;
  }

  function commitKey(id: string, raw: string) {
    const v = parseCell(raw);
    const current = nodes.find((n) => n.id === id)?.key ?? null;
    if (v === current) return;
    update((d) => {
      const n = d.nodes.find((x) => x.id === id);
      if (n) n.key = v;
      return d;
    });
  }

  function startLink(nodeId: string, slot: number) {
    setLinking({ nodeId, slot });
  }

  function completeLink(targetId: string) {
    if (!linking) return;
    if (targetId === linking.nodeId) return;
    const { nodeId, slot } = linking;
    update((d) => {
      const n = d.nodes.find((x) => x.id === nodeId);
      if (n) n.slots[slot] = targetId;
      return d;
    });
    setLinking(null);
  }

  function removeLink(nodeId: string, slot: number) {
    update((d) => {
      const n = d.nodes.find((x) => x.id === nodeId);
      if (n) n.slots[slot] = null;
      return d;
    });
  }

  function doValidate() {
    setResult(validateManualAvl(nodes, rootId, keyType));
    setSheetOpen(true);
  }

  function doClear() {
    update((d) => ({ ...d, nodes: [], rootId: null }));
    setLinking(null);
  }

  function focusKey(id: string) {
    document.querySelector<HTMLInputElement>(`input[data-key-cell="${id}"]`)?.focus();
  }

  function onNodePointerDown(e: React.PointerEvent, id: string) {
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    dragRef.current = { id, nx: n.x, ny: n.y, sx: e.clientX, sy: e.clientY, snap: structuredClone(draft) };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onNodePointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const k = viewRef.current.k || 1;
    const nx = d.nx + (e.clientX - d.sx) / k;
    const ny = d.ny + (e.clientY - d.sy) / k;
    setDraft((prev) => ({ ...prev, nodes: prev.nodes.map((n) => (n.id === d.id ? { ...n, x: Math.max(0, nx), y: Math.max(0, ny) } : n)) }));
  }

  function onNodePointerUp() {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const cur = draftRef.current.nodes.find((n) => n.id === d.id);
    if (cur && (cur.x !== d.nx || cur.y !== d.ny)) {
      setUndoStack((s) => [...s, d.snap].slice(-6));
      setRedoStack([]);
    }
  }

  function renderSlot(n: AvlManualNode, slot: number) {
    const linked = n.slots[slot] ?? null;
    if (linked) {
      return (
        <button
          type="button"
          title={`Quitar puntero ${slot === 0 ? 'izquierdo' : 'derecho'}`}
          onClick={() => removeLink(n.id, slot)}
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
        onClick={() => startLink(n.id, slot)}
        className={cn(
          'flex size-5 items-center justify-center rounded-full border border-dashed',
          linking?.nodeId === n.id && linking?.slot === slot
            ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
            : 'border-zinc-400 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-500 dark:hover:border-zinc-100 dark:hover:text-zinc-100',
        )}
      >
        <Plus className="size-3" />
      </button>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="avl"
        mode="manual"
        config={<AvlConfig keyType={keyType} onKeyTypeChange={changeKeyType} />}
      />
      <div className="relative min-h-0 flex-1">
        {nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center p-3">
            <p className="text-center text-sm text-muted-foreground">
              No hay nodos. Creá el primero con el botón de la barra inferior.
            </p>
          </div>
        ) : (
          <TreeCanvas
            nodes={nodes}
            edges={edges}
            linking={!!linking}
            errorIds={errorIds}
            onBackgroundClick={() => setLinking(null)}
            getNodeWidth={() => NODE_W}
            getSlotCount={() => 2}
            getSlotX={(node, slot) => slotX(node.x, slot)}
            nodeHeight={NODE_H}
            initialCenter={initialCenter}
            initialView={initialView}
            onViewChange={handleViewChange}
            renderNode={(n) => {
              const isRoot = n.id === rootId;
              const isTarget = !!linking && linking.nodeId !== n.id;
              const bad = errorIds.has(n.id);
              return (
                <div
                  data-node
                  className={cn(
                    'rounded-md border bg-card shadow-sm',
                    bad
                      ? 'border-red-500 ring-1 ring-red-500 dark:border-red-400 dark:ring-red-400'
                      : isRoot
                        ? 'border-zinc-900 dark:border-zinc-100'
                        : 'border-border dark:border-zinc-700',
                    isTarget && 'ring-2 ring-dashed ring-zinc-500',
                  )}
                >
                  <div
                    className="flex h-6 cursor-grab touch-none items-center gap-1 border-b border-border px-1 text-muted-foreground active:cursor-grabbing dark:border-zinc-700"
                    onPointerDown={(e) => {
                      if ((e.target as HTMLElement).closest('input,button')) return;
                      onNodePointerDown(e, n.id);
                    }}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={onNodePointerUp}
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
                      onClick={() => focusKey(n.id)}
                      className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Plus className="size-3" />
                    </button>
                    {!isRoot && (
                      <button
                        type="button"
                        title="Marcar como raíz"
                        onClick={() => setRoot(n.id)}
                        className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Crown className="size-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Eliminar nodo"
                      onClick={() => deleteNode(n.id)}
                      className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>

                  <div className="grid h-6 w-full" style={{ gridTemplateColumns: `${SLOT_W}px minmax(0,1fr) ${SLOT_W}px` }}>
                    <span className="flex items-center justify-center">{renderSlot(n, 0)}</span>
                    <span className="flex min-w-0 items-center border-x border-border dark:border-zinc-700">
                      <Input
                        defaultValue={n.key ?? ''}
                        key={`${n.id}-${n.key ?? 'empty'}`}
                        data-key-cell={n.id}
                        inputMode={keyType === 'string' ? 'text' : 'numeric'}
                        aria-label="Clave"
                        className={cn(
                          'h-6 min-w-0 flex-1 select-text rounded-none border-0 bg-transparent px-0 text-center text-sm font-medium shadow-none focus-visible:ring-0',
                          bad && 'text-red-600 dark:text-red-400',
                        )}
                        onBlur={(e) => commitKey(n.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                      />
                    </span>
                    <span className="flex items-center justify-center">{renderSlot(n, 1)}</span>
                  </div>

                  {isTarget && (
                    <button
                      type="button"
                      onClick={() => completeLink(n.id)}
                      className="absolute -top-3 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 shadow dark:bg-zinc-100 dark:text-zinc-900"
                      title="Conectar aquí"
                    >
                      <ArrowDownToLine className="size-4" />
                    </button>
                  )}
                </div>
              );
            }}
          />
        )}
        {linking && (
          <CanvasNotice hidden={hidden}>
            Tocá el icono <ArrowDownToLine className="inline size-3.5" /> del nodo destino · Esc o fondo para cancelar
          </CanvasNotice>
        )}
      </div>

      <BottomToolbar label="Acciones del editor manual de AVL">
        <ToolbarButton size="sm" onClick={addNode}><Plus />Nodo</ToolbarButton>
        <ToolbarButton size="sm" variant="secondary" onClick={doValidate}><ShieldCheck />Validar</ToolbarButton>
        {undoStack.length > 0 && (
          <ToolbarButton size="sm" variant="outline" onClick={doUndo} title="Deshacer última acción (Ctrl+Z)">
            <Undo2 />Deshacer
          </ToolbarButton>
        )}
        {redoStack.length > 0 && (
          <ToolbarButton size="sm" variant="outline" onClick={doRedo} title="Rehacer acción (Ctrl+Shift+Z)">
            <Redo2 />Rehacer
          </ToolbarButton>
        )}
        {linking && <ToolbarButton size="sm" variant="outline" onClick={() => setLinking(null)}><X />Cancelar</ToolbarButton>}
        <ToolbarSeparator className="mx-1 max-[510px]:hidden" />
        <ToolbarButton size="sm" variant="ghost" onClick={doClear} title="Borrar todo"><Eraser /></ToolbarButton>
      </BottomToolbar>

      <ValidationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        result={result}
        successMessage="El árbol cumple BST y la condición de balance AVL."
        errorHint="Revisá los nodos marcados en rojo."
      />
      <ConfirmDialog
        open={confirmType !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmType(null);
        }}
        title="Cambiar tipo de clave"
        description={`Cambiar a claves de ${confirmType === 'string' ? 'texto' : 'tipo numérico'} borrará las claves actuales (se puede deshacer).`}
        confirmLabel="Borrar y cambiar"
        onConfirm={confirmTypeChange}
      />
    </div>
  );
}
