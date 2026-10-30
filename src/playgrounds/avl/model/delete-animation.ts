// Eliminación de AVL separada en fases para animarla:
// búsqueda, reemplazo por sucesor si hace falta, extracción estructural y
// rebalanceo con una rotación por vez. No depende de React.

import { cmpKey, isValidKey, toKey, type Key, type KeyType } from '@/common/types';
import {
  balanceOf,
  cloneTree,
  contains,
  formatStep,
  heightOf,
  type AvlNode,
  type AvlStep,
  type AvlTree,
} from '@/playgrounds/avl/model/avl';
import { rotationMessage, type AnimationFrame, type RotationLog, type TreeAnimation } from '@/playgrounds/avl/model/animation';

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

interface PathResult {
  nodes: AvlNode[];
  edges: string[];
  found: boolean;
}

function findPath(root: AvlNode | null, key: Key): PathResult {
  const nodes: AvlNode[] = [];
  const edges: string[] = [];
  let cur = root;
  while (cur) {
    nodes.push(cur);
    const c = cmpKey(key, cur.key);
    if (c === 0) return { nodes, edges, found: true };
    const next = c < 0 ? cur.left : cur.right;
    if (next) edges.push(`${cur.id}:${next.id}`);
    cur = next;
  }
  return { nodes, edges, found: false };
}

export function buildDeleteAnimation(tree: AvlTree, key: Key): TreeAnimation {
  const keyType: KeyType = tree.keyType === 'string' ? 'string' : 'number';
  const k = toKey(keyType, key);
  const frames: AnimationFrame[] = [];
  const history: TreeAnimation['history'] = [];
  const touched = new Set<string>();

  if (!isValidKey(keyType, k) || !tree.root || !contains(tree.root, k)) {
    if (tree.root) {
      const path = findPath(tree.root, k);
      for (let i = 0; i < path.nodes.length; i += 1) {
        frames.push({
          tree: { root: cloneTree(tree.root), keyType },
          nodes: path.nodes.slice(0, i + 1).map((node) => node.id),
          edges: path.edges.slice(0, i),
          message: `Buscando ${k}...`,
        });
      }
    }
    history.push({ text: `eliminar ${k} → no existe`, steps: [] });
    return {
      frames,
      finalTree: tree,
      finalMessage: `La clave ${k} no existe.`,
      history,
      touched: [],
      lastKey: null,
    };
  }

  let currentRoot = cloneTree(tree.root) as AvlNode;
  const path = findPath(currentRoot, k);
  const pathNodes = path.nodes;
  const pathEdges = path.edges;
  const target = pathNodes[pathNodes.length - 1];
  const targetParent = pathNodes[pathNodes.length - 2] ?? null;
  const structuralSteps: AvlStep[] = [];
  let ancestors: AvlNode[] = [];

  for (let i = 0; i < pathNodes.length; i += 1) {
    frames.push({
      tree: { root: cloneTree(currentRoot), keyType },
      nodes: pathNodes.slice(0, i + 1).map((node) => node.id),
      edges: pathEdges.slice(0, i),
      message: `Buscando ${k}...`,
    });
  }

  touched.add(target.id);

  if (target.left && target.right) {
    const successors: AvlNode[] = [];
    let cur = target.right;
    while (cur) {
      successors.push(cur);
      if (!cur.left) break;
      cur = cur.left;
    }
    const successor = successors[successors.length - 1];
    const successorParent = successors.length > 1 ? successors[successors.length - 2] : target;
    const successorEdges = successors.map((node, i) => (i === 0 ? `${target.id}:${node.id}` : `${successors[i - 1].id}:${node.id}`));

    for (let i = 0; i < successors.length; i += 1) {
      frames.push({
        tree: { root: cloneTree(currentRoot), keyType },
        nodes: [...pathNodes.map((node) => node.id), ...successors.slice(0, i + 1).map((node) => node.id)],
        edges: [...pathEdges, ...successorEdges.slice(0, i + 1)],
        message: `Buscando sucesor de ${k}...`,
      });
    }

    target.key = successor.key;
    structuralSteps.push({ t: 'replace-successor', key: k, successor: successor.key });
    touched.add(successor.id);
    frames.push({
      tree: { root: cloneTree(currentRoot), keyType },
      nodes: [target.id, successor.id],
      edges: [],
      message: `Reemplazar ${k} por sucesor ${successor.key}`,
    });

    if (successorParent.left === successor) successorParent.left = successor.right;
    else successorParent.right = successor.right;
    structuralSteps.push({ t: 'remove-leaf', key: successor.key });
    touched.add(successorParent.id);
    if (successor.right) touched.add(successor.right.id);
    frames.push({
      tree: { root: cloneTree(currentRoot), keyType },
      nodes: [successorParent.id, ...(successor.right ? [successor.right.id] : [])],
      edges: [],
      message: `Quitar ${successor.key}`,
    });

    ancestors = [...pathNodes, ...successors.slice(0, -1)];
  } else {
    const child = target.left ?? target.right;
    structuralSteps.push({ t: 'remove-leaf', key: k });
    if (targetParent) {
      if (targetParent.left === target) targetParent.left = child;
      else targetParent.right = child;
      touched.add(targetParent.id);
    } else {
      currentRoot = child as AvlNode;
    }
    if (child) touched.add(child.id);
    frames.push({
      tree: { root: cloneTree(currentRoot), keyType },
      nodes: [targetParent?.id, child?.id].filter(Boolean) as string[],
      edges: [],
      message: `Quitar ${k}`,
    });

    ancestors = pathNodes.slice(0, -1);
  }

  for (let i = ancestors.length - 1; i >= 0; i -= 1) updateHeight(ancestors[i]);

  const rotations: RotationLog[] = [];

  function attach(index: number, oldTop: AvlNode, newTop: AvlNode) {
    if (index === 0) {
      currentRoot = newTop;
      return;
    }
    const up = ancestors[index - 1];
    if (up.left === oldTop) up.left = newTop;
    else if (up.right === oldTop) up.right = newTop;
  }

  function snapshot(nodes: string[], message: string) {
    frames.push({ tree: { root: cloneTree(currentRoot), keyType }, nodes, edges: [], message, fadeEdges: true });
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
    const rotation: RotationLog = {
      case: rotationCase,
      direction,
      phase,
      at: rotated.key,
      newRoot: newTop.key,
      nodes: [rotated.id, newTop.id],
      step,
    };
    rotations.push(rotation);
    structuralSteps.push(step);
    touched.add(rotated.id);
    touched.add(newTop.id);
    return rotation;
  }

  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const node = ancestors[i];
    updateHeight(node);
    const factor = balanceOf(node);

    if (factor > 1) {
      const right = node.right as AvlNode;
      if (balanceOf(right) < 0) {
        const newChild = rotateRight(right);
        node.right = newChild;
        const first = recordRotation('RL', 'right', 1, right, newChild);
        snapshot(first.nodes, rotationMessage(first));

        const newTop = rotateLeft(node);
        attach(i, node, newTop);
        const second = recordRotation('RL', 'left', 2, node, newTop);
        snapshot(second.nodes, rotationMessage(second));
      } else {
        const newTop = rotateLeft(node);
        attach(i, node, newTop);
        const rotation = recordRotation('RR', 'left', 1, node, newTop);
        snapshot(rotation.nodes, rotationMessage(rotation));
      }
    } else if (factor < -1) {
      const left = node.left as AvlNode;
      if (balanceOf(left) > 0) {
        const newChild = rotateLeft(left);
        node.left = newChild;
        const first = recordRotation('LR', 'left', 1, left, newChild);
        snapshot(first.nodes, rotationMessage(first));

        const newTop = rotateRight(node);
        attach(i, node, newTop);
        const second = recordRotation('LR', 'right', 2, node, newTop);
        snapshot(second.nodes, rotationMessage(second));
      } else {
        const newTop = rotateRight(node);
        attach(i, node, newTop);
        const rotation = recordRotation('LL', 'right', 1, node, newTop);
        snapshot(rotation.nodes, rotationMessage(rotation));
      }
    }
  }

  const structuralOnly = structuralSteps.filter((step) => step.t === 'replace-successor' || step.t === 'remove-leaf');
  history.push({ text: `eliminar ${k} → ok`, steps: structuralOnly.map(formatStep) });
  for (const rotation of rotations) {
    history.push({ text: rotationMessage(rotation), steps: [formatStep(rotation.step)] });
  }

  return {
    frames,
    finalTree: { root: currentRoot, keyType },
    finalMessage: `Clave ${k} eliminada.`,
    history,
    touched: [...touched],
    lastKey: null,
  };
}
