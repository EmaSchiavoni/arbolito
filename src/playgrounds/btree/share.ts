// Adaptador de enlaces compartidos del Árbol B.
//
// Un enlace guarda una única representación (`kind: 'auto' | 'manual'`) y de
// ella se derivan dos copias independientes, una por modo. El modo manual
// conserva posiciones y punteros; si el grafo no es un Árbol B válido, la
// copia automática se reconstruye insertando sus claves en orden.

import { ORDER_MAX, ORDER_MIN } from '../../common/components/OrderPicker';
import { cmpKey, isValidKey, type Key, type KeyType } from '../../common/types';
import type { HydratedModes, PlaygroundShareAdapter, SharedTreeData } from '../../common/share/types';
import {
  CATEDRA_POLICY,
  countKeys,
  createTree,
  insertKey,
  type BNode,
  type BTree,
} from './model/btree';
import { validateManualTree, type ManualNode } from './model/validate';
import { layoutTree } from '../../common/tree/layout';
import { BTREE_KEYS, btreeStorage } from './storage';
import { manualNodeWidth } from './ui/node-metrics';

export interface BTreeAutoState {
  p: number;
  tree: BTree;
}

export interface BTreeManualState {
  nodes: ManualNode[];
  rootId: string | null;
  p: number;
  keyType: KeyType;
}

type SerializedAutoNode = [Key[], SerializedAutoNode[]];

interface SerializedAuto {
  kind: 'auto';
  root: SerializedAutoNode | null;
}

interface SerializedManual {
  kind: 'manual';
  rootId: string | null;
  nodes: Array<[string, Key[], (string | null)[], number, number]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= ORDER_MIN && value <= ORDER_MAX;
}

function validKey(keyType: KeyType, value: unknown): value is Key {
  return (typeof value === 'number' || typeof value === 'string') && isValidKey(keyType, value);
}

// ---------- Serialización ----------

function serializeNode(node: BNode | null): SerializedAutoNode | null {
  if (!node) return null;
  return [[...node.keys], node.children.map(serializeNode).filter((c): c is SerializedAutoNode => c !== null)];
}

function serializeAuto(state: BTreeAutoState): SerializedAuto {
  return { kind: 'auto', root: serializeNode(state.tree.root) };
}

function serializeManual(state: BTreeManualState): SerializedManual {
  return {
    kind: 'manual',
    rootId: state.rootId,
    nodes: state.nodes.map((n) => [n.id, [...n.keys], [...n.slots], Math.round(n.x), Math.round(n.y)]),
  };
}

// ---------- Lectura del formato ----------

function parseAutoNode(
  value: unknown,
  keyType: KeyType,
  p: number,
  nextId: { n: number },
): BNode | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [rawKeys, rawChildren] = value;
  if (!Array.isArray(rawKeys) || !Array.isArray(rawChildren)) return null;
  if (rawKeys.length > p - 1) return null;
  const keys = rawKeys.filter((k): k is Key => validKey(keyType, k));
  if (keys.length !== rawKeys.length) return null;
  for (let i = 1; i < keys.length; i += 1) {
    if (cmpKey(keys[i - 1], keys[i]) >= 0) return null;
  }
  if (rawChildren.length !== 0 && rawChildren.length !== keys.length + 1) return null;
  const children = rawChildren.map((c) => parseAutoNode(c, keyType, p, nextId));
  if (children.some((c) => c === null)) return null;
  nextId.n += 1;
  return { id: `s${nextId.n}`, keys, children: children as BNode[] };
}

function parseAuto(value: unknown, p: number, keyType: KeyType): BTree | null {
  if (!isRecord(value) || value.kind !== 'auto') return null;
  if (value.root === null) return createTree(p, keyType);
  const root = parseAutoNode(value.root, keyType, p, { n: 0 });
  if (!root) return null;
  const tree: BTree = { root, p, keyType };
  // Reutiliza el validador del editor manual: garantiza que el enlace solo
  // reconstruya un Árbol B que cumpla las reglas de la cátedra.
  const check = layoutManual({ p, tree });
  if (!validateManualTree(check.nodes, p, check.rootId, keyType).valid) return null;
  return tree;
}

function parseManual(value: unknown, p: number, keyType: KeyType): BTreeManualState | null {
  if (!isRecord(value) || value.kind !== 'manual' || !Array.isArray(value.nodes)) return null;
  if (value.nodes.length > 5000) return null;

  const ids = new Set<string>();
  const nodes: ManualNode[] = [];
  for (const raw of value.nodes) {
    if (!Array.isArray(raw) || raw.length !== 5) return null;
    const [id, rawKeys, rawSlots, rawX, rawY] = raw;
    if (typeof id !== 'string' || ids.has(id)) return null;
    if (!Array.isArray(rawKeys) || !Array.isArray(rawSlots)) return null;
    if (typeof rawX !== 'number' || !Number.isFinite(rawX)) return null;
    if (typeof rawY !== 'number' || !Number.isFinite(rawY)) return null;
    const keys = rawKeys.filter((k): k is Key => validKey(keyType, k));
    if (keys.length !== rawKeys.length) return null;
    const slots = rawSlots.filter((s): s is string => typeof s === 'string');
    if (slots.length !== rawSlots.length) return null;
    const need = keys.length + 1;
    const trimmed: (string | null)[] = slots.slice(0, need);
    while (trimmed.length < need) trimmed.push(null);
    ids.add(id);
    nodes.push({ id, keys, slots: trimmed, x: rawX, y: rawY });
  }

  const rootId = typeof value.rootId === 'string' && ids.has(value.rootId) ? value.rootId : null;
  if (nodes.length > 0 && !rootId) return null;
  // Una referencia rota invalida el enlace (no se puede reconstruir el árbol).
  for (const n of nodes) {
    for (const slot of n.slots) {
      if (slot !== null && !ids.has(slot)) return null;
    }
  }
  return { nodes, rootId, p, keyType };
}

// ---------- Conversiones entre modos ----------

function layoutManual(state: BTreeAutoState): BTreeManualState {
  const { p, tree } = state;
  const layout = layoutTree(tree.root, {
    id: (n) => n.id,
    children: (n) => n.children,
    width: () => manualNodeWidth(p),
  });
  const byId = new Map<string, ManualNode>();
  for (const placed of layout.nodes) {
    const n = placed.node;
    byId.set(placed.id, {
      id: placed.id,
      keys: [...n.keys],
      // La representación manual usa exactamente |claves|+1 slots; en una
      // hoja todos están vacíos.
      slots: n.children.length > 0 ? n.children.map((c) => c.id) : new Array<null>(n.keys.length + 1).fill(null),
      x: placed.x,
      y: placed.y,
    });
  }
  return { nodes: [...byId.values()], rootId: tree.root?.id ?? null, p, keyType: tree.keyType };
}

function manualToAuto(state: BTreeManualState): { tree: BTree; degraded: boolean } {
  const { nodes, rootId, p, keyType } = state;
  if (nodes.length === 0) return { tree: createTree(p, keyType), degraded: false };

  const valid = rootId !== null && validateManualTree(nodes, p, rootId, keyType).valid;
  if (valid && rootId) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const build = (id: string, depth: number): BNode | null => {
      const n = byId.get(id);
      if (!n || depth > 10000) return null;
      const children = n.slots.map((slot) => (slot ? build(slot, depth + 1) : null));
      if (children.some((c) => c === null)) return null;
      return { id, keys: [...n.keys], children: children as BNode[] };
    };
    const root = build(rootId, 0);
    if (root) return { tree: { root, p, keyType }, degraded: false };
  }

  // Copia canónica: se insertan todas las claves válidas en orden.
  const keys = [...new Set(nodes.flatMap((n) => n.keys))].sort(cmpKey);
  let tree = createTree(p, keyType);
  for (const key of keys) tree = insertKey(tree, key, CATEDRA_POLICY);
  return { tree, degraded: true };
}

// ---------- Adaptador ----------

export const btreeShare: PlaygroundShareAdapter = {
  serialize(mode, state) {
    if (mode === 'auto') {
      const s = state as BTreeAutoState;
      if (!s?.tree || !validOrder(s.p)) return null;
      return { keyType: s.tree.keyType, order: s.p, nodes: serializeAuto(s) };
    }
    const s = state as BTreeManualState;
    if (!s || !validOrder(s.p) || !Array.isArray(s.nodes)) return null;
    return { keyType: s.keyType, order: s.p, nodes: serializeManual(s) };
  },

  hydrate(mode, data: SharedTreeData): HydratedModes | null {
    if (!validOrder(data.order)) return null;
    const p = data.order;
    if (mode === 'auto') {
      const auto = parseAuto(data.nodes, p, data.keyType);
      if (!auto) return null;
      const manual = layoutManual({ p, tree: auto });
      return { auto: { p, tree: auto }, manual };
    }
    const manual = parseManual(data.nodes, p, data.keyType);
    if (!manual) return null;
    const { tree, degraded } = manualToAuto(manual);
    return { auto: { p, tree }, manual, degraded: degraded ? ['auto'] : undefined };
  },

  hasSavedData(mode) {
    if (mode === 'auto') {
      const saved = btreeStorage.load<{ root: BNode | null } | null>(BTREE_KEYS.autoTree, null);
      return !!saved?.root && countKeys(saved.root) > 0;
    }
    const saved = btreeStorage.load<BTreeManualState | null>(BTREE_KEYS.manual, null);
    return !!saved && Array.isArray(saved.nodes) && saved.nodes.some((n) => n.keys.length > 0);
  },

  save(mode, state) {
    try {
      if (mode === 'auto') {
        const s = state as BTreeAutoState;
        btreeStorage.save(BTREE_KEYS.autoP, s.p);
        btreeStorage.save(BTREE_KEYS.autoTree, { p: s.p, root: s.tree.root, keyType: s.tree.keyType });
        btreeStorage.save(BTREE_KEYS.autoHistory, []);
      } else {
        btreeStorage.save(BTREE_KEYS.manual, state as BTreeManualState);
      }
      return true;
    } catch {
      return false;
    }
  },

  isEmpty(mode, state) {
    if (mode === 'auto') {
      const s = state as BTreeAutoState;
      return !s?.tree?.root || countKeys(s.tree.root) === 0;
    }
    const s = state as BTreeManualState;
    return !s?.nodes || !s.nodes.some((n) => n.keys.length > 0);
  },
};
