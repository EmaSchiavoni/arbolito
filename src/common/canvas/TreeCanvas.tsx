import * as React from 'react';
import { Focus } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { cn } from '@/common/lib/utils';
import { CanvasEdges } from './CanvasEdges';
import { CanvasZoomIndicator } from './CanvasZoomIndicator';
import { edgePath } from './edge-path';
import type { CanvasNode, TreeCanvasProps } from './types';
import { useCanvasView } from './use-canvas-view';
import { useNodeAnimation } from './use-node-animation';

export type { CanvasEdge, CanvasNode, CanvasView } from './types';

const DEFAULT_NODE_WIDTH = 120;
const NODE_HEIGHT = 64;

export function TreeCanvas<T extends CanvasNode>({
  nodes,
  edges,
  renderNode,
  highlightIds,
  highlightEdges,
  errorIds,
  linking,
  onBackgroundClick,
  extraSvg,
  getNodeWidth,
  getSlotCount,
  getSlotX,
  nodeHeight,
  animateNodes,
  animationDurationMs = 300,
  gridBackground,
  fadeEdges,
  edgeFadeKey,
  initialCenter,
  initialView,
  onViewChange,
  tool,
  marquee,
}: TreeCanvasProps<T>) {
  const widthOf = getNodeWidth ?? (() => DEFAULT_NODE_WIDTH);
  const heightOf = nodeHeight ?? NODE_HEIGHT;

  const { positionOf } = useNodeAnimation(nodes, animateNodes, animationDurationMs);
  const {
    containerRef,
    pan,
    showRecenter,
    recenterOnNodes,
    zoomDraft,
    setZoomDraft,
    commitZoom,
    cancelBlurRef,
    flashZoom,
    patternStyle,
    cursor,
    pointerHandlers,
  } = useCanvasView({
    nodes,
    gridBackground,
    initialCenter,
    initialView,
    onViewChange,
    tool,
    widthOf,
    heightOf,
    positionOf,
  });

  const byId = React.useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const contentW = Math.max(600, ...nodes.map((n) => n.x + widthOf(n) + 80));
  const contentH = Math.max(400, ...nodes.map((n) => n.y + heightOf + 120));

  const pathFor = (from: T, to: T, slot: number) =>
    edgePath({ from, to, slot, positionOf, widthOf, heightOf, getSlotCount, getSlotX });

  return (
    <div
      ref={containerRef}
      onPointerDown={pointerHandlers.onPointerDown}
      onPointerMove={pointerHandlers.onPointerMove}
      onPointerUp={pointerHandlers.onPointerUp}
      onPointerCancel={pointerHandlers.onPointerCancel}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-node],input,button')) return;
        onBackgroundClick?.();
      }}
      className={cn(
        'relative h-full w-full touch-none select-none overflow-hidden bg-white dark:bg-zinc-950',
        gridBackground && 'bg-canvas-grid',
        linking && 'ring-1 ring-inset ring-zinc-500',
      )}
      style={{ ...patternStyle, cursor }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${pan.k})`,
          transformOrigin: '0 0',
          width: contentW,
          height: contentH,
        }}
      >
        <CanvasEdges
          edges={edges}
          byId={byId}
          contentW={contentW}
          contentH={contentH}
          pathFor={pathFor}
          highlightIds={highlightIds}
          highlightEdges={highlightEdges}
          errorIds={errorIds}
          fadeEdges={fadeEdges}
          edgeFadeKey={edgeFadeKey}
          animationDurationMs={animationDurationMs}
          extraSvg={extraSvg}
        />
        {marquee && (
          <div
            className="pointer-events-none absolute rounded-sm border border-dashed border-zinc-500 bg-zinc-500/10 dark:border-zinc-400 dark:bg-zinc-400/10"
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          />
        )}
        {nodes.map((n) => {
          const pos = positionOf(n);
          return (
            <div key={n.id} className="absolute" style={{ left: pos.x, top: pos.y, width: widthOf(n) }}>
              {renderNode({ ...n, x: pos.x, y: pos.y })}
            </div>
          );
        })}
      </div>
      {showRecenter && (
        <Button
          variant="outline"
          size="sm"
          onClick={recenterOnNodes}
          title="Centrar el árbol"
          aria-label="Centrar el árbol"
          className="absolute bottom-[var(--bottom-toolbar-offset,1rem)] left-1/2 z-20 -translate-x-1/2 bg-card/95 shadow-lg backdrop-blur"
        >
          <Focus />
          Centrar el árbol
        </Button>
      )}
      <CanvasZoomIndicator
        percent={Math.round(pan.k * 100)}
        draft={zoomDraft}
        flash={flashZoom}
        cancelBlurRef={cancelBlurRef}
        onDraftChange={setZoomDraft}
        onCommit={commitZoom}
      />
    </div>
  );
}
