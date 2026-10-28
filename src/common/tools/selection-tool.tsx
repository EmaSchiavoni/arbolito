import * as React from 'react';
import type { CanvasTool } from './types';
import { Marquee2Icon } from './marquee-icon';

export interface MarqueeNode {
  id: string;
  x: number;
  y: number;
}

export interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface NodeBox {
  width: number;
  height: number;
}

interface Options<T extends MarqueeNode> {
  nodes: T[];
  selectedIds: Set<string>;
  getNodeBox: (node: T) => NodeBox;
  onSelectionChange: (ids: Set<string>) => void;
}

function normalizeRect(x1: number, y1: number, x2: number, y2: number): MarqueeRect {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

// Herramienta de selección por recuadro. El recuadro y los nodos se calculan
// en coordenadas del mundo, así que funciona igual con paneo y zoom.
// Shift extiende la selección existente en lugar de reemplazarla.
export function useMarqueeSelection<T extends MarqueeNode>({
  nodes,
  selectedIds,
  getNodeBox,
  onSelectionChange,
}: Options<T>) {
  const [rect, setRect] = React.useState<MarqueeRect | null>(null);
  const startRef = React.useRef<{ x: number; y: number; base: Set<string> } | null>(null);

  function resolve(area: MarqueeRect, base: Set<string>): Set<string> {
    const next = new Set(base);
    for (const node of nodes) {
      const box = getNodeBox(node);
      const intersects =
        node.x < area.x + area.w &&
        node.x + box.width > area.x &&
        node.y < area.y + area.h &&
        node.y + box.height > area.y;
      if (intersects) next.add(node.id);
    }
    return next;
  }

  const tool: CanvasTool = {
    id: 'select',
    label: 'Seleccionar',
    icon: Marquee2Icon,
    cursor: 'crosshair',
    onPress: (point) => {
      const base = point.event.shiftKey ? new Set(selectedIds) : new Set<string>();
      startRef.current = { x: point.x, y: point.y, base };
      setRect({ x: point.x, y: point.y, w: 0, h: 0 });
      if (!point.event.shiftKey) onSelectionChange(new Set());
    },
    onDrag: (point) => {
      const start = startRef.current;
      if (!start) return;
      const area = normalizeRect(start.x, start.y, point.x, point.y);
      setRect(area);
      onSelectionChange(resolve(area, start.base));
    },
    onRelease: (point) => {
      const start = startRef.current;
      startRef.current = null;
      setRect(null);
      if (!start || !point.dragged) return;
      const area = normalizeRect(start.x, start.y, point.x, point.y);
      onSelectionChange(resolve(area, start.base));
    },
  };

  return { tool, rect };
}
