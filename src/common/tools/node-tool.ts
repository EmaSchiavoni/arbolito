import { Plus } from 'lucide-react';
import type { CanvasTool, ToolPoint } from '@/common/tools/types';

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
