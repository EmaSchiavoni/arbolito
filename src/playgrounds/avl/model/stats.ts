// Características derivadas del árbol AVL para mostrarlas como badges.
//
// Dos criterios distintos:
// - Balanceo: compara alturas de los subárboles de cada nodo.
// - Equilibrio: mira cuántos hijos tiene cada nivel respecto de la altura.
// En AVL el máximo de hijos por nodo es k = 2.

import { heightOf, type AvlNode } from './avl';

export type BalanceLevel = 'perfect' | 'balanced' | 'unbalanced';

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

export function computeAvlStats(root: AvlNode | null): AvlStats {
  const height = heightOf(root);
  const edgeHeight = root ? height - 1 : 0;

  let balance: BalanceLevel = 'perfect';
  let equilibrium: BalanceLevel = 'perfect';
  let degenerate = root !== null;
  let complete = root !== null;
  let degree = 0;

  function walk(node: AvlNode, level: number) {
    const children = (node.left ? 1 : 0) + (node.right ? 1 : 0);
    if (children > degree) degree = children;
    if (node.left && node.right) degenerate = false;
    if (children !== 0 && children !== MAX_CHILDREN) complete = false;

    // Perfectamente equilibrado: todos los niveles salvo el último están llenos.
    if (level < edgeHeight && children !== MAX_CHILDREN && equilibrium !== 'unbalanced') {
      equilibrium = 'balanced';
    }
    // Equilibrado: los niveles hasta h - 2 están llenos.
    if (level < edgeHeight - 2 && children !== MAX_CHILDREN) {
      equilibrium = 'unbalanced';
    }

    const heightDiff = Math.abs(heightOf(node.left) - heightOf(node.right));
    if (heightDiff > 0 && balance === 'perfect') balance = 'balanced';
    if (heightDiff > 1) balance = 'unbalanced';

    if (node.left) walk(node.left, level + 1);
    if (node.right) walk(node.right, level + 1);
  }

  if (root) walk(root, 0);

  return { height, balance, equilibrium, degenerate, complete, degree };
}

export function avlStatLabels(stats: AvlStats, empty: boolean): string[] {
  if (empty) return ['Altura 0', 'Grado 0'];

  const equilibriumLabel =
    stats.equilibrium === 'perfect'
      ? 'Perfectamente equilibrado'
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
    `Altura ${stats.height}`,
    equilibriumLabel,
    ...(stats.degenerate ? ['Degenerado'] : []),
    balanceLabel,
    ...(stats.complete ? ['Completo'] : []),
    `Grado ${stats.degree}`,
  ];
}
