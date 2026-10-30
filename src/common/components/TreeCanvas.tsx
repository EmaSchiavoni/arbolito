import * as React from 'react';
import { Focus } from 'lucide-react';
import { cn } from '@/common/lib/utils';
import { Button } from '@/common/components/ui/button';
import type { CanvasTool, ToolPoint } from '@/common/tools/types';

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
}

export interface CanvasEdge {
  from: string;
  to: string;
  slot: number;
}

const DEFAULT_NODE_WIDTH = 120;
const NODE_HEIGHT = 64;

interface Props<T extends CanvasNode> {
  nodes: T[];
  edges: CanvasEdge[];
  renderNode: (n: T) => React.ReactNode;
  highlightIds?: Set<string>;
  // Aristas resaltadas explícitamente ("from:to"). Si no se pasan, se usa el
  // criterio de camino: ambos extremos en highlightIds.
  highlightEdges?: Set<string>;
  errorIds?: Set<string>;
  linking?: boolean;
  onBackgroundClick?: () => void;
  extraSvg?: React.ReactNode;
  // Geometría opcional: ancho del nodo y coordenada x absoluta del ancla de
  // cada slot de salida (inicio de la flecha).
  getNodeWidth?: (node: T) => number;
  getSlotCount?: (node: T) => number;
  getSlotX?: (node: T, slot: number) => number;
  // Alto del nodo (de dónde sale la flecha). Por defecto NODE_HEIGHT.
  nodeHeight?: number;
  // Anima el movimiento de los nodos al cambiar el layout (rotaciones).
  animateNodes?: boolean;
  animationDurationMs?: number;
  gridBackground?: boolean;
  // Hace un fade-in de los arcos cuando cambia `edgeFadeKey`. Se usa en las
  // rotaciones para disimular el salto de las flechas SVG.
  fadeEdges?: boolean;
  edgeFadeKey?: string | number;
  // Punto virtual a centrar en el contenedor al montar (una sola vez).
  // Se ignora si hay vista guardada: la restauración tiene prioridad.
  initialCenter?: { x: number; y: number } | null;
  // Vista guardada a restaurar al montar (tiene prioridad sobre el centro).
  initialView?: { x: number; y: number; k: number } | null;
  // Notifica cada cambio de vista (paneo/zoom) al padre.
  onViewChange?: (view: { x: number; y: number; k: number; w: number; h: number }) => void;
  // Herramienta activa: captura los gestos del fondo y define el cursor.
  tool?: CanvasTool | null;
  // Recuadro de selección en coordenadas del mundo (paneo/zoom ya aplicados).
  marquee?: { x: number; y: number; w: number; h: number } | null;
}

export function TreeCanvas<T extends CanvasNode>({ nodes, edges, renderNode, highlightIds, highlightEdges, errorIds, linking, onBackgroundClick, extraSvg, getNodeWidth, getSlotCount, getSlotX, nodeHeight, animateNodes, animationDurationMs = 300, gridBackground, fadeEdges, edgeFadeKey, initialCenter, initialView, onViewChange, tool, marquee }: Props<T>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pan, setPan] = React.useState(() => initialView ?? { x: 16, y: 16, k: 1 });
  const panRef = React.useRef(pan);
  // Arrastre de fondo en curso: solo cambia el cursor (grab → grabbing).
  const [panning, setPanning] = React.useState(false);
  // El paneo dejó todos los nodos fuera de pantalla: se ofrece recuperarlos.
  const [showRecenter, setShowRecenter] = React.useState(false);
  // El chequeo se guarda en un ref para invocarlo desde listeners nativos
  // registrados una sola vez (rueda, teclado, resize).
  const checkRecenterRef = React.useRef<() => void>(() => {});
  const wheelTimer = React.useRef<number | null>(null);
  const drag = React.useRef<{ sx: number; sy: number; px: number; py: number; active: boolean }>({ sx: 0, sy: 0, px: 0, py: 0, active: false });
  const pointers = React.useRef(new Map<number, { x: number; y: number; node: boolean }>());
  const pinchStart = React.useRef<{ d: number } | null>(null);
  const toolGesture = React.useRef<{ pointerId: number; startX: number; startY: number; onNode: boolean; dragged: boolean } | null>(null);

  const TOOL_DRAG_THRESHOLD = 4;

  const MIN_K = 0.25;
  const MAX_K = 3;
  const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

  function applyPan(next: { x: number; y: number; k: number }) {
    panRef.current = next;
    setPan(next);
  }

  // Avisa al padre de cada cambio de vista (el callback guarda en ref,
  // no dispara renders, así que no hay riesgo de bucle). Incluye el tamaño
  // del contenedor para que el padre ubique nodos nuevos en el viewport.
  const lastNotified = React.useRef<{ x: number; y: number; k: number } | null>(null);
  const sizeRef = React.useRef({ w: 0, h: 0 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target: HTMLDivElement = el;
    function measure() {
      const r = target.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
      // El tamaño cambió (resize, rotación del dispositivo): puede haber
      // nodos visibles u ocultos distintos.
      checkRecenterRef.current();
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    if (lastNotified.current === pan) return;
    lastNotified.current = pan;
    const s = sizeRef.current;
    onViewChange?.({ ...pan, w: s.w, h: s.h });
  });

  // Centrado inicial del punto virtual dado (una sola vez al montar).
  // Si hay vista guardada se restaura esa en su lugar.
  const didCenter = React.useRef(false);
  React.useEffect(() => {
    if (didCenter.current || !initialCenter || initialView) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    didCenter.current = true;
    applyPan({ x: r.width / 2 - initialCenter.x, y: r.height / 2 - initialCenter.y, k: 1 });
    checkRecenterRef.current();
  }, [initialCenter, initialView]);

  // Zoom que mantiene fijo el punto (sx, sy) relativo al contenedor.
  function zoomAt(sx: number, sy: number, factor: number) {
    const cur = panRef.current;
    const k2 = clampK(cur.k * factor);
    if (k2 === cur.k) return;
    const r = k2 / cur.k;
    applyPan({ k: k2, x: sx - (sx - cur.x) * r, y: sy - (sy - cur.y) * r });
  }

  // Borrador del input de zoom: null = mostrar el valor real.
  const [zoomDraft, setZoomDraft] = React.useState<string | null>(null);
  const cancelBlur = React.useRef(false);

  // Indicador transitorio (mobile): se muestra 6 s desde el último cambio
  // de zoom, con debounce (cada cambio reinicia el conteo). En mobile el
  // indicador fijo queda detrás de la toolbar, así que se muestra debajo
  // de los botones flotantes superiores.
  const [flashZoom, setFlashZoom] = React.useState(false);
  const flashTimer = React.useRef<number | null>(null);
  const prevK = React.useRef(pan.k);
  React.useEffect(() => {
    if (pan.k === prevK.current) return;
    prevK.current = pan.k;
    setFlashZoom(true);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashZoom(false), 6000);
  }, [pan.k]);
  React.useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  // Aplica el % escrito (centrado). Ante valor inválido o fuera de rango
  // (25-300) se vuelve al valor anterior.
  function commitZoom(raw: string) {
    if (cancelBlur.current) {
      cancelBlur.current = false;
      setZoomDraft(null);
      return;
    }
    const num = Number(raw.replace('%', '').trim());
    if (raw.trim() === '' || !Number.isFinite(num)) {
      setZoomDraft(null);
      return;
    }
    const target = Math.round(num);
    if (target < MIN_K * 100 || target > MAX_K * 100) {
      setZoomDraft(null);
      return;
    }
    const r = ref.current?.getBoundingClientRect();
    zoomAt(r ? r.width / 2 : 200, r ? r.height / 2 : 200, target / 100 / panRef.current.k);
    checkRecenterRef.current();
    setZoomDraft(null);
  }

  function local(e: React.PointerEvent | { clientX: number; clientY: number }) {
    const r = ref.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  }

  // Coordenadas para una tool: pantalla relativa al canvas y mundo con el
  // paneo/zoom actuales ya descontados.
  function toolPoint(e: React.PointerEvent, onNode: boolean, dragged: boolean): ToolPoint {
    const p = local(e);
    const view = panRef.current;
    return {
      x: (p.x - view.x) / view.k,
      y: (p.y - view.y) / view.k,
      screenX: p.x,
      screenY: p.y,
      clientX: e.clientX,
      clientY: e.clientY,
      onNode,
      dragged,
      event: e,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = local(e);
    const inert = !!(e.target as HTMLElement).closest('[data-node],input,button');
    pointers.current.set(e.pointerId, { ...p, node: inert });
    if (pointers.current.size === 2) {
      // Pinch solo si ambos dedos están sobre el fondo (no sobre un nodo).
      const pts = [...pointers.current.values()];
      if (!pts.some((q) => q.node)) {
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStart.current = { d };
        drag.current.active = false;
        setPanning(false);
      }
      // Un segundo dedo inicia pinch: se cancela el gesto de la herramienta.
      toolGesture.current = null;
    }
    if (inert) return;
    document.getSelection()?.removeAllRanges();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // noop
    }
    // La tool fija (paneo) no captura gestos: el fondo se arrastra normalmente.
    if (tool && !tool.pinned) {
      // La herramienta captura el fondo: no se panea mientras haya una activa.
      toolGesture.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, onNode: inert, dragged: false };
      tool.onPress?.(toolPoint(e, inert, false));
      drag.current = { sx: 0, sy: 0, px: 0, py: 0, active: false };
      return;
    }
    const cur = panRef.current;
    drag.current = { sx: e.clientX, sy: e.clientY, px: cur.x, py: cur.y, active: pinchStart.current === null };
    if (drag.current.active) setPanning(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    const m = pointers.current.get(e.pointerId);
    if (m) {
      const p = local(e);
      m.x = p.x;
      m.y = p.y;
    }
    const pts = [...pointers.current.values()];
    if (pinchStart.current && pointers.current.size === 2 && !pts.some((q) => q.node)) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const prev = pinchStart.current.d;
      if (d > 0 && prev > 0) {
        const mx = (pts[0].x + pts[1].x) / 2;
        const my = (pts[0].y + pts[1].y) / 2;
        zoomAt(mx, my, d / prev);
      }
      pinchStart.current = { d };
      return;
    }
    const gesture = toolGesture.current;
    if (gesture && gesture.pointerId === e.pointerId) {
      if (!gesture.dragged && Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) >= TOOL_DRAG_THRESHOLD) {
        gesture.dragged = true;
      }
      if (gesture.dragged) tool?.onDrag?.(toolPoint(e, gesture.onNode, true));
      return;
    }
    if (!drag.current.active) return;
    applyPan({ ...panRef.current, x: drag.current.px + (e.clientX - drag.current.sx), y: drag.current.py + (e.clientY - drag.current.sy) });
  }
  function endPointer(e: React.PointerEvent) {
    const gesture = toolGesture.current;
    if (gesture && gesture.pointerId === e.pointerId) {
      toolGesture.current = null;
      tool?.onRelease?.(toolPoint(e, gesture.onNode, gesture.dragged));
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      drag.current.active = false;
      setPanning(false);
      // Se evalúa acá y no en cada move: el arrastre ya terminó.
      checkRecenterRef.current();
    }
  }
  function cancelPointer(e: React.PointerEvent) {
    if (toolGesture.current?.pointerId === e.pointerId) toolGesture.current = null;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      drag.current.active = false;
      setPanning(false);
      checkRecenterRef.current();
    }
  }

  // Rueda: sin Ctrl mueve el canvas; con Ctrl (o Cmd) hace zoom sobre el cursor.
  // Listener no-pasivo para poder frenar el zoom de página del navegador.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target: HTMLDivElement = el;
    // La rueda no tiene "release": se evalúa al terminar el gesto.
    function scheduleCheck() {
      if (wheelTimer.current !== null) window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => {
        wheelTimer.current = null;
        checkRecenterRef.current();
      }, 150);
    }
    function onWheelNative(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) {
        const cur = panRef.current;
        const next = { ...cur, x: cur.x - e.deltaX * 0.5, y: cur.y - e.deltaY * 0.5 };
        panRef.current = next;
        setPan(next);
        scheduleCheck();
        return;
      }
      e.preventDefault();
      const r = target.getBoundingClientRect();
      const cur = panRef.current;
      const k2 = Math.min(MAX_K, Math.max(MIN_K, cur.k * Math.exp(-e.deltaY * 0.002)));
      if (k2 === cur.k) return;
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      const ratio = k2 / cur.k;
      const next = { k: k2, x: sx - (sx - cur.x) * ratio, y: sy - (sy - cur.y) * ratio };
      panRef.current = next;
      setPan(next);
      scheduleCheck();
    }
    target.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      target.removeEventListener('wheel', onWheelNative);
      if (wheelTimer.current !== null) {
        window.clearTimeout(wheelTimer.current);
        wheelTimer.current = null;
      }
    };
  }, []);

  // Teclado: Ctrl/Cmd + (+/-) zoom centrado, Ctrl/Cmd + 0 restablece.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key !== '+' && e.key !== '=' && e.key !== '-' && e.key !== '0') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      const r = ref.current?.getBoundingClientRect();
      zoomAt(r ? r.width / 2 : 200, r ? r.height / 2 : 200, e.key === '-' ? 1 / 1.25 : e.key === '0' ? 1 / panRef.current.k : 1.25);
      checkRecenterRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const positionsRef = React.useRef(new Map<string, { x: number; y: number }>());
  const rafRef = React.useRef<number | null>(null);
  const lastTargetKey = React.useRef('');
  const [animatedPositions, setAnimatedPositions] = React.useState<Map<string, { x: number; y: number }> | null>(null);
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
      const next = new Map<string, { x: number; y: number }>();
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

  const positionOf = (n: T) => (animateNodes ? animatedPositions?.get(n.id) : undefined) ?? { x: n.x, y: n.y };

  const byId = React.useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const widthOf = getNodeWidth ?? (() => DEFAULT_NODE_WIDTH);
  const heightOf = nodeHeight ?? NODE_HEIGHT;
  const contentW = Math.max(600, ...nodes.map((n) => n.x + widthOf(n) + 80));
  const contentH = Math.max(400, ...nodes.map((n) => n.y + heightOf + 120));

  // ¿Quedó algún nodo a la vista? Se evalúa en el momento (no en cada render)
  // para no recorrer el árbol durante el arrastre ni hacer parpadear el botón.
  function checkRecenter() {
    const { w, h } = sizeRef.current;
    if (nodes.length === 0 || w === 0 || h === 0) {
      setShowRecenter(false);
      return;
    }
    const view = panRef.current;
    const anyVisible = nodes.some((n) => {
      const pos = positionOf(n);
      const nw = widthOf(n) * view.k;
      const nh = heightOf * view.k;
      const x = pos.x * view.k + view.x;
      const y = pos.y * view.k + view.y;
      return x + nw > 0 && x < w && y + nh > 0 && y < h;
    });
    setShowRecenter(!anyVisible);
  }

  React.useLayoutEffect(() => {
    checkRecenterRef.current = checkRecenter;
  });

  // Cambió el árbol (inserción, borrado, layout): puede haber quedado fuera.
  React.useEffect(() => {
    checkRecenterRef.current();
  }, [nodes]);

  // Centra el bounding box de los nodos en el área libre (por encima de la
  // toolbar) y baja el zoom solo si no entra completo.
  function recenterOnNodes() {
    if (nodes.length === 0) return;
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    const toolbar = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--bottom-toolbar-offset'),
    ) || 0;
    const freeH = Math.max(1, h - toolbar);
    const margin = 24;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const pos = positionOf(n);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + widthOf(n));
      maxY = Math.max(maxY, pos.y + heightOf);
    }
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const k = clampK(
      Math.min(panRef.current.k, (w - margin * 2) / bw, (freeH - margin * 2) / bh),
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    applyPan({ k, x: w / 2 - cx * k, y: freeH / 2 - cy * k });
    checkRecenterRef.current();
  }

  function edgePath(from: T, to: T, slot: number): string {
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

  const patternStyle = gridBackground
    ? {
        backgroundSize: `${18 * pan.k}px ${18 * pan.k}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }
    : undefined;

  // Las tools fijas (paneo) muestran grab y, mientras se arrastra, grabbing.
  const cursor = tool?.cursor ? (panning && tool.draggingCursor ? tool.draggingCursor : tool.cursor) : undefined;

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={cancelPointer}
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
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${pan.k})`, transformOrigin: '0 0', width: contentW, height: contentH }}
      >
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
                  d={edgePath(f, t, e.slot)}
                  fill="none"
                  strokeWidth={hot ? 2.5 : 1.5}
                  className={bad ? 'stroke-red-500 dark:stroke-red-400' : hot ? 'stroke-zinc-900 dark:stroke-zinc-100' : 'stroke-zinc-400 dark:stroke-zinc-500'}
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
      <span
        title="Zoom actual en % (Enter para aplicar, Esc para cancelar)"
        className="absolute bottom-2 right-2 z-10 hidden items-center gap-0.5 rounded-full border bg-card/95 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur sm:flex"
      >
        <input
          value={zoomDraft ?? String(Math.round(pan.k * 100))}
          onChange={(e) => setZoomDraft(e.target.value)}
          onBlur={(e) => commitZoom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              cancelBlur.current = true;
              (e.target as HTMLInputElement).blur();
            }
          }}
          inputMode="numeric"
          aria-label="Nivel de zoom en porcentaje"
          className="w-9 select-text bg-transparent text-center tabular-nums focus:outline-none"
        />
        <span>%</span>
      </span>
      {flashZoom && (
        <div className="fixed right-3 top-[60px] z-40 rounded-full border bg-card/95 px-2.5 py-1 text-xs tabular-nums text-muted-foreground shadow-lg backdrop-blur sm:hidden">
          {Math.round(pan.k * 100)} %
        </div>
      )}
    </div>
  );
}