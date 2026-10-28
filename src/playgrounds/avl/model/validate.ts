// Validador del editor manual de AVL: estructura libre de nodos con hasta dos
// hijos por nodo. Comprueba BST, claves y factor de balance.

import { cmpKey, type Key, type KeyType } from '../../../common/types';
import { checkGraphStructure, type ValidationIssue, type ValidationResult } from '../../../common/validate/graph';

export interface AvlManualNode {
  id: string;
  key: Key | null;
  slots: (string | null)[]; // [izquierdo, derecho]
  x: number;
  y: number;
}

export function validateManualAvl(
  nodes: AvlManualNode[],
  rootId: string | null,
  keyType: KeyType = 'number',
): ValidationResult {
  if (nodes.length === 0) return { valid: true, issues: [] };
  const { byId, issues } = checkGraphStructure(nodes, rootId);
  if (!rootId || !byId.has(rootId)) return { valid: false, issues };

  for (const n of nodes) {
    if (n.slots.length !== 2) {
      issues.push({ nodeId: n.id, message: 'Cada nodo debe tener exactamente dos punteros (izquierdo y derecho).' });
    }
    if (n.key === null) {
      issues.push({ nodeId: n.id, message: 'El nodo no tiene clave.' });
      continue;
    }
    if (typeof n.key !== (keyType === 'string' ? 'string' : 'number')) {
      issues.push({ nodeId: n.id, message: `La clave ${n.key} no es del tipo ${keyType === 'string' ? 'texto' : 'numérico'} del árbol.` });
    } else if (keyType === 'number' && !Number.isInteger(n.key)) {
      issues.push({ nodeId: n.id, message: 'Hay claves no enteras. Usá solo enteros.' });
    }
  }

  const seen = new Map<Key, string>();
  for (const n of nodes) {
    if (n.key === null) continue;
    if (seen.has(n.key)) {
      issues.push({ nodeId: n.id, message: `La clave ${n.key} está repetida en otro nodo. No se permiten duplicados.` });
    } else {
      seen.set(n.key, n.id);
    }
  }

  const heights = new Map<string, number>();
  const orderIssues: ValidationIssue[] = [];
  const walked = new Set<string>();

  function walk(id: string, low: Key | null, high: Key | null): number {
    if (walked.has(id)) return heights.get(id) ?? 0;
    walked.add(id);
    const node = byId.get(id);
    if (!node || !('key' in node)) return 0;
    const avl = node as AvlManualNode;
    if (avl.key !== null) {
      if (!((low === null || cmpKey(low, avl.key) < 0) && (high === null || cmpKey(avl.key, high) < 0))) {
        const lo = low === null ? '−∞' : low;
        const hi = high === null ? '+∞' : high;
        orderIssues.push({ nodeId: avl.id, message: `La clave ${avl.key} está fuera del rango permitido (${lo}, ${hi}).` });
      }
    }
    const leftId = avl.slots[0] ?? null;
    const rightId = avl.slots[1] ?? null;
    const leftHeight = leftId ? walk(leftId, low, avl.key ?? high) : 0;
    const rightHeight = rightId ? walk(rightId, avl.key ?? low, high) : 0;
    const h = 1 + Math.max(leftHeight, rightHeight);
    heights.set(avl.id, h);
    return h;
  }

  walk(rootId, null, null);
  issues.push(...orderIssues);

  for (const n of nodes) {
    const leftId = n.slots[0] ?? null;
    const rightId = n.slots[1] ?? null;
    const leftHeight = leftId ? (heights.get(leftId) ?? 0) : 0;
    const rightHeight = rightId ? (heights.get(rightId) ?? 0) : 0;
    const factor = rightHeight - leftHeight;
    if (Math.abs(factor) > 1) {
      issues.push({ nodeId: n.id, message: `Factor de balance ${factor} fuera de rango: debe estar entre -1 y 1.` });
    }
  }

  return { valid: issues.length === 0, issues };
}
