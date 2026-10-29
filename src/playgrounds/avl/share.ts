// Adaptador de enlaces compartidos del Árbol AVL.
//
// Igual que en Árbol B, el enlace guarda una sola representación y de ella se
// derivan las copias de ambos modos. Las alturas se recalculan al hidratar y
// un grafo manual inválido se reemplaza por inserciones canónicas.

import { cmpKey, isValidKey, type Key, type KeyType } from '../../common/types';
import type { HydratedModes, PlaygroundShareAdapter, SharedTreeData } from '../../common/share/types';
import { cloneTree, createTree, insertKey, type AvlNode, type AvlTree } from './model/avl';
import { validateManualAvl, type AvlManualNode } from './model/validate';
import { layoutTree } from '../../common/tree/layout';
import { AVL_KEYS, avlStorage } from './storage';
import { MANUAL_NODE_H, MANUAL_NODE_W } from './ui/node-metrics';

export interface AvlAutoState {
  tree: AvlTree;
}

export interface AvlManualState {
  nodes: AvlManualNode[];
  rootId: string | null;
  keyType: KeyType;
}

type SerializedAutoNode = [Key, SerializedAutoNode | null, SerializedAutoNode | null];

interface SerializedAuto {
  kind: 'auto';
  root: SerializedAutoNode | null;
}

interface SerializedManual {
  kind: 'manual';
  rootId: string | null;
  nodes: Array<[string, Key | null, (string | null)[], number, number]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validKey(keyType: KeyType, value: unknown): value is Key {
  return (typeof value === 'number' || typeof value === 'string') && isValidKey(keyType, value);
}

// ---------- Serialización ----------

function serializeNode(node: AvlNode | null): SerializedAutoNode | null {
  if (!node) return null;
  return [node.key, serializeNode(node.left), serializeNode(node.right)];
}

function serializeManual(state: AvlManualState): SerializedManual {
  return {
    kind: 'manual',
    rootId: state.rootId,
    nodes: state.nodes.map((n) => [n.id, n.key, [...n.slots], Math.round(n.x), Math.round(n.y)]),
  };
}

// ---------- Lectura del formato ----------

function parseAutoNode(value: unknown, keyType: KeyType, nextId: { n: number }): AvlNode | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const [key, left, right] = value;
  if (!validKey(keyType, key)) return null;
  const l = left === null ? null : parseAutoNode(left, keyType, nextId);
  const r = right === null ? null : parseAutoNode(right, keyType, nextId);
  if (left !== null && !l) return null;
  if (right !== null && !r) return null;
  nextId.n += 1;
  const height = 1 + Math.max(l?.height ?? 0, r?.height ?? 0);
  return { id: `a${nextId.n}`, key, left: l, right: r, height };
}

function parseAuto(value: unknown, keyType: KeyType): AvlTree | null {
  if (!isRecord(value) || value.kind !== 'auto') return null;
  if (value.root === null) return createTree(keyType);
  const root = parseAutoNode(value.root, keyType, { n: 0 });
  if (!root) return null;
  const tree: AvlTree = { root, keyType };
  const check = layoutManual({ tree });
  if (!validateManualAvl(check.nodes, check.rootId, keyType).valid) return null;
  return tree;
}

function parseManual(value: unknown, keyType: KeyType): AvlManualState | null {
  if (!isRecord(value) || value.kind !== 'manual' || !Array.isArray(value.nodes)) return null;
  if (value.nodes.length > 5000) return null;

  const ids = new Set<string>();
  const nodes: AvlManualNode[] = [];
  for (const raw of value.nodes) {
    if (!Array.isArray(raw) || raw.length !== 5) return null;
    const [id, key, rawSlots, x, y] = raw;
    if (typeof id !== 'string' || ids.has(id)) return null;
    if (key !== null && !validKey(keyType, key)) return null;
    if (!Array.isArray(rawSlots) || rawSlots.length !== 2) return null;
    const slots = rawSlots.filter((s): s is string | null => s === null || typeof s === 'string');
    if (slots.length !== rawSlots.length) return null;
    if (typeof x !== 'number' || !Number.isFinite(x)) return null;
    if (typeof y !== 'number' || !Number.isFinite(y)) return null;
    ids.add(id);
    nodes.push({ id, key, slots: [slots[0] ?? null, slots[1] ?? null], x, y });
  }

  const rootId = typeof value.rootId === 'string' && ids.has(value.rootId) ? value.rootId : null;
  if (nodes.length > 0 && !rootId) return null;
  for (const n of nodes) {
    for (const slot of n.slots) {
      if (slot !== null && !ids.has(slot)) return null;
    }
  }
  return { nodes, rootId, keyType };
}

// ---------- Conversiones entre modos ----------

function layoutManual(state: AvlAutoState): AvlManualState {
  const { tree } = state;
  const layout = layoutTree(tree.root, {
    id: (n) => n.id,
    children: (n) => {
      const out = [];
      if (n.left) out.push(n.left);
      if (n.right) out.push(n.right);
      return out;
    },
    childSlots: (n) => [n.left, n.right],
    width: () => MANUAL_NODE_W,
  });
  return {
    nodes: layout.nodes.map((placed) => ({
      id: placed.id,
      key: placed.node.key,
      slots: [placed.node.left?.id ?? null, placed.node.right?.id ?? null],
      x: placed.x,
      y: placed.y + MANUAL_NODE_H / 2,
    })),
    rootId: tree.root?.id ?? null,
    keyType: tree.keyType,
  };
}

function manualToAuto(state: AvlManualState): { tree: AvlTree; degraded: boolean } {
  const { nodes, rootId, keyType } = state;
  if (nodes.length === 0 || !rootId) return { tree: createTree(keyType), degraded: false };

  const valid = validateManualAvl(nodes, rootId, keyType).valid;
  if (valid) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const build = (id: string, depth: number): AvlNode | null => {
      const n = byId.get(id);
      if (!n || n.key === null || depth > 10000) return null;
      const left = n.slots[0] ? build(n.slots[0], depth + 1) : null;
      const right = n.slots[1] ? build(n.slots[1], depth + 1) : null;
      const node: AvlNode = {
        id,
        key: n.key,
        left,
        right,
        height: 1 + Math.max(left?.height ?? 0, right?.height ?? 0),
      };
      return node;
    };
    const root = build(rootId, 0);
    if (root) return { tree: { root, keyType }, degraded: false };
  }

  const keys = [...new Set(nodes.map((n) => n.key).filter((k): k is Key => k !== null))].sort(cmpKey);
  let tree = createTree(keyType);
  for (const key of keys) tree = insertKey(tree, key);
  return { tree, degraded: true };
}

// ---------- Adaptador ----------

export const avlShare: PlaygroundShareAdapter = {
  serialize(mode, state) {
    if (mode === 'auto') {
      const s = state as AvlAutoState;
      if (!s?.tree) return null;
      return {
        keyType: s.tree.keyType,
        nodes: { kind: 'auto', root: serializeNode(s.tree.root) } satisfies SerializedAuto,
      };
    }
    const s = state as AvlManualState;
    if (!s || !Array.isArray(s.nodes)) return null;
    return { keyType: s.keyType, nodes: serializeManual(s) };
  },

  hydrate(mode, data: SharedTreeData): HydratedModes | null {
    if (mode === 'auto') {
      const tree = parseAuto(data.nodes, data.keyType);
      if (!tree) return null;
      return { auto: { tree: { root: cloneTree(tree.root), keyType: tree.keyType } }, manual: layoutManual({ tree }) };
    }
    const manual = parseManual(data.nodes, data.keyType);
    if (!manual) return null;
    const { tree, degraded } = manualToAuto(manual);
    return { auto: { tree }, manual, degraded: degraded ? ['auto'] : undefined };
  },

  hasSavedData(mode) {
    if (mode === 'auto') {
      const saved = avlStorage.load<AvlTree | null>(AVL_KEYS.autoTree, null);
      return !!saved?.root;
    }
    const saved = avlStorage.load<AvlManualState | null>(AVL_KEYS.manual, null);
    return !!saved && Array.isArray(saved.nodes) && saved.nodes.some((n) => n.key !== null);
  },

  save(mode, state) {
    try {
      if (mode === 'auto') {
        const s = state as AvlAutoState;
        avlStorage.save(AVL_KEYS.autoTree, s.tree);
        avlStorage.save(AVL_KEYS.autoHistory, []);
      } else {
        avlStorage.save(AVL_KEYS.manual, state as AvlManualState);
      }
      return true;
    } catch {
      return false;
    }
  },

  isEmpty(mode, state) {
    if (mode === 'auto') return !(state as AvlAutoState)?.tree?.root;
    const s = state as AvlManualState;
    return !s?.nodes || !s.nodes.some((n) => n.key !== null);
  },
};
