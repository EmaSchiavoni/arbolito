// Recorridos de un árbol AVL para animarlos en el playground.

import type { Key } from '../../../common/types';
import type { AvlNode } from './avl';

export type TraversalKind = 'pre' | 'in' | 'post' | 'level';

export const TRAVERSAL_LABELS: Record<TraversalKind, string> = {
  pre: 'Pre-orden',
  in: 'In-orden',
  post: 'Post-orden',
  level: 'Por nivel',
};

export interface TraversalStep {
  nodeId: string;
  key: Key;
}

export function traverseAvl(root: AvlNode | null, kind: TraversalKind): TraversalStep[] {
  const steps: TraversalStep[] = [];

  function visit(node: AvlNode) {
    steps.push({ nodeId: node.id, key: node.key });
  }

  function depthFirst(node: AvlNode | null) {
    if (!node) return;
    if (kind === 'pre') visit(node);
    depthFirst(node.left);
    if (kind === 'in') visit(node);
    depthFirst(node.right);
    if (kind === 'post') visit(node);
  }

  if (kind === 'level') {
    const queue: AvlNode[] = root ? [root] : [];
    for (let i = 0; i < queue.length; i += 1) {
      const node = queue[i];
      visit(node);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  } else {
    depthFirst(root);
  }

  return steps;
}
