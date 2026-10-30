import * as React from 'react';
import { trackConfig, trackThrottled, useToolTracker } from '@/common/analytics';
import { useHistory } from '@/common/editor/use-history';
import { useManualSelection } from '@/common/editor/use-manual-selection';
import { useManualShortcuts } from '@/common/editor/use-manual-shortcuts';
import { useSharedModeState } from '@/common/share/use-shared-mode-state';
import type { Key, KeyType } from '@/common/types';
import type { ValidationResult } from '@/common/validate/graph';
import { validateManualAvl, type AvlManualNode } from '@/playgrounds/avl/model/validate';
import { avlShare, type AvlManualState } from '@/playgrounds/avl/share';
import { AVL_KEYS as KEYS, avlStorage } from '@/playgrounds/avl/storage';
import { MANUAL_NODE_H as NODE_H, MANUAL_NODE_W as NODE_W } from '@/playgrounds/avl/ui/node-metrics';
import { seed, uid, type AvlManualDraft } from './draft';

const load = avlStorage.load;
const save = avlStorage.save;

export function useAvlManual() {
  const trackTool = useToolTracker('avl', 'manual');
  const shared = useSharedModeState<AvlManualState>({ tree: 'avl', mode: 'manual', adapter: avlShare });
  const sharedInitial = shared.initial;
  const commitShared = shared.commit;

  const [draft, setDraft] = React.useState<AvlManualDraft>(() => {
    if (sharedInitial) return sharedInitial;
    const saved = load<AvlManualDraft | null>(KEYS.manual, null);
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

  const { nodes, rootId, keyType } = draft;
  const { selectedIds, setSelectedIds, selectedNodeIds } = useManualSelection(nodes);
  const history = useHistory<AvlManualDraft>();
  const draftRef = React.useRef(draft);
  React.useLayoutEffect(() => {
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

  function update(fn: (d: AvlManualDraft) => AvlManualDraft) {
    history.push(draft);
    setDraft((d) => fn(structuredClone(d)));
    setResult(null);
    setSheetOpen(false);
  }

  function doUndo() {
    const prev = history.undo(draft);
    if (!prev) return;
    setDraft(prev);
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('undo');
  }

  function doRedo() {
    const next = history.redo(draft);
    if (!next) return;
    setDraft(next);
    setResult(null);
    setSheetOpen(false);
    setLinking(null);
    trackTool('redo');
  }

  function changeKeyType(next: KeyType) {
    if (next === keyType) return;
    if (!nodes.some((n) => n.key !== null)) {
      setDraft((d) => ({ ...d, keyType: next }));
      setResult(null);
      trackConfig('key_type', next, { playground: 'avl', mode: 'manual' });
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
      nodes: d.nodes.map((n) => ({ ...n, key: null, slots: [null, null] })),
    }));
    setLinking(null);
    setConfirmType(null);
    trackConfig('key_type', nextType, { playground: 'avl', mode: 'manual', emptied: true });
  }

  function addNodeAt(point: { x: number; y: number }) {
    update((d) => {
      const n: AvlManualNode = {
        id: uid(),
        key: null,
        slots: [null, null],
        x: Math.max(0, point.x - NODE_W / 2),
        y: Math.max(0, point.y - NODE_H / 2),
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
    if (v === null) trackTool('key_remove');
    else trackThrottled('avl:manual:key_edit', 'tool_use', { playground: 'avl', mode: 'manual', tool: 'key_edit' });
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
      if (n) n.slots[slot] = targetId;
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
    const next = validateManualAvl(nodes, rootId, keyType);
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

  function focusKey(id: string) {
    document.querySelector<HTMLInputElement>(`input[data-key-cell="${id}"]`)?.focus();
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

  const share = React.useMemo(() => ({ adapter: avlShare, state: draft }), [draft]);

  return {
    draft,
    draftRef,
    nodes,
    rootId,
    keyType,
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
    commitKey,
    focusKey,
    startLink,
    completeLink,
    removeLink,
    doValidate,
    doClear,
    doUndo,
    doRedo,
    changeKeyType,
    confirmTypeChange,
    deleteSelected,
    moveNodes,
    commitDrag: history.push,
    share,
  };
}
