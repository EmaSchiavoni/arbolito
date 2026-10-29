// Tipos comunes para animar inserciones y eliminaciones del AVL.

import type { Key } from '../../../common/types';
import type { AvlStep, AvlTree } from './avl';

export type RotationCase = 'LL' | 'RR' | 'LR' | 'RL';

export interface RotationLog {
  case: RotationCase;
  direction: 'left' | 'right';
  phase: 1 | 2;
  at: Key;
  newRoot: Key;
  nodes: string[];
  step: Extract<AvlStep, { t: 'rotate-left' | 'rotate-right' }>;
}

export interface AnimationFrame {
  tree: AvlTree;
  nodes: string[];
  edges: string[];
  message?: string;
  fadeEdges?: boolean;
}

export interface AnimationHistoryEntry {
  text: string;
  steps: string[];
}

export interface TreeAnimation {
  frames: AnimationFrame[];
  finalTree: AvlTree;
  finalMessage: string;
  history: AnimationHistoryEntry[];
  touched: string[];
  lastKey: Key | null;
}

export function rotationMessage(rotation: RotationLog): string {
  if (rotation.case === 'LL') return `Rotación simple a la derecha (LL) en ${rotation.at}`;
  if (rotation.case === 'RR') return `Rotación simple a la izquierda (RR) en ${rotation.at}`;
  const direction = rotation.direction === 'left' ? 'izquierda' : 'derecha';
  return `Rotación ${direction} (${rotation.case} ${rotation.phase}/2) en ${rotation.at}`;
}
