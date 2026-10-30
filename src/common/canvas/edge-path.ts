import type { CanvasNode } from './types';

interface EdgePathArgs<T extends CanvasNode> {
  from: T;
  to: T;
  slot: number;
  positionOf: (node: T) => { x: number; y: number };
  widthOf: (node: T) => number;
  heightOf: number;
  getSlotCount?: (node: T) => number;
  getSlotX?: (node: T, slot: number) => number;
}

// Curva que sale del slot inferior del nodo origen y entra por el centro
// superior del destino.
export function edgePath<T extends CanvasNode>({
  from,
  to,
  slot,
  positionOf,
  widthOf,
  heightOf,
  getSlotCount,
  getSlotX,
}: EdgePathArgs<T>): string {
  const fromPos = positionOf(from);
  const toPos = positionOf(to);
  const positionedFrom = { ...from, x: fromPos.x, y: fromPos.y };
  const fw = widthOf(positionedFrom);
  const slotCount = getSlotCount ? getSlotCount(positionedFrom) : 1;
  const x1 = getSlotX
    ? getSlotX(positionedFrom, slot)
    : fromPos.x + ((slot + 0.5) / Math.max(1, slotCount)) * fw;
  const y1 = fromPos.y + heightOf;
  const tw = widthOf(to);
  const x2 = toPos.x + tw / 2;
  const y2 = toPos.y;
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}
