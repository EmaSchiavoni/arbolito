// Características derivadas del árbol AVL para mostrarlas como badges.

import { heightOf, type AvlNode } from './avl';

export type HeightBalance = 'perfect' | 'balanced' | 'unbalanced';
export type WeightBalance = 'perfect' | 'balanced' | 'unbalanced';

export interface AvlStats {
  height: number;
  heightBalance: HeightBalance;
  weightBalance: WeightBalance;
  degenerate: boolean;
  complete: boolean;
  degree: number;
}

export function computeAvlStats(root: AvlNode | null): AvlStats {
  let heightBalance: HeightBalance = 'perfect';
  let weightBalance: WeightBalance = 'perfect';
  let degenerate = root !== null;
  let degree = 0;
  let count = 0;
  let maxIndex = -1;

  function walk(node: AvlNode, index: number): { nodes: number; height: number } {
    count += 1;
    if (index > maxIndex) maxIndex = index;

    const children = (node.left ? 1 : 0) + (node.right ? 1 : 0);
    if (children > degree) degree = children;
    if (node.left && node.right) degenerate = false;

    const left = node.left ? walk(node.left, index * 2 + 1) : { nodes: 0, height: 0 };
    const right = node.right ? walk(node.right, index * 2 + 2) : { nodes: 0, height: 0 };

    const heightDiff = Math.abs(heightOf(node.left) - heightOf(node.right));
    if (heightDiff > 0 && heightBalance === 'perfect') heightBalance = 'balanced';
    if (heightDiff > 1) heightBalance = 'unbalanced';

    const weightDiff = Math.abs(left.nodes - right.nodes);
    if (weightDiff > 0 && weightBalance === 'perfect') weightBalance = 'balanced';
    if (weightDiff > 1) weightBalance = 'unbalanced';

    return { nodes: 1 + left.nodes + right.nodes, height: 1 + Math.max(left.height, right.height) };
  }

  if (root) walk(root, 0);

  return {
    height: heightOf(root),
    heightBalance,
    weightBalance,
    degenerate,
    complete: count > 0 && maxIndex === count - 1,
    degree,
  };
}

export function avlStatLabels(stats: AvlStats, empty: boolean): string[] {
  if (empty) return ['Altura 0', 'Grado 0'];

  const heightLabel =
    stats.heightBalance === 'perfect'
      ? 'Perfectamente equilibrado'
      : stats.heightBalance === 'balanced'
        ? 'Equilibrado'
        : 'Desequilibrado';

  const weightLabel =
    stats.weightBalance === 'perfect'
      ? 'Perfectamente balanceado'
      : stats.weightBalance === 'balanced'
        ? 'Balanceado'
        : 'Desbalanceado';

  return [
    `Altura ${stats.height}`,
    heightLabel,
    ...(stats.degenerate ? ['Degenerado'] : []),
    weightLabel,
    ...(stats.complete ? ['Completo'] : []),
    `Grado ${stats.degree}`,
  ];
}
