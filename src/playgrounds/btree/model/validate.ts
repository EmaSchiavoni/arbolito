// Validador de Árbol B manual. Trabaja sobre un grafo libre de nodos
// donde cada nodo guarda ids de hijos por slot (null = sin puntero).

import { cmpKey, type Key, type KeyType } from '@/common/types';
import { checkGraphStructure, type ValidationResult } from '@/common/validate/graph';

export type { ValidationIssue, ValidationResult } from '@/common/validate/graph';

export interface ManualNode {
  id: string;
  keys: Key[];
  slots: (string | null)[]; // longitud = keys.length + 1
  x: number;
  y: number;
}

export function validateManualTree(
  nodes: ManualNode[],
  p: number,
  rootId: string | null,
  keyType: KeyType = 'number',
): ValidationResult {
  if (nodes.length === 0) return { valid: true, issues: [] };
  const { byId, issues } = checkGraphStructure(nodes, rootId);
  if (!rootId || !byId.has(rootId)) return { valid: false, issues };

  const minPtr = Math.ceil(p / 2); // punteros mínimos en nodos no-raíz no-hoja
  const min = minPtr - 1; // claves mínimas en nodos no-raíz
  const max = p - 1;

  // 1. Claves ordenadas, sin duplicados, enteras, y slots coherentes.
  for (const n of nodes) {
    if (n.keys.length > max) {
      issues.push({ nodeId: n.id, message: `Tiene ${n.keys.length} claves, el máximo con p=${p} es ${max}.` });
    }
    const isRoot = n.id === rootId;
    if (!isRoot && n.keys.length < min) {
      issues.push({ nodeId: n.id, message: `Tiene ${n.keys.length} claves, el mínimo con p=${p} es ${min} (${minPtr} punteros).` });
    }
    if (isRoot && n.keys.length < 1) {
      issues.push({ nodeId: n.id, message: 'La raíz no puede estar vacía si hay nodos.' });
    }
    for (const k of n.keys) {
      if (typeof k !== (keyType === 'string' ? 'string' : 'number')) {
        issues.push({ nodeId: n.id, message: `La clave ${k} no es del tipo ${keyType === 'string' ? 'texto' : 'numérico'} del árbol.` });
        break;
      }
      if (keyType === 'number' && !Number.isInteger(k)) {
        issues.push({ nodeId: n.id, message: 'Hay claves no enteras. Usá solo enteros.' });
        break;
      }
    }
    const sorted = [...n.keys].sort(cmpKey);
    for (let i = 0; i < n.keys.length; i += 1) {
      if (n.keys[i] !== sorted[i]) {
        issues.push({ nodeId: n.id, message: 'Las claves no están ordenadas de menor a mayor.' });
        break;
      }
    }
    if (new Set(n.keys).size !== n.keys.length) {
      issues.push({ nodeId: n.id, message: 'Hay claves duplicadas dentro del nodo.' });
    }
    if (n.slots.length !== n.keys.length + 1) {
      issues.push({ nodeId: n.id, message: 'La cantidad de punteros no coincide con claves+1.' });
    }
  }

  // 2. Hijos: 0 o keys+1 (todos los slots conectados o ninguno). La raíz no
  // única, si tiene hijos, debe tener al menos 2 punteros.
  for (const n of nodes) {
    const connected = n.slots.filter((s) => s !== null).length;
    if (connected !== 0 && connected !== n.slots.length) {
      issues.push({ nodeId: n.id, message: 'Si el nodo tiene hijos, todos los slots deben estar conectados.' });
    }
    if (n.id === rootId && connected !== 0 && connected < 2) {
      issues.push({ nodeId: n.id, message: 'La raíz con hijos debe tener como mínimo 2 punteros.' });
    }
  }

  // 3. Orden de claves entre padre e hijos + hojas a igual profundidad.
  // Los extremos null significan "sin cota" (funciona en ambos modos).
  const leafDepths = new Set<number>();
  const walked = new Set<string>();
  function checkOrder(nodeId: string, low: Key | null, high: Key | null, depth: number) {
    if (walked.has(nodeId)) return;
    walked.add(nodeId);
    const n = byId.get(nodeId) as ManualNode | undefined;
    if (!n) return;
    for (const k of n.keys) {
      if (!((low === null || cmpKey(low, k) < 0) && (high === null || cmpKey(k, high) < 0))) {
        const lo = low === null ? '−∞' : low;
        const hi = high === null ? '+∞' : high;
        issues.push({ nodeId: n.id, message: `La clave ${k} está fuera del rango permitido (${lo}, ${hi}).` });
      }
    }
    const connected = n.slots.filter((s): s is string => s !== null);
    if (connected.length === 0) {
      leafDepths.add(depth);
      return;
    }
    const bounds: [Key | null, Key | null][] = [];
    let prev: Key | null = low;
    for (const k of n.keys) {
      bounds.push([prev, k]);
      prev = k;
    }
    bounds.push([prev, high]);
    n.slots.forEach((target, i) => {
      if (target) checkOrder(target, bounds[i][0], bounds[i][1], depth + 1);
    });
  }
  checkOrder(rootId, null, null, 0);
  if (leafDepths.size > 1) {
    issues.push({ message: 'No todas las hojas están a la misma profundidad.' });
  }

  // 4. Duplicados globales.
  const seen = new Map<Key, string>();
  for (const n of nodes) {
    for (const k of n.keys) {
      if (seen.has(k)) {
        issues.push({ nodeId: n.id, message: `La clave ${k} está repetida en otro nodo. No se permiten duplicados.` });
        break;
      }
      seen.set(k, n.id);
    }
  }

  return { valid: issues.length === 0, issues };
}
