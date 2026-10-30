import type { Key, KeyType } from '@/common/types';
import type { ManualNode } from '@/playgrounds/btree/model/validate';

export interface BTreeManualDraft {
  nodes: ManualNode[];
  rootId: string | null;
  p: number;
  keyType: KeyType;
}

export function uid(): string {
  return `m${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function seed(): BTreeManualDraft {
  // Lejos del origen para poder mover los nodos en todas direcciones.
  const a: ManualNode = { id: uid(), keys: [10, 20], slots: [null, null, null], x: 700, y: 450 };
  const b: ManualNode = { id: uid(), keys: [5], slots: [null, null], x: 200, y: 850 };
  const c: ManualNode = { id: uid(), keys: [15], slots: [null, null], x: 1100, y: 850 };
  a.slots = [b.id, c.id, null];
  return { nodes: [a, b, c], rootId: a.id, p: 4, keyType: 'number' };
}

export function fixSlots(keys: Key[], slots: (string | null)[]): (string | null)[] {
  const need = keys.length + 1;
  const next = slots.slice(0, need);
  while (next.length < need) next.push(null);
  return next;
}
