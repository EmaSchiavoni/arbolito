// Chequeos estructurales comunes a los editores manuales: cada nodo expone
// slots de salida (null = sin puntero). Valida destinos, padres únicos,
// alcanzabilidad y ciclos.

export interface GraphNode {
  id: string;
  slots: (string | null)[];
}

export interface ValidationIssue {
  nodeId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface StructureCheck {
  byId: Map<string, GraphNode>;
  parentOf: Map<string, string>;
  visited: Set<string>;
  issues: ValidationIssue[];
}

export function checkGraphStructure(nodes: GraphNode[], rootId: string | null): StructureCheck {
  const issues: ValidationIssue[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parentOf = new Map<string, string>();
  const visited = new Set<string>();

  if (nodes.length === 0) return { byId, parentOf, visited, issues };

  if (!rootId || !byId.has(rootId)) {
    issues.push({ message: 'Elegí un nodo raíz para validar el árbol.' });
    return { byId, parentOf, visited, issues };
  }

  for (const n of nodes) {
    for (const target of n.slots) {
      if (target === null) continue;
      if (!byId.has(target)) {
        issues.push({ nodeId: n.id, message: 'Un puntero apunta a un nodo que no existe.' });
        continue;
      }
      if (target === n.id) {
        issues.push({ nodeId: n.id, message: 'Un nodo no puede apuntarse a sí mismo.' });
      }
      if (parentOf.has(target)) {
        issues.push({ nodeId: target, message: 'Un nodo tiene dos padres. Cada nodo (salvo la raíz) debe tener un solo padre.' });
      } else {
        parentOf.set(target, n.id);
      }
    }
  }

  for (const n of nodes) {
    if (n.id === rootId) continue;
    if (!parentOf.has(n.id)) {
      issues.push({ nodeId: n.id, message: 'El nodo está suelto: nadie apunta hacia él.' });
    }
  }

  const stack = new Set<string>();
  let hasCycle = false;
  function dfs(id: string) {
    if (stack.has(id)) {
      hasCycle = true;
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    stack.add(id);
    const n = byId.get(id);
    if (n) {
      for (const target of n.slots) if (target) dfs(target);
    }
    stack.delete(id);
  }
  dfs(rootId);

  if (hasCycle) issues.push({ message: 'Hay un ciclo de punteros. El árbol no puede tener ciclos.' });
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      issues.push({ nodeId: n.id, message: 'No es alcanzable desde la raíz.' });
    }
  }

  return { byId, parentOf, visited, issues };
}
