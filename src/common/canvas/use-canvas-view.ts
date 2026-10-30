import * as React from 'react';
import type { CanvasTool, ToolPoint } from '@/common/tools/types';
import type { CanvasNode, CanvasView } from './types';

interface UseCanvasViewArgs<T extends CanvasNode> {
  nodes: T[];
  gridBackground?: boolean;
  initialCenter?: { x: number; y: number } | null;
  initialView?: CanvasView | null;
  onViewChange?: (view: CanvasView & { w: number; h: number }) => void;
  tool?: CanvasTool | null;
  widthOf: (node: T) => number;
  heightOf: number;
  positionOf: (node: T) => { x: number; y: number };
}

const TOOL_DRAG_THRESHOLD = 4;
const MIN_K = 0.25;
const MAX_K = 3;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

// Paneo, zoom, pinch, rueda, teclado y recentrado del canvas.
export function useCanvasView<T extends CanvasNode>({
  nodes,
  gridBackground,
  initialCenter,
  initialView,
  onViewChange,
  tool,
  widthOf,
  heightOf,
  positionOf,
}: UseCanvasViewArgs<T>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pan, setPan] = React.useState<CanvasView>(() => initialView ?? { x: 16, y: 16, k: 1 });
  const panRef = React.useRef(pan);
  // Arrastre de fondo en curso: solo cambia el cursor (grab → grabbing).
  const [panning, setPanning] = React.useState(false);
  // El paneo dejó todos los nodos fuera de pantalla: se ofrece recuperarlos.
  const [showRecenter, setShowRecenter] = React.useState(false);
  // El chequeo se guarda en un ref para invocarlo desde listeners nativos
  // registrados una sola vez (rueda, teclado, resize).
  const checkRecenterRef = React.useRef<() => void>(() => {});
  const wheelTimer = React.useRef<number | null>(null);
  const drag = React.useRef({ sx: 0, sy: 0, px: 0, py: 0, active: false });
  const pointers = React.useRef(new Map<number, { x: number; y: number; node: boolean }>());
  const pinchStart = React.useRef<{ d: number } | null>(null);
  const toolGesture = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    onNode: boolean;
    dragged: boolean;
  } | null>(null);

  function applyPan(next: CanvasView) {
    panRef.current = next;
    setPan(next);
  }

  // Avisa al padre de cada cambio de vista (el callback guarda en ref,
  // no dispara renders, así que no hay riesgo de bucle). Incluye el tamaño
  // del contenedor para que el padre ubique nodos nuevos en el viewport.
  const lastNotified = React.useRef<CanvasView | null>(null);
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
    applyPan({
      ...panRef.current,
      x: drag.current.px + (e.clientX - drag.current.sx),
      y: drag.current.py + (e.clientY - drag.current.sy),
    });
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
      zoomAt(
        r ? r.width / 2 : 200,
        r ? r.height / 2 : 200,
        e.key === '-' ? 1 / 1.25 : e.key === '0' ? 1 / panRef.current.k : 1.25,
      );
      checkRecenterRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    const toolbar =
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bottom-toolbar-offset')) || 0;
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
    const k = clampK(Math.min(panRef.current.k, (w - margin * 2) / bw, (freeH - margin * 2) / bh));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    applyPan({ k, x: w / 2 - cx * k, y: freeH / 2 - cy * k });
    checkRecenterRef.current();
  }

  const patternStyle = gridBackground
    ? {
        backgroundSize: `${18 * pan.k}px ${18 * pan.k}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }
    : undefined;

  // Las tools fijas (paneo) muestran grab y, mientras se arrastra, grabbing.
  const cursor = tool?.cursor ? (panning && tool.draggingCursor ? tool.draggingCursor : tool.cursor) : undefined;

  return {
    containerRef: ref,
    pan,
    panning,
    showRecenter,
    recenterOnNodes,
    zoomDraft,
    setZoomDraft,
    commitZoom,
    cancelBlurRef: cancelBlur,
    flashZoom,
    patternStyle,
    cursor,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: cancelPointer,
    },
  };
}
