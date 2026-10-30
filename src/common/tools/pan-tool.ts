import { Hand } from 'lucide-react';
import type { CanvasTool } from '@/common/tools/types';

// Herramienta de paneo: representa el estado sin tool activa, así que no
// captura gestos y el canvas se comporta igual que antes (arrastrar el fondo
// mueve la vista). Es fija: no se puede deseleccionar.
export const panTool: CanvasTool = {
  id: 'pan',
  label: 'Paneo',
  icon: Hand,
  cursor: 'grab',
  draggingCursor: 'grabbing',
  pinned: true,
};
