import * as React from 'react';
import { ORDER_MAX, ORDER_MIN } from '@/common/components/OrderPicker';
import { useHistory } from '@/common/editor/use-history';
import { useManualSelection } from '@/common/editor/use-manual-selection';
import { useManualShortcuts } from '@/common/editor/use-manual-shortcuts';
import { useSharedModeState } from '@/common/share/use-shared-mode-state';
import { trackConfig, trackThrottled, useToolTracker } from '@/common/analytics';
import type { Key, KeyType } from '@/common/types';
import type { ManualNode, ValidationResult } from '@/playgrounds/btree/model/validate';
import { validateManualTree } from '@/playgrounds/btree/model/validate';
import { btreeShare, type BTreeManualState } from '@/playgrounds/btree/share';
import { BTREE_KEYS as KEYS, btreeStorage } from '@/playgrounds/btree/storage';
import { manualNodeWidth } from '@/playgrounds/btree/ui/node-metrics';
import { fixSlots, seed, uid, type BTreeManualDraft } from './draft';

const load = btreeStorage.load;
const save = btreeStorage.save;

export function useBTreeManual() {
  const trackTool = useToolTracker('btree', 'manual');
  const shared = useSharedModeState<BTreeManualState>({ tree: 'btree', mode: 'manual', adapter: btreeShare });
  const sharedInitial = shared.initial;
  const commitShared = shared.commit;

  const [draft, setDraft] = React.useState<BTreeManualDraft>(() => {
    if (sharedInitial) return sharedInitial;
    const saved = load<BTreeManualDraft | null>(KEYS.manual, null);
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
  const [confirmType, setConfirmType] = React.useState<KeyType | null>(null);

  const { nodes, rootId, p, keyType } = draft;
  const isStr = keyType === 'string';
  const { selectedIds, setSelectedIds, selectedNodeIds } = useManualSelection(nodes);
  const history = useHistory<BTreeManualDraft>();
  const draftRef = React.useRef(draft);
  React.useEffect(() => {
    draftRef.current = draft;
  });

  React.useEffect(() => {
    if (!shared.active) save(KEYS.manual, draft);
  }, [draft, shared.active]);

  React.useEffect(() => {
    commitShared(draft);
  }, [draft, commitShared]);

  useManualShortcuts({
    onEscape: () => setLinking(null),
    onUndo: () => doUndo(),
    onRedo: () => doRedo(),
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  });

  const errorIds = React.useMemo(
    () => new Set((result?.issues ?? []).map((i) => i.nodeId).filter(Boolean) as string[]),
    [result],
  );

  const edges = React.useMemo(
    () =>
      nodes.flatMap(
        (n) =>
          n.slots
            .map((t, slot) => (t ? { from: n.id, to: t, slot } : null))
            .filter(Boolean) as { from: string; to: string; slot: number }[],
      ),
    [nodes],
  );

  function update(fn: (d: BTreeManualDraft) => BTreeManualDraft) {
    history.push(draft);
    setDraft((d) => fn(structuredClone(d)));
    setResult(null);
    setSheetOpen(false);
  }

  function doUndo() {
    const prev = history.undo(draft);
    if (!prev) return;
    // Se restauran nodos y raíz; el orden p actual se conserva.
    setDraft((d) => ({ ...prev, p: d.p }));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('undo');
  }

  function doRedo() {
    const next = history.redo(draft);
    if (!next) return;
    // Se restauran nodos y raíz; el orden p actual se conserva.
    setDraft((d) => ({ ...next, p: d.p }));
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('redo');
  }

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
    const nextType = confirmType;
    update((d) => ({
      ...d,
      keyType: nextType,
      nodes: d.nodes.map((n) => ({ ...n, keys: [], slots: [null] as (string | null)[] })),
    }));
    setLinking(null);
    setConfirmType(null);
    trackConfig('key_type', nextType, { playground: 'btree', mode: 'manual', emptied: true });
  }

  function changeOrder(next: number) {
    setDraft((d) => ({ ...d, p: next }));
    history.clearRedo();
    setResult(null);
    trackConfig('order_p', next, { playground: 'btree', mode: 'manual' });
  }

  function addNodeAt(point: { x: number; y: number }) {
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
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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
    update((d) => ({ ...d, nodes: [], rootId: null }));
    setLinking(null);
    setSelectedIds(new Set());
    trackTool('clear');
  }

  function deleteSelected() {
    const ids = selectedNodeIds;
    if (ids.size === 0) return;
    // Un solo update: el borrado múltiple entra en el historial como un paso.
    update((d) => {
      d.nodes = d.nodes.filter((n) => !ids.has(n.id));
      for (const n of d.nodes) n.slots = n.slots.map((s) => (s && ids.has(s) ? null : s));
      if (d.rootId && ids.has(d.rootId)) d.rootId = d.nodes[0]?.id ?? null;
      return d;
    });
    setSelectedIds(new Set());
    if (linking && ids.has(linking.nodeId)) setLinking(null);
    trackTool('node_delete', { count: ids.size, bulk: true });
  }

  function moveNodes(origins: Map<string, { x: number; y: number }>, dx: number, dy: number) {
    setDraft((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        const origin = origins.get(n.id);
        return origin ? { ...n, x: origin.x + dx, y: origin.y + dy } : n;
      }),
    }));
  }

  const share = React.useMemo(() => ({ adapter: btreeShare, state: draft }), [draft]);

  return {
    draft,
    draftRef,
    nodes,
    rootId,
    p,
    keyType,
    isStr,
    linking,
    setLinking,
    selectedIds,
    setSelectedIds,
    selectedNodeIds,
    result,
    sheetOpen,
    setSheetOpen,
    confirmType,
    setConfirmType,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    errorIds,
    edges,
    addNodeAt,
    deleteNode,
    setRoot,
    addKey,
    focusEmptyKey,
    removeKey,
    commitKeyCell,
    startLink,
    completeLink,
    removeLink,
    doValidate,
    doClear,
    doUndo,
    doRedo,
    changeOrder,
    changeKeyType,
    confirmTypeChange,
    deleteSelected,
    moveNodes,
    commitDrag: history.push,
    share,
  };
}
