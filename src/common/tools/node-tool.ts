import { Plus } from 'lucide-react';
import type { CanvasTool, ToolPoint } from './types';

// Herramienta compartida por los editores manuales: un click en el fondo crea
// un nodo en esa posición. El playground decide dónde ubicarlo exactamente.
export function createNodeTool({ onPlace }: { onPlace: (point: ToolPoint) => void }): CanvasTool {
  return {
    id: 'node',
    label: 'Nodo',
    icon: Plus,
    cursor: 'crosshair',
    onRelease: (point) => {
      if (point.onNode || point.dragged) return;
      onPlace(point);
    },
  };
}
