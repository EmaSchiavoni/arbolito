import * as React from 'react';
import { useViewPersistence } from '@/common/hooks/use-view-persistence';
import { createNodeTool, panTool, useCanvasTool, useMarqueeSelection, type ToolPoint } from '@/common/tools';

interface ManualCanvasNode {
  id: string;
  x: number;
  y: number;
}

interface ManualCanvasArgs<T extends ManualCanvasNode> {
  storageKey: string;
  nodes: T[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onPlace: (point: ToolPoint) => void;
  getNodeBox: () => { width: number; height: number };
  // Desplazamiento desde la esquina del nodo hasta su centro (ancho/2, alto/2).
  centerOffset: { x: number; y: number };
}

export function useManualCanvas<T extends ManualCanvasNode>({
  storageKey,
  nodes,
  selectedIds,
  onSelectionChange,
  onPlace,
  getNodeBox,
  centerOffset,
}: ManualCanvasArgs<T>) {
  const { initialView, viewRef, handleViewChange } = useViewPersistence(storageKey);

  const nodeTool = createNodeTool({ onPlace });
  const { tool: selectionTool, rect: marquee } = useMarqueeSelection({
    nodes,
    selectedIds,
    getNodeBox: () => getNodeBox(),
    onSelectionChange,
  });
  const { activeTool, activeId, toggleTool } = useCanvasTool([panTool, nodeTool, selectionTool]);

  // Centroide de los nodos al abrir (una sola vez): el canvas centra la
  // vista ahí para que los nodos aparezcan centrados en su nueva posición.
  const [initialCenter] = React.useState<{ x: number; y: number } | null>(() => {
    if (nodes.length === 0) return null;
    const cx = nodes.reduce((a, n) => a + n.x + centerOffset.x, 0) / nodes.length;
    const cy = nodes.reduce((a, n) => a + n.y + centerOffset.y, 0) / nodes.length;
    return { x: cx, y: cy };
  });

  return {
    initialView,
    viewRef,
    handleViewChange,
    panTool,
    nodeTool,
    selectionTool,
    marquee,
    activeTool,
    activeId,
    toggleTool,
    initialCenter,
  };
}
