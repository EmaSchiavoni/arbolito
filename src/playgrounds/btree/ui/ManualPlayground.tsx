import * as React from 'react';
import { ArrowDownToLine, Crown, GripVertical, Plus, Trash2, X, ShieldCheck, Eraser, Undo2, Redo2 } from 'lucide-react';
import { Input } from '../../../common/components/ui/input';
import { Badge } from '../../../common/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../common/components/ui/sheet';
import { ConfirmDialog } from '../../../common/components/ui/alert-dialog';
import { ToolbarButton, ToolbarSeparator } from '../../../common/components/ui/toolbar';
import { ToolButton } from '../../../common/components/ToolButton';
import { BottomToolbar } from '../../../common/components/BottomToolbar';
import { CanvasNotice } from '../../../common/components/CanvasNotice';
import { ORDER_MAX, ORDER_MIN } from '../../../common/components/OrderPicker';
import { AppShell } from '../../../app/AppShell';
import { useChrome } from '../../../app/use-chrome';
import { BTreeConfig } from './BTreeConfig';
import { TreeCanvas } from '../../../common/components/TreeCanvas';
import { validateManualTree, type ManualNode, type ValidationResult } from '../model/validate';
import type { Key, KeyType } from '../../../common/types';
import { trackConfig, trackThrottled, useToolTracker } from '../../../common/analytics';
import { createScopedStorage } from '../../../common/storage/storage';
import { useViewPersistence } from '../../../common/hooks/use-view-persistence';
import { createNodeTool, useCanvasTool, type ToolPoint } from '../../../common/tools';
import { cn } from '../../../common/lib/utils';

const storage = createScopedStorage('btree');
const KEYS = {
  manual: storage.key('manual-draft'),
  manualView: storage.key('manual-view'),
};
const load = storage.load;
const save = storage.save;

// Tabla completa siempre visible: p columnas de puntero (delgadas) + p-1
// celdas de clave, una al lado de otra (nodo lleno: 2p-1 columnas). La columna
// de puntero solo aloja el inicio de la flecha. Las celdas de clave vacías se
// editan directo; solo los primeros |claves|+1 slots aceptan punteros.
const SLOT_COL_W = 30;
const KEY_COL_W = 64;

function manualNodeWidth(p: number): number {
  return Math.max(150, p * SLOT_COL_W + (p - 1) * KEY_COL_W);
}

// Coordenada x absoluta del centro de la columna del slot (para la flecha).
function manualSlotX(x: number, p: number, slot: number): number {
  const w = manualNodeWidth(p);
  const keyW = (w - p * SLOT_COL_W) / (p - 1);
  return x + slot * (SLOT_COL_W + keyW) + SLOT_COL_W / 2;
}

function uid(): string {
  return `m${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

interface Draft {
  nodes: ManualNode[];
  rootId: string | null;
  p: number;
  keyType: KeyType;
}

function seed(): Draft {
  // Lejos del origen para poder mover los nodos en todas direcciones.
  const a: ManualNode = { id: uid(), keys: [10, 20], slots: [null, null, null], x: 700, y: 450 };
  const b: ManualNode = { id: uid(), keys: [5], slots: [null, null], x: 200, y: 850 };
  const c: ManualNode = { id: uid(), keys: [15], slots: [null, null], x: 1100, y: 850 };
  a.slots = [b.id, c.id, null];
  return { nodes: [a, b, c], rootId: a.id, p: 4, keyType: 'number' };
}

function fixSlots(keys: Key[], slots: (string | null)[]): (string | null)[] {
  const need = keys.length + 1;
  const next = slots.slice(0, need);
  while (next.length < need) next.push(null);
  return next;
}

export function ManualPlayground() {
  const { hidden } = useChrome();
  const trackTool = useToolTracker('btree', 'manual');
  const [draft, setDraft] = React.useState<Draft>(() => {
    const saved = load<Draft | null>(KEYS.manual, null);
    if (saved && Array.isArray(saved.nodes)) {
      return {
        ...saved,
        p: Math.min(ORDER_MAX, Math.max(ORDER_MIN, saved.p || 4)),
        keyType: saved.keyType === 'string' ? 'string' : 'number',
      };
    }
    return seed();
  });
  const [linking, setLinking] = React.useState<{ nodeId: string; slot: number } | null>(null);
  const [result, setResult] = React.useState<ValidationResult | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<'number' | 'string' | null>(null);
  const dragRef = React.useRef<{ id: string; nx: number; ny: number; sx: number; sy: number; snap: Draft } | null>(null);

  const { nodes, rootId, p, keyType } = draft;
  const isStr = keyType === 'string';

  // Cambiar el tipo sin claves es directo; con claves pide confirmación
  // porque vacía los nodos (se puede deshacer).
  function changeKeyType(next: KeyType) {
    if (next === keyType) return;
    if (!nodes.some((n) => n.keys.length > 0)) {
      setDraft((d) => ({ ...d, keyType: next }));
      setResult(null);
      trackConfig('key_type', next, { playground: 'btree', mode: 'manual' });
      return;
    }
    setConfirmType(next);
  }

  function confirmTypeChange() {
    if (!confirmType) return;
    pushUndo(draft);
    setRedoStack([]);
    setDraft((d) => ({
      ...d,
      keyType: confirmType,
      nodes: d.nodes.map((n) => ({ ...n, keys: [], slots: [null] as (string | null)[] })),
    }));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    setConfirmType(null);
    trackConfig('key_type', confirmType, { playground: 'btree', mode: 'manual', emptied: true });
  }

  // Vista del canvas (paneo/zoom): se restaura al abrir y se guarda con
  // debounce en cada cambio (más un volcado al desmontar por cambio de modo).
  // El ref expone el tamaño/zoom actual para ubicar nodos nuevos.
  const { initialView, viewRef, handleViewChange } = useViewPersistence(KEYS.manualView);

  const nodeTool = createNodeTool({ onPlace: (point) => addNodeAt(point) });
  const { activeTool, activeId, toggleTool } = useCanvasTool([nodeTool]);

  // Centroide de los nodos al abrir (una sola vez): el canvas centra la
  // vista ahí para que los nodos aparezcan centrados en su nueva posición.
  const [initialCenter] = React.useState<{ x: number; y: number } | null>(() => {
    if (draft.nodes.length === 0) return null;
    const w = manualNodeWidth(draft.p);
    const cx = draft.nodes.reduce((a, n) => a + n.x + w / 2, 0) / draft.nodes.length;
    const cy = draft.nodes.reduce((a, n) => a + n.y + 32, 0) / draft.nodes.length;
    return { x: cx, y: cy };
  });

  // Pila de deshacer (LIFO): snapshots previos a cada mutación, hasta 6
  // (al superar el tope se descarta el más viejo, FIFO). Solo vive en memoria.
  const [undoStack, setUndoStack] = React.useState<Draft[]>([]);
  // Pila de rehacer: acciones deshechas que se pueden repetir. Cualquier
  // acción manual la vacía.
  const [redoStack, setRedoStack] = React.useState<Draft[]>([]);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

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

  // Ctrl/Cmd+Z deshace, Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y rehace (no interfieren
  // con el undo/redo nativo de los inputs: si el foco está escribiendo, nada).
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

  const errorIds = React.useMemo(() => new Set((result?.issues ?? []).map((i) => i.nodeId).filter(Boolean) as string[]), [result]);

  const edges = React.useMemo(
    () => nodes.flatMap((n) => n.slots.map((t, slot) => (t ? { from: n.id, to: t, slot } : null)).filter(Boolean) as { from: string; to: string; slot: number }[]),
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
    // Se restauran nodos y raíz; el orden p actual se conserva.
    setDraft((d) => ({ ...structuredClone(prev), p: d.p }));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('undo');
  }

  function doRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, structuredClone(draft)].slice(-6));
    // Se restauran nodos y raíz; el orden p actual se conserva.
    setDraft((d) => ({ ...structuredClone(next), p: d.p }));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('redo');
  }

  function addNodeAt(point: ToolPoint) {
    update((d) => {
      const n: ManualNode = {
        id: uid(),
        keys: [],
        slots: [null],
        x: Math.max(0, point.x - manualNodeWidth(d.p) / 2),
        y: Math.max(0, point.y - 32),
      };
      d.nodes.push(n);
      if (!d.rootId) d.rootId = n.id;
      return d;
    });
    trackTool('node_add');
  }

  function deleteNode(id: string) {
    update((d) => {
      d.nodes = d.nodes.filter((n) => n.id !== id);
      for (const n of d.nodes) n.slots = n.slots.map((s) => (s === id ? null : s));
      if (d.rootId === id) d.rootId = d.nodes[0]?.id ?? null;
      return d;
    });
    if (linking?.nodeId === id) setLinking(null);
    trackTool('node_delete');
  }

  function setRoot(id: string) {
    update((d) => ({ ...d, rootId: id }));
    trackTool('root_set');
  }

  function parseCell(raw: string): Key | null {
    // En modo texto todo es cadena; en numérico solo enteros.
    if (isStr) {
      const v = raw.trim();
      return v === '' ? null : v;
    }
    const v = Number(raw.trim());
    if (raw.trim() === '' || !Number.isInteger(v)) return null;
    return v;
  }

  function addKey(id: string, raw: string) {
    // El modo manual es libre: se aceptan duplicados (los reporta Validar).
    const v = parseCell(raw);
    if (v === null) return;
    const n = nodes.find((x) => x.id === id);
    if (!n || n.keys.length >= p - 1) return;
    update((d) => {
      const t = d.nodes.find((x) => x.id === id);
      if (!t || t.keys.length >= d.p - 1) return d;
      t.keys = [...t.keys, v];
      t.slots = fixSlots(t.keys, t.slots);
      return d;
    });
    trackTool('key_add');
  }

  // Lleva el foco a la primera celda de clave vacía del nodo.
  function focusEmptyKey(id: string) {
    const el = document.querySelector<HTMLInputElement>(`input[data-empty-cell="${id}"]`);
    el?.focus();
  }

  function removeKey(id: string, index: number) {
    update((d) => {
      const n = d.nodes.find((x) => x.id === id);
      if (!n || index < 0 || index >= n.keys.length) return d;
      n.keys.splice(index, 1);
      n.slots = fixSlots(n.keys, n.slots);
      return d;
    });
    trackTool('key_remove');
  }

  // Foco a restaurar tras un commit que remonta inputs (p. ej. al tabular
  // después de vaciar una celda). Solo se aplica si el foco quedó en el aire.
  const focusRef = React.useRef<{ id: string; slot: number } | null>(null);
  React.useEffect(() => {
    if (!focusRef.current) return;
    const target = focusRef.current;
    focusRef.current = null;
    if (document.activeElement && document.activeElement !== document.body) return;
    const el = document.querySelector<HTMLInputElement>(
      `input[data-key-cell="${target.id}:${target.slot}"], input[data-empty-cell="${target.id}"]`,
    );
    el?.focus();
  });

  function editKey(id: string, index: number, raw: string) {
    const v = parseCell(raw);
    if (v === null) return;
    update((d) => {
      const n = d.nodes.find((x) => x.id === id);
      if (!n) return d;
      n.keys[index] = v;
      return d;
    });
    trackThrottled('btree:manual:key_edit', 'tool_use', { playground: 'btree', mode: 'manual', tool: 'key_edit' });
  }

  // Commit de una celda con clave al perder el foco: celda vaciada = clave
  // eliminada (equivale a la ×); valor sin cambios = no tocar el estado.
  function commitKeyCell(id: string, slot: number, raw: string) {
    if (raw.trim() === '') {
      focusRef.current = { id, slot };
      removeKey(id, slot);
      return;
    }
    const v = parseCell(raw);
    if (v === null) return;
    if (nodes.find((x) => x.id === id)?.keys[slot] === v) return;
    editKey(id, slot, raw);
  }

  function startLink(nodeId: string, slot: number) {
    setLinking({ nodeId, slot });
    trackTool('link_start');
  }

  function completeLink(targetId: string) {
    if (!linking) return;
    if (targetId === linking.nodeId) return;
    const { nodeId, slot } = linking;
    update((d) => {
      const n = d.nodes.find((x) => x.id === nodeId);
      if (n) {
        n.slots = fixSlots(n.keys, n.slots);
        n.slots[slot] = targetId;
      }
      return d;
    });
    setLinking(null);
    trackTool('link_add');
  }

  function removeLink(nodeId: string, slot: number) {
    update((d) => {
      const n = d.nodes.find((x) => x.id === nodeId);
      if (n) n.slots[slot] = null;
      return d;
    });
    trackTool('link_remove');
  }

  function doValidate() {
    const next = validateManualTree(nodes, p, rootId, keyType);
    setResult(next);
    setSheetOpen(true);
    trackTool('validate', { valid: next.valid, errors: next.issues.length });
  }

  function doClear() {
    pushUndo(draft);
    setRedoStack([]);
    setDraft((d) => ({ ...d, nodes: [], rootId: null }));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('clear');
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
    // El arrastre cuenta como una sola acción: si el nodo se movió, se guarda
    // la posición previa para poder deshacerla.
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const cur = draftRef.current.nodes.find((n) => n.id === d.id);
    if (cur && (cur.x !== d.nx || cur.y !== d.ny)) {
      setUndoStack((s) => [...s, d.snap].slice(-6));
      setRedoStack([]);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="btree"
        mode="manual"
        config={
          <BTreeConfig
            id="orden-manual"
            p={p}
            onPChange={(next) => {
              setDraft((d) => ({ ...d, p: next }));
              setRedoStack([]);
              setResult(null);
              trackConfig('order_p', next, { playground: 'btree', mode: 'manual' });
            }}
            keyType={keyType}
            onKeyTypeChange={changeKeyType}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
          <TreeCanvas
          nodes={nodes}
          edges={edges}
          gridBackground
          linking={!!linking}
          errorIds={errorIds}
          onBackgroundClick={() => setLinking(null)}
          getNodeWidth={() => manualNodeWidth(p)}
          getSlotX={(node, slot) => manualSlotX(node.x, p, slot)}
          initialCenter={initialCenter}
          initialView={initialView}
          onViewChange={handleViewChange}
          tool={activeTool}
          renderNode={(n) => {
            const isRoot = n.id === rootId;
            const isTarget = !!linking && linking.nodeId !== n.id;
            const bad = errorIds.has(n.id);
            const full = n.keys.length >= p - 1;
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
                  bad ? 'border-red-500 ring-1 ring-red-500 dark:border-red-400 dark:ring-red-400' : isRoot ? 'border-zinc-900 dark:border-zinc-100' : 'border-border dark:border-zinc-700',
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
                  {!full && (
                    <button type="button" title="Ir a la primera celda vacía" onClick={() => focusEmptyKey(n.id)} className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Plus className="size-3" />
                    </button>
                  )}
                  {!isRoot && (
                    <button type="button" title="Marcar como raíz" onClick={() => setRoot(n.id)} className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Crown className="size-3" />
                    </button>
                  )}
                  <button type="button" title="Eliminar nodo" onClick={() => deleteNode(n.id)} className="shrink-0 rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Trash2 className="size-3" />
                  </button>
                </div>

                <div className="grid h-10 w-full" style={{ gridTemplateColumns: cols.join(' ') }}>
                  {Array.from({ length: p }, (_, slot) => {
                    const live = slot <= n.keys.length; // slots existentes: |claves|+1
                    const linked = live ? n.slots[slot] : null;
                    return (
                      <span key={`cells-${slot}`} className="contents">
                        <span className={cn('flex items-center justify-center', slot > 0 && 'border-l border-border dark:border-zinc-700')}>
                          {!live ? (
                            <span className="size-1.5 rounded-full border border-zinc-300 dark:border-zinc-600" title={`Puntero ${slot} (se habilita al agregar claves)`} />
                          ) : linked ? (
                            <button
                              type="button"
                              title={`Quitar puntero ${slot}`}
                              onClick={() => removeLink(n.id, slot)}
                              className="flex size-5 items-center justify-center rounded-full border border-zinc-900 dark:border-zinc-100"
                            >
                              <X className="size-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title={`Crear puntero ${slot} desde aquí`}
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
                          )}
                        </span>
                        {slot < p - 1 && (
                          slot < n.keys.length ? (
                            <span className="group/key relative flex min-w-0 items-center border-l border-border dark:border-zinc-700">
                              <Input
                                defaultValue={n.keys[slot]}
                                key={`${n.id}-${slot}-${n.keys[slot]}`}
                                data-key-cell={`${n.id}:${slot}`}
                                inputMode={isStr ? 'text' : 'numeric'}
                                aria-label={`Clave ${slot + 1}`}
                                className={cn('h-8 min-w-0 flex-1 select-text rounded-none border-0 bg-transparent px-0 text-center text-sm font-medium shadow-none focus-visible:ring-0', bad && 'text-red-600 dark:text-red-400')}
                                onBlur={(e) => commitKeyCell(n.id, slot, e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              />
                              <button
                                type="button"
                                title="Quitar clave"
                                onClick={() => removeKey(n.id, slot)}
                                className="absolute -top-0.5 right-0 rounded-full bg-card p-0.5 text-muted-foreground hover:text-foreground max-sm:opacity-100 sm:opacity-0 sm:group-hover/key:opacity-100"
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ) : (
                            <span className="flex min-w-0 items-center border-l border-border dark:border-zinc-700">
                              <Input
                                key={`${n.id}-empty-${slot}`}
                                data-empty-cell={n.id}
                                inputMode={isStr ? 'text' : 'numeric'}
                                aria-label={`Clave vacía ${slot + 1}`}
                                className="h-8 min-w-0 flex-1 select-text rounded-none border-0 bg-transparent px-0 text-center text-sm font-medium text-muted-foreground shadow-none focus-visible:ring-0"
                                onBlur={(e) => { addKey(n.id, e.target.value); e.target.value = ''; }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addKey(n.id, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                              />
                            </span>
                          )
                        )}
                      </span>
                    );
                  })}
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
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
          <p className="text-center text-sm text-muted-foreground">
            No hay nodos. Elegí la herramienta Nodo y tocá el canvas.
          </p>
        </div>
      )}
      {linking && (
        <CanvasNotice hidden={hidden}>
          Tocá el icono <ArrowDownToLine className="inline size-3.5" /> del nodo destino · Esc o fondo para cancelar
        </CanvasNotice>
      )}
        </div>

      <BottomToolbar label="Acciones del editor manual">
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
        <ToolbarSeparator className="mx-1 max-[665px]:hidden" />
        <ToolButton tool={nodeTool} active={activeId === nodeTool.id} onSelect={() => toggleTool(nodeTool.id)} />
        <ToolbarButton size="sm" variant="ghost" onClick={doClear} title="Borrar todo"><Eraser /></ToolbarButton>
      </BottomToolbar>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh] overflow-auto rounded-t-3xl sm:mx-auto sm:w-full sm:max-w-lg sm:rounded-3xl">
          <SheetHeader>
            <SheetTitle>Resultado de la validación</SheetTitle>
          </SheetHeader>
          <div className="mt-3">
            {!result ? null : result.valid ? (
              <div className="flex items-center gap-2">
                <Badge variant="ok">válido</Badge>
                <p className="text-sm text-muted-foreground">El árbol cumple todas las reglas del orden p = {p}.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="error">{result.issues.length} errores</Badge>
                  <p className="text-sm text-muted-foreground">Revisá los nodos marcados en rojo.</p>
                </div>
                <ul className="space-y-1.5">
                  {result.issues.map((it, i) => (
                    <li key={i} className="rounded-2xl border border-red-200 px-3 py-2 text-sm text-muted-foreground dark:border-red-900">
                      · {it.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmType !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmType(null);
        }}
        title="Cambiar tipo de clave"
        description={`Cambiar a claves de ${confirmType === 'string' ? 'texto' : 'tipo numérico'} vaciará los nodos actuales (se puede deshacer).`}
        confirmLabel="Vaciar y cambiar"
        onConfirm={confirmTypeChange}
      />
    </div>
  );
}
