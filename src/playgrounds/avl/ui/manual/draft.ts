import type { KeyType } from '@/common/types';
import type { AvlManualNode } from '@/playgrounds/avl/model/validate';

export interface AvlManualDraft {
  nodes: AvlManualNode[];
  rootId: string | null;
  keyType: KeyType;
}

export function uid(): string {
  return `av${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function seed(): AvlManualDraft {
  const root: AvlManualNode = { id: uid(), key: 20, slots: [null, null], x: 700, y: 450 };
  const left: AvlManualNode = { id: uid(), key: 10, slots: [null, null], x: 350, y: 800 };
  const right: AvlManualNode = { id: uid(), key: 30, slots: [null, null], x: 1050, y: 800 };
  root.slots = [left.id, right.id];
  return { nodes: [root, left, right], rootId: root.id, keyType: 'number' };
}
