import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react';

// Punto de interacción de una herramienta de canvas. `x`/`y` ya vienen en
// coordenadas del mundo (paneo y zoom descontados), así que una tool no
// necesita conocer la transformación del canvas.
export interface ToolPoint {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  // Queda por compatibilidad: hoy un gesto que empieza sobre [data-node] no llega a la tool.
  onNode: boolean;
  // El puntero superó el umbral de arrastre desde el press.
  dragged: boolean;
  event: ReactPointerEvent<Element>;
}

export interface CanvasTool {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  cursor?: string;
  // Cursor mientras se arrastra con la tool. Solo lo usan las tools fijas
  // (paneo), que muestran su cursor sin capturar los gestos del fondo.
  draggingCursor?: string;
  // Tool fija: representa el estado sin herramienta (paneo). No captura
  // gestos y no se puede deseleccionar.
  pinned?: boolean;
  onPress?: (point: ToolPoint) => void;
  onDrag?: (point: ToolPoint) => void;
  onRelease?: (point: ToolPoint) => void;
}
