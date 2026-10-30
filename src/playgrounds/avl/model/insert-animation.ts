// Inserción de AVL separada en fases para poder animarla:
// 1. descenso por el árbol como BST (sin balancear),
// 2. inserción de la hoja,
// 3. una rotación por vez (las dobles se parten en dos) con su snapshot.
// No depende de React.

import { cmpKey, isValidKey, toKey, type Key, type KeyType } from '@/common/types';
import {
  balanceOf,
  formatStep,
  cloneTree,
  contains,
  heightOf,
  makeNode,
  type AvlNode,
  type AvlStep,
  type AvlTree,
} from '@/playgrounds/avl/model/avl';
import type { AnimationFrame, RotationLog, TreeAnimation } from '@/playgrounds/avl/model/animation';
import { rotationMessage } from '@/playgrounds/avl/model/animation';


export interface InsertAnimation {
  inserted: boolean;
  tree: AvlTree;
  keyType: KeyType;
  path: { nodes: string[]; edges: string[] };
  insertedNodeId: string | null;
  insertStep: Extract<AvlStep, { t: 'insert-leaf' }> | null;
  states: AvlTree[];
  rotations: RotationLog[];
  steps: AvlStep[];
  touched: string[];
}

function updateHeight(node: AvlNode): void {
  node.height = 1 + Math.max(heightOf(node.left), heightOf(node.right));
}

function rotateLeft(node: AvlNode): AvlNode {
  const pivot = node.right as AvlNode;
  node.right = pivot.left;
  pivot.left = node;
  updateHeight(node);
  updateHeight(pivot);
  return pivot;
}

function rotateRight(node: AvlNode): AvlNode {
  const pivot = node.left as AvlNode;
  node.left = pivot.right;
  pivot.right = node;
  updateHeight(node);
  updateHeight(pivot);
  return pivot;
}

function emptyAnimation(tree: AvlTree): InsertAnimation {
  return {
    inserted: false,
    tree,
    keyType: tree.keyType,
    path: { nodes: [], edges: [] },
    insertedNodeId: null,
    insertStep: null,
    states: [],
    rotations: [],
    steps: [],
    touched: [],
  };
}

export function insertKeyAnimated(tree: AvlTree, key: Key): InsertAnimation {
  const keyType: KeyType = tree.keyType === 'string' ? 'string' : 'number';
  const k = toKey(keyType, key);
  if (!isValidKey(keyType, k) || contains(tree.root, k)) return emptyAnimation(tree);

  const steps: AvlStep[] = [];
  const touched = new Set<string>();
  const states: AvlTree[] = [];
  const rotations: RotationLog[] = [];

  if (!tree.root) {
    const created = makeNode(k);
    const step: AvlStep = { t: 'insert-leaf', key: k, parent: null };
    steps.push(step);
    touched.add(created.id);
    const state = { root: cloneTree(created), keyType };
    states.push(state);
    return {
      inserted: true,
      tree: { root: created, keyType },
      keyType,
      path: { nodes: [], edges: [] },
      insertedNodeId: created.id,
      insertStep: step,
      states,
      rotations,
      steps,
      touched: [...touched],
    };
  }

  let currentRoot = cloneTree(tree.root) as AvlNode;
  const pathNodes: AvlNode[] = [];
  const pathEdges: string[] = [];
  let insertedNode: AvlNode | null = null;
  let parent: AvlNode | null = null;

  let cur: AvlNode = currentRoot;
  while (true) {
    pathNodes.push(cur);
    const c = cmpKey(k, cur.key);
    const next = c < 0 ? cur.left : cur.right;
    if (next) {
      pathEdges.push(`${cur.id}:${next.id}`);
      cur = next;
      continue;
    }
    insertedNode = makeNode(k);
    if (c < 0) cur.left = insertedNode;
    else cur.right = insertedNode;
    parent = cur;
    break;
  }

  const insertStep: AvlStep = { t: 'insert-leaf', key: k, parent: parent.key };
  steps.push(insertStep);
  touched.add(insertedNode.id);
  for (const node of pathNodes) touched.add(node.id);

  for (let i = pathNodes.length - 1; i >= 0; i -= 1) updateHeight(pathNodes[i]);
  states.push({ root: cloneTree(currentRoot), keyType });

  const ancestors = pathNodes;
  function attach(index: number, oldTop: AvlNode, newTop: AvlNode) {
    if (index === 0) {
      currentRoot = newTop;
      return;
    }
    const up = ancestors[index - 1];
    if (up.left === oldTop) up.left = newTop;
    else if (up.right === oldTop) up.right = newTop;
  }

  function snapshot() {
    states.push({ root: cloneTree(currentRoot), keyType });
  }

  function recordRotation(
    rotationCase: RotationLog['case'],
    direction: 'left' | 'right',
    phase: 1 | 2,
    rotated: AvlNode,
    newTop: AvlNode,
  ) {
    const step: RotationLog['step'] =
      direction === 'left'
        ? { t: 'rotate-left', at: rotated.key, newRoot: newTop.key }
        : { t: 'rotate-right', at: rotated.key, newRoot: newTop.key };
    steps.push(step);
    touched.add(rotated.id);
    touched.add(newTop.id);
    rotations.push({
      case: rotationCase,
      direction,
      phase,
      at: rotated.key,
      newRoot: newTop.key,
      nodes: [rotated.id, newTop.id],
      step,
    });
  }

  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const node = ancestors[i];
    updateHeight(node);
    const factor = balanceOf(node);

    if (factor > 1) {
      const right = node.right as AvlNode;
      if (balanceOf(right) < 0) {
        // RL: primero rotación derecha sobre el hijo, luego izquierda sobre el nodo.
        const newChild = rotateRight(right);
        node.right = newChild;
        recordRotation('RL', 'right', 1, right, newChild);
        snapshot();

        const newTop = rotateLeft(node);
        attach(i, node, newTop);
        recordRotation('RL', 'left', 2, node, newTop);
        snapshot();
      } else {
        // RR.
        const newTop = rotateLeft(node);
        attach(i, node, newTop);
        recordRotation('RR', 'left', 1, node, newTop);
        snapshot();
      }
    } else if (factor < -1) {
      const left = node.left as AvlNode;
      if (balanceOf(left) > 0) {
        // LR: primero rotación izquierda sobre el hijo, luego derecha sobre el nodo.
        const newChild = rotateLeft(left);
        node.left = newChild;
        recordRotation('LR', 'left', 1, left, newChild);
        snapshot();

        const newTop = rotateRight(node);
        attach(i, node, newTop);
        recordRotation('LR', 'right', 2, node, newTop);
        snapshot();
      } else {
        // LL.
        const newTop = rotateRight(node);
        attach(i, node, newTop);
        recordRotation('LL', 'right', 1, node, newTop);
        snapshot();
      }
    }
  }

  return {
    inserted: true,
    tree: { root: currentRoot, keyType },
    keyType,
    path: {
      nodes: pathNodes.map((node) => node.id),
      edges: pathEdges,
    },
    insertedNodeId: insertedNode.id,
    insertStep,
    states,
    rotations,
    steps,
    touched: [...touched],
  };
}

export function buildInsertAnimation(anim: InsertAnimation, from: AvlTree): TreeAnimation | null {
  if (!anim.inserted || !anim.insertStep) return null;
  const key = anim.insertStep.key;
  const frames: AnimationFrame[] = [];

  for (let i = 0; i < anim.path.nodes.length; i += 1) {
    frames.push({
      tree: from,
      nodes: anim.path.nodes.slice(0, i + 1),
      edges: anim.path.edges.slice(0, i),
      message: `Insertando ${key}...`,
    });
  }

  const parentId = anim.path.nodes[anim.path.nodes.length - 1];
  const newEdge = parentId && anim.insertedNodeId ? `${parentId}:${anim.insertedNodeId}` : null;
  frames.push({
    tree: anim.states[0],
    nodes: anim.insertedNodeId ? [anim.insertedNodeId] : [],
    edges: newEdge ? [newEdge] : [],
    message: `Insertar ${key}`,
  });

  const history = [
    { text: `insertar ${key} → ok`, steps: [formatStep(anim.insertStep)] },
    ...anim.rotations.map((rotation) => ({
      text: rotationMessage(rotation),
      steps: [formatStep(rotation.step)],
    })),
  ];

  for (let i = 0; i < anim.rotations.length; i += 1) {
    const rotation = anim.rotations[i];
    frames.push({
      tree: anim.states[i + 1],
      nodes: rotation.nodes,
      edges: [],
      message: rotationMessage(rotation),
      fadeEdges: true,
    });
  }

  return {
    frames,
    finalTree: anim.tree,
    finalMessage: `Clave ${key} insertada.`,
    history,
    touched: anim.touched,
    lastKey: key,
  };
}
