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
  // El gesto arrancó sobre un nodo o un control interactivo.
  onNode: boolean;
  // El puntero superó el umbral de arrastre desde el press.
  dragged: boolean;
  event: ReactPointerEvent<Element>;
}

// Contrato único para las herramientas del canvas. Agregar una tool nueva es
// crear un objeto que lo cumpla y renderizar su ToolButton en la toolbar.
export interface CanvasTool {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  // Valor CSS de cursor mientras la tool está activa (ej. 'crosshair').
  cursor?: string;
  // Tool fija: representa el estado sin herramienta (paneo). No captura
  // gestos y no se puede deseleccionar.
  pinned?: boolean;
  onPress?: (point: ToolPoint) => void;
  onDrag?: (point: ToolPoint) => void;
  onRelease?: (point: ToolPoint) => void;
}
