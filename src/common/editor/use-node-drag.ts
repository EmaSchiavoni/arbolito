import * as React from 'react';
import type { CanvasView } from '@/common/hooks/use-view-persistence';

interface DragNode {
  id: string;
  x: number;
  y: number;
}

interface UseNodeDragArgs<T extends DragNode, TSnapshot> {
  nodes: T[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  viewRef: React.RefObject<CanvasView>;
  getCurrentNodes: () => T[];
  getSnapshot: () => TSnapshot;
  onMove: (origins: Map<string, { x: number; y: number }>, dx: number, dy: number) => void;
  onCommit: (snapshot: TSnapshot) => void;
}

// Arrastre de uno o varios nodos: el mismo delta para todos los orígenes y
// un único snapshot para que mover el grupo se deshaga en un solo paso.
export function useNodeDrag<T extends DragNode, TSnapshot>({
  nodes,
  selectedIds,
  setSelectedIds,
  viewRef,
  getCurrentNodes,
  getSnapshot,
  onMove,
  onCommit,
}: UseNodeDragArgs<T, TSnapshot>) {
  const dragRef = React.useRef<{
    ids: string[];
    origins: Map<string, { x: number; y: number }>;
    sx: number;
    sy: number;
    snap: TSnapshot;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent, id: string) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    if (!byId.has(id)) return;
    // Arrastrar un nodo seleccionado mueve toda la selección; arrastrar uno
    // fuera de ella descarta la selección y mueve solo ese nodo.
    const ids = selectedIds.has(id) ? [...selectedIds] : [id];
    if (!selectedIds.has(id)) setSelectedIds(new Set());
    const origins = new Map<string, { x: number; y: number }>();
    for (const nodeId of ids) {
      const node = byId.get(nodeId);
      if (node) origins.set(nodeId, { x: node.x, y: node.y });
    }
    dragRef.current = {
      ids: [...origins.keys()],
      origins,
      sx: e.clientX,
      sy: e.clientY,
      snap: structuredClone(getSnapshot()),
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const k = viewRef.current.k || 1;
    // El clamp se aplica al delta común para que el grupo no se deforme al
    // tocar el borde superior/izquierdo.
    let minX = Infinity;
    let minY = Infinity;
    for (const origin of d.origins.values()) {
      minX = Math.min(minX, origin.x);
      minY = Math.min(minY, origin.y);
    }
    const dx = Math.max((e.clientX - d.sx) / k, -minX);
    const dy = Math.max((e.clientY - d.sy) / k, -minY);
    onMove(d.origins, dx, dy);
  }

  function onPointerUp() {
    // El arrastre cuenta como una sola acción: si algún nodo se movió, se
    // guarda el estado previo para deshacer todo el grupo de una vez.
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const current = getCurrentNodes();
    const changed = d.ids.some((id) => {
      const cur = current.find((n) => n.id === id);
      const origin = d.origins.get(id);
      return !!cur && !!origin && (cur.x !== origin.x || cur.y !== origin.y);
    });
    if (changed) onCommit(d.snap);
  }

  return { onPointerDown, onPointerMove, onPointerUp };
}
