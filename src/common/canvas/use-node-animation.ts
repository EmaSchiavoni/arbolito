import * as React from 'react';
import type { CanvasNode } from './types';

type Position = { x: number; y: number };

// Interpola el movimiento de los nodos cuando cambia el layout (por ejemplo,
// tras una rotación). Devuelve la posición actual de cada nodo.
export function useNodeAnimation<T extends CanvasNode>(
  nodes: T[],
  animateNodes: boolean | undefined,
  animationDurationMs: number,
) {
  const positionsRef = React.useRef(new Map<string, Position>());
  const rafRef = React.useRef<number | null>(null);
  const lastTargetKey = React.useRef('');
  const [animatedPositions, setAnimatedPositions] = React.useState<Map<string, Position> | null>(null);
  const targetKey = React.useMemo(() => nodes.map((n) => `${n.id}:${n.x}:${n.y}`).join('|'), [nodes]);

  React.useEffect(() => {
    const current = nodes;
    const target = new Map(current.map((n) => [n.id, { x: n.x, y: n.y }]));

    if (!animateNodes) {
      lastTargetKey.current = targetKey;
      positionsRef.current = target;
      return;
    }
    if (targetKey === lastTargetKey.current) return;
    lastTargetKey.current = targetKey;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const from = new Map(positionsRef.current);
    if (from.size === 0) {
      positionsRef.current = target;
      return;
    }

    const duration = Math.max(0, animationDurationMs);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = new Map<string, Position>();
      for (const n of current) {
        const to = target.get(n.id);
        if (!to) continue;
        const fromNode = from.get(n.id) ?? to;
        next.set(n.id, {
          x: fromNode.x + (to.x - fromNode.x) * eased,
          y: fromNode.y + (to.y - fromNode.y) * eased,
        });
      }
      positionsRef.current = next;
      setAnimatedPositions(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        positionsRef.current = target;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [nodes, targetKey, animateNodes, animationDurationMs]);

  const positionOf = React.useCallback(
    (n: T) => (animateNodes ? animatedPositions?.get(n.id) : undefined) ?? { x: n.x, y: n.y },
    [animateNodes, animatedPositions],
  );

  return { positionOf };
}
