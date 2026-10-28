// Núcleo puro del Árbol AVL. Sin dependencias de React.
// Cada nodo guarda una clave y sus dos subárboles; la altura se recalcula al
// volver de cada operación y el factor de balance queda en {-1, 0, 1}.

import { cmpKey, isValidKey, toKey, type Key, type KeyType } from '../../../common/types';

export interface AvlNode {
  id: string;
  key: Key;
  left: AvlNode | null;
  right: AvlNode | null;
  height: number;
}

export interface AvlTree {
  root: AvlNode | null;
  keyType: KeyType;
}

// Eventos estructurales para el historial.
export type AvlStep =
  | { t: 'insert-leaf'; key: Key; parent: Key | null }
  | { t: 'remove-leaf'; key: Key }
  | { t: 'replace-successor'; key: Key; successor: Key }
  | { t: 'rotate-left'; at: Key; newRoot: Key }
  | { t: 'rotate-right'; at: Key; newRoot: Key };

export function formatStep(s: AvlStep): string {
  switch (s.t) {
    case 'insert-leaf':
      return s.parent === null ? `insertar ${s.key} como raíz` : `insertar ${s.key} como hijo de ${s.parent}`;
    case 'remove-leaf':
      return `quitar ${s.key} de su posición`;
    case 'replace-successor':
      return `reemplazar ${s.key} por sucesor ${s.successor}`;
    case 'rotate-left':
      return `rotación izquierda en ${s.at} (nueva raíz ${s.newRoot})`;
    case 'rotate-right':
      return `rotación derecha en ${s.at} (nueva raíz ${s.newRoot})`;
  }
}

let idCounter = 0;

export function makeNode(key: Key): AvlNode {
  idCounter += 1;
  return { id: `a${Date.now().toString(36)}${idCounter}`, key, left: null, right: null, height: 1 };
}

// Altura en nodos: una hoja mide 1 y un árbol vacío 0.
export function heightOf(node: AvlNode | null): number {
  return node?.height ?? 0;
}

// Factor de balance: altura del subárbol derecho menos la del izquierdo.
export function balanceOf(node: AvlNode | null): number {
  if (!node) return 0;
  return heightOf(node.right) - heightOf(node.left);
}

function updateHeight(node: AvlNode): void {
  node.height = 1 + Math.max(heightOf(node.left), heightOf(node.right));
}

export function cloneTree(root: AvlNode | null): AvlNode | null {
  if (!root) return null;
  return {
    id: root.id,
    key: root.key,
    height: root.height,
    left: cloneTree(root.left),
    right: cloneTree(root.right),
  };
}

export function createTree(keyType: KeyType = 'number'): AvlTree {
  return { root: null, keyType };
}

export function treeHeight(root: AvlNode | null): number {
  return heightOf(root);
}

export function countNodes(root: AvlNode | null): number {
  if (!root) return 0;
  return 1 + countNodes(root.left) + countNodes(root.right);
}

export function countKeys(root: AvlNode | null): number {
  return countNodes(root);
}

export function toTreeKey(tree: AvlTree, key: Key): Key {
  return toKey(tree.keyType, key);
}

export function contains(root: AvlNode | null, key: Key): boolean {
  let cur = root;
  while (cur) {
    const c = cmpKey(key, cur.key);
    if (c === 0) return true;
    cur = c < 0 ? cur.left : cur.right;
  }
  return false;
}

export function searchPath(root: AvlNode | null, key: Key): string[] {
  const path: string[] = [];
  let cur = root;
  while (cur) {
    path.push(cur.id);
    const c = cmpKey(key, cur.key);
    if (c === 0) break;
    cur = c < 0 ? cur.left : cur.right;
  }
  return path;
}

function rotateLeft(node: AvlNode, steps: AvlStep[], touched: Set<string>): AvlNode {
  const pivot = node.right as AvlNode;
  steps.push({ t: 'rotate-left', at: node.key, newRoot: pivot.key });
  node.right = pivot.left;
  pivot.left = node;
  updateHeight(node);
  updateHeight(pivot);
  touched.add(node.id);
  touched.add(pivot.id);
  return pivot;
}

function rotateRight(node: AvlNode, steps: AvlStep[], touched: Set<string>): AvlNode {
  const pivot = node.left as AvlNode;
  steps.push({ t: 'rotate-right', at: node.key, newRoot: pivot.key });
  node.left = pivot.right;
  pivot.right = node;
  updateHeight(node);
  updateHeight(pivot);
  touched.add(node.id);
  touched.add(pivot.id);
  return pivot;
}

function rebalance(node: AvlNode, steps: AvlStep[], touched: Set<string>): AvlNode {
  updateHeight(node);
  const factor = balanceOf(node);
  if (factor > 1) {
    if (balanceOf(node.right) < 0) node.right = rotateRight(node.right as AvlNode, steps, touched);
    return rotateLeft(node, steps, touched);
  }
  if (factor < -1) {
    if (balanceOf(node.left) > 0) node.left = rotateLeft(node.left as AvlNode, steps, touched);
    return rotateRight(node, steps, touched);
  }
  return node;
}

function insertRec(node: AvlNode, key: Key, steps: AvlStep[], touched: Set<string>): AvlNode {
  const c = cmpKey(key, node.key);
  if (c === 0) return node;
  if (c < 0) {
    if (node.left) {
      node.left = insertRec(node.left, key, steps, touched);
    } else {
      node.left = makeNode(key);
      steps.push({ t: 'insert-leaf', key, parent: node.key });
      touched.add(node.left.id);
    }
  } else if (node.right) {
    node.right = insertRec(node.right, key, steps, touched);
  } else {
    node.right = makeNode(key);
    steps.push({ t: 'insert-leaf', key, parent: node.key });
    touched.add(node.right.id);
  }
  touched.add(node.id);
  return rebalance(node, steps, touched);
}

export function insertKey(tree: AvlTree, key: Key): AvlTree {
  return insertKeyLogged(tree, key).tree;
}

export function insertKeyLogged(
  tree: AvlTree,
  key: Key,
): { tree: AvlTree; touched: string[]; steps: AvlStep[] } {
  const keyType = tree.keyType === 'string' ? 'string' : 'number';
  const k = toKey(keyType, key);
  if (!isValidKey(keyType, k)) return { tree, touched: [], steps: [] };
  if (contains(tree.root, k)) return { tree, touched: [], steps: [] };

  const root = cloneTree(tree.root);
  const steps: AvlStep[] = [];
  const touched = new Set<string>();
  if (!root) {
    const created = makeNode(k);
    steps.push({ t: 'insert-leaf', key: k, parent: null });
    touched.add(created.id);
    return { tree: { root: created, keyType }, touched: [...touched], steps };
  }
  const nextRoot = insertRec(root, k, steps, touched);
  return { tree: { root: nextRoot, keyType }, touched: [...touched], steps };
}

function minNode(node: AvlNode): AvlNode {
  let cur = node;
  while (cur.left) cur = cur.left;
  return cur;
}

function removeRec(
  node: AvlNode,
  key: Key,
  steps: AvlStep[],
  touched: Set<string>,
): AvlNode | null {
  const c = cmpKey(key, node.key);
  if (c < 0) {
    if (!node.left) return node;
    node.left = removeRec(node.left, key, steps, touched);
  } else if (c > 0) {
    if (!node.right) return node;
    node.right = removeRec(node.right, key, steps, touched);
  } else {
    if (!node.left) {
      steps.push({ t: 'remove-leaf', key });
      touched.add(node.id);
      return node.right;
    }
    if (!node.right) {
      steps.push({ t: 'remove-leaf', key });
      touched.add(node.id);
      return node.left;
    }
    // Dos hijos: se baja el sucesor (mínimo del subárbol derecho).
    const succ = minNode(node.right);
    steps.push({ t: 'replace-successor', key, successor: succ.key });
    node.key = succ.key;
    node.right = removeRec(node.right, succ.key, steps, touched);
  }
  touched.add(node.id);
  return rebalance(node, steps, touched);
}

export function deleteKey(tree: AvlTree, key: Key): AvlTree {
  return deleteKeyLogged(tree, key).tree;
}

export function deleteKeyLogged(tree: AvlTree, key: Key): { tree: AvlTree; steps: AvlStep[] } {
  const keyType = tree.keyType === 'string' ? 'string' : 'number';
  const target = toKey(keyType, key);
  if (!tree.root || !contains(tree.root, target)) return { tree, steps: [] };

  const root = cloneTree(tree.root);
  const steps: AvlStep[] = [];
  const touched = new Set<string>();
  const nextRoot = removeRec(root as AvlNode, target, steps, touched);
  return { tree: { root: nextRoot, keyType }, steps };
}
