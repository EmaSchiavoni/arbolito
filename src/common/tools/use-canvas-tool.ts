import * as React from 'react';
import type { CanvasTool } from '@/common/tools/types';

// Estado de la herramienta activa del canvas. Hay una sola a la vez y volver
// a elegir la misma la deselecciona, salvo la tool fija (paneo), que queda
// seleccionada cuando no hay ninguna otra.
export function useCanvasTool(tools: CanvasTool[], initialToolId: string | null = null) {
  const [rawId, setActiveId] = React.useState<string | null>(initialToolId);

  const pinnedId = React.useMemo(() => tools.find((tool) => tool.pinned)?.id ?? null, [tools]);

  const activeId = rawId ?? pinnedId;

  const activeTool = React.useMemo(
    () => tools.find((tool) => tool.id === activeId) ?? null,
    [tools, activeId],
  );

  const toggleTool = React.useCallback(
    (id: string) => {
      setActiveId((current) => {
        if (id === pinnedId) return id;
        return current === id ? null : id;
      });
    },
    [pinnedId],
  );

  const clearTool = React.useCallback(() => setActiveId(null), []);

  return { activeTool, activeId, setActiveId, toggleTool, clearTool };
}
