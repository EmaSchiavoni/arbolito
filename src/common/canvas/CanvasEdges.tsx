import type { ReactNode } from 'react';
import type { CanvasEdge, CanvasNode } from './types';

interface CanvasEdgesProps<T extends CanvasNode> {
  edges: CanvasEdge[];
  byId: Map<string, T>;
  contentW: number;
  contentH: number;
  pathFor: (from: T, to: T, slot: number) => string;
  highlightIds?: Set<string>;
  highlightEdges?: Set<string>;
  errorIds?: Set<string>;
  fadeEdges?: boolean;
  edgeFadeKey?: string | number;
  animationDurationMs: number;
  extraSvg?: ReactNode;
}

export function CanvasEdges<T extends CanvasNode>({
  edges,
  byId,
  contentW,
  contentH,
  pathFor,
  highlightIds,
  highlightEdges,
  errorIds,
  fadeEdges,
  edgeFadeKey,
  animationDurationMs,
  extraSvg,
}: CanvasEdgesProps<T>) {
  return (
    <svg width={contentW} height={contentH} className="absolute left-0 top-0 overflow-visible">
      <g
        key={fadeEdges ? `edges-${edgeFadeKey ?? 0}` : 'edges'}
        className={fadeEdges ? 'animate-edge-fade' : undefined}
        style={fadeEdges ? { animationDuration: `${animationDurationMs}ms` } : undefined}
      >
        {edges.map((e, i) => {
          const f = byId.get(e.from);
          const t = byId.get(e.to);
          if (!f || !t) return null;
          // La flecha se resalta explícitamente si se está recorriendo ese
          // arco; sin lista explícita, se resalta solo si ambos extremos
          // pertenecen al camino marcado.
          const hot = highlightEdges
            ? highlightEdges.has(`${e.from}:${e.to}`)
            : !!highlightIds?.has(e.from) && !!highlightIds?.has(e.to);
          const bad = errorIds?.has(e.from) || errorIds?.has(e.to);
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={pathFor(f, t, e.slot)}
              fill="none"
              strokeWidth={hot ? 2.5 : 1.5}
              className={
                bad
                  ? 'stroke-red-500 dark:stroke-red-400'
                  : hot
                    ? 'stroke-zinc-900 dark:stroke-zinc-100'
                    : 'stroke-zinc-400 dark:stroke-zinc-500'
              }
              markerEnd="url(#arrow)"
            />
          );
        })}
      </g>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" strokeWidth="1.2" className="stroke-zinc-500 dark:stroke-zinc-400" />
        </marker>
      </defs>
      {extraSvg}
    </svg>
  );
}
