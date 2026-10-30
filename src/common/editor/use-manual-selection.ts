import * as React from 'react';

// La selección solo expone ids que todavía existen en el árbol (borrados,
// undo/redo o cambios de tipo pueden dejar ids huérfanos en el estado).
export function useManualSelection(nodes: Array<{ id: string }>) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  const selectedNodeIds = React.useMemo(() => {
    if (selectedIds.size === 0) return selectedIds;
    const existing = new Set(nodes.map((n) => n.id));
    let changed = false;
    const next = new Set<string>();
    for (const id of selectedIds) {
      if (existing.has(id)) next.add(id);
      else changed = true;
    }
    return changed ? next : selectedIds;
  }, [selectedIds, nodes]);

  return { selectedIds, setSelectedIds, selectedNodeIds };
}
