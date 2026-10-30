import type { ReactNode } from 'react';
import type { CanvasTool } from '@/common/tools/types';

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

export interface CanvasView {
  x: number;
  y: number;
  k: number;
}

export interface TreeCanvasProps<T extends CanvasNode> {
  nodes: T[];
  edges: CanvasEdge[];
  renderNode: (node: T) => ReactNode;
  highlightIds?: Set<string>;
  // Aristas resaltadas explícitamente ("from:to"). Si no se pasan, se usa el
  // criterio de camino: ambos extremos en highlightIds.
  highlightEdges?: Set<string>;
  errorIds?: Set<string>;
  linking?: boolean;
  onBackgroundClick?: () => void;
  extraSvg?: ReactNode;
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
  initialView?: CanvasView | null;
  // Notifica cada cambio de vista (paneo/zoom) al padre.
  onViewChange?: (view: CanvasView & { w: number; h: number }) => void;
  // Herramienta activa: captura los gestos del fondo y define el cursor.
  tool?: CanvasTool | null;
  // Recuadro de selección en coordenadas del mundo (paneo/zoom ya aplicados).
  marquee?: { x: number; y: number; w: number; h: number } | null;
}
