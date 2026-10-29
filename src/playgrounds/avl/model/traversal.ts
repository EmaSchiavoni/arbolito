// Recorridos de un árbol AVL para animarlos en el playground.
// La secuencia intercala descensos por arcos con la visita (impresión) de
// cada nodo; así el nodo se resalta recién cuando se procesa.

import type { Key } from '../../../common/types';
import type { AvlNode } from './avl';

export type TraversalKind = 'pre' | 'in' | 'post' | 'level';

export const TRAVERSAL_LABELS: Record<TraversalKind, string> = {
  pre: 'Pre-orden',
  in: 'In-orden',
  post: 'Post-orden',
  level: 'Por nivel',
};

export type TraversalEvent =
  | { t: 'enter'; from: string; to: string }
  | { t: 'visit'; nodeId: string; key: Key };

export function traverseAvl(root: AvlNode | null, kind: TraversalKind): TraversalEvent[] {
  if (!root) return [];
  const events: TraversalEvent[] = [];

  function visit(node: AvlNode) {
    events.push({ t: 'visit', nodeId: node.id, key: node.key });
  }

  function enter(from: AvlNode, to: AvlNode) {
    events.push({ t: 'enter', from: from.id, to: to.id });
  }

  function depthFirst(node: AvlNode) {
    if (kind === 'pre') visit(node);
    if (node.left) {
      enter(node, node.left);
      depthFirst(node.left);
    }
    if (kind === 'in') visit(node);
    if (node.right) {
      enter(node, node.right);
      depthFirst(node.right);
    }
    if (kind === 'post') visit(node);
  }

  if (kind === 'level') {
    const queue: { node: AvlNode; from: AvlNode | null }[] = [{ node: root, from: null }];
    for (let i = 0; i < queue.length; i += 1) {
      const { node, from } = queue[i];
      if (from) enter(from, node);
      visit(node);
      if (node.left) queue.push({ node: node.left, from: node });
      if (node.right) queue.push({ node: node.right, from: node });
    }
  } else {
    depthFirst(root);
  }

  return events;
}
