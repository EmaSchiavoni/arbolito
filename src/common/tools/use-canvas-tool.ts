import * as React from 'react';
import type { CanvasTool } from './types';

// Estado de la herramienta activa del canvas. Hay una sola a la vez y volver
// a elegir la misma la deselecciona.
export function useCanvasTool(tools: CanvasTool[], initialToolId: string | null = null) {
  const [activeId, setActiveId] = React.useState<string | null>(initialToolId);

  const activeTool = React.useMemo(
    () => tools.find((tool) => tool.id === activeId) ?? null,
    [tools, activeId],
  );

  const toggleTool = React.useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : id));
  }, []);

  const clearTool = React.useCallback(() => setActiveId(null), []);

  return { activeTool, activeId, setActiveId, toggleTool, clearTool };
}
