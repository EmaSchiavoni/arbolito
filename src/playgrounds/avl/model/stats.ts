// Características derivadas del árbol AVL para mostrarlas como badges.
//
// Dos criterios distintos:
// - Balanceo: compara alturas de los subárboles de cada nodo.
// - Equilibrio: mira cuántos hijos tiene cada nivel respecto de la altura.
// En AVL el máximo de hijos por nodo es k = 2.

import { heightOf, type AvlNode } from './avl';

export type BalanceLevel = 'perfect' | 'balanced' | 'unbalanced';
export type HeightMode = 'nodes' | 'edges';

export interface AvlSettings {
  heightMode: HeightMode;
  completeAlignLeft: boolean;
  fullRequiresSameLeafDepth: boolean;
  rootLevel: 0 | 1;
  equilibriumEqualsBalance: boolean;
}

export const DEFAULT_AVL_SETTINGS: AvlSettings = {
  heightMode: 'nodes',
  completeAlignLeft: false,
  fullRequiresSameLeafDepth: true,
  rootLevel: 0,
  equilibriumEqualsBalance: false,
};

export interface AvlStats {
  height: number;
  // Alturas de los subárboles: perfecto (iguales), balanceado (diferencia ≤ 1).
  balance: BalanceLevel;
  // Niveles completos según la altura del árbol.
  equilibrium: BalanceLevel;
  degenerate: boolean;
  complete: boolean;
  degree: number;
}

const MAX_CHILDREN = 2;

export function displayHeight(node: AvlNode | null, mode: HeightMode): number {
  if (!node) return 0;
  const height = heightOf(node);
  return mode === 'edges' ? Math.max(0, height - 1) : height;
}

export function computeAvlStats(root: AvlNode | null, settings: AvlSettings = DEFAULT_AVL_SETTINGS): AvlStats {
  let balance: BalanceLevel = 'perfect';
  let degenerate = root !== null;
  let full = root !== null;
  let degree = 0;
  let heapCount = 0;
  let maxIndex = -1;

  const levelChildren: { level: number; children: number }[] = [];
  const leafLevels = new Set<number>();
  let maxLevel: number = settings.rootLevel;

  function walk(node: AvlNode, level: number, index: number) {
    const children = (node.left ? 1 : 0) + (node.right ? 1 : 0);
    if (children > degree) degree = children;
    if (node.left && node.right) degenerate = false;
    if (children !== 0 && children !== MAX_CHILDREN) full = false;
    if (children === 0) leafLevels.add(level);
    if (level > maxLevel) maxLevel = level;
    levelChildren.push({ level, children });

    heapCount += 1;
    if (index > maxIndex) maxIndex = index;

    const heightDiff = Math.abs(heightOf(node.left) - heightOf(node.right));
    if (heightDiff > 0 && balance === 'perfect') balance = 'balanced';
    if (heightDiff > 1) balance = 'unbalanced';

    if (node.left) walk(node.left, level + 1, index * 2 + 1);
    if (node.right) walk(node.right, level + 1, index * 2 + 2);
  }

  if (root) walk(root, settings.rootLevel, 0);

  const fullTree = full && (!settings.fullRequiresSameLeafDepth || leafLevels.size <= 1);
  let equilibrium: BalanceLevel;
  if (fullTree) {
    equilibrium = 'perfect';
  } else if (settings.equilibriumEqualsBalance) {
    equilibrium = balance;
  } else {
    const balanced = levelChildren.every(
      ({ level, children }) => level >= maxLevel - 2 || children === MAX_CHILDREN,
    );
    equilibrium = balanced ? 'balanced' : 'unbalanced';
  }

  const heapComplete = heapCount > 0 && maxIndex === heapCount - 1;
  const fullExceptLast = levelChildren.every(
    ({ level, children }) => level >= maxLevel - 1 || children === MAX_CHILDREN,
  );

  return {
    height: displayHeight(root, settings.heightMode),
    balance,
    equilibrium,
    degenerate,
    complete: settings.completeAlignLeft ? heapComplete : fullExceptLast,
    degree,
  };
}

export function avlStatLabels(stats: AvlStats, empty: boolean): string[] {
  if (empty) return ['Grado 0', 'Altura 0'];

  const equilibriumLabel =
    stats.equilibrium === 'perfect'
      ? 'Perfectamente equilibrado (lleno)'
      : stats.equilibrium === 'balanced'
        ? 'Equilibrado'
        : 'Desequilibrado';

  const balanceLabel =
    stats.balance === 'perfect'
      ? 'Perfectamente balanceado'
      : stats.balance === 'balanced'
        ? 'Balanceado'
        : 'Desbalanceado';

  return [
    `Grado ${stats.degree}`,
    `Altura ${stats.height}`,
    equilibriumLabel,
    ...(stats.degenerate ? ['Degenerado'] : []),
    balanceLabel,
    ...(stats.complete ? ['Completo'] : []),
  ];
}
