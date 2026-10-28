// Layout por niveles para los canvas automáticos (Árbol B, AVL, futuro
// n-ario). Trabaja sobre cualquier nodo describiéndolo con un adaptador y
// devuelve posiciones en un espacio virtual que el canvas escala con pan/zoom.

export interface LayoutAdapter<T> {
  id: (node: T) => string;
  children: (node: T) => T[];
  width: (node: T) => number;
}

export interface PlacedNode<T> {
  node: T;
  id: string;
  x: number;
  y: number;
  depth: number;
}

export interface PlacedEdge {
  from: string;
  to: string;
  slot: number;
}

export const NODE_W = 120;
export const NODE_H = 64;
export const LEVEL_GAP = 90;
export const SIBLING_GAP = 24;

export function layoutTree<T>(
  root: T | null,
  adapter: LayoutAdapter<T>,
  options: { levelGap?: number; siblingGap?: number } = {},
): { nodes: PlacedNode<T>[]; edges: PlacedEdge[] } {
  if (!root) return { nodes: [], edges: [] };
  const levelGap = options.levelGap ?? LEVEL_GAP;
  const siblingGap = options.siblingGap ?? SIBLING_GAP;
  const nodes: PlacedNode<T>[] = [];
  const edges: PlacedEdge[] = [];
  const unitX = new Map<T, number>();
  let cursor = 0;

  function firstPass(node: T): number {
    const children = adapter.children(node);
    if (children.length === 0) {
      const x = cursor;
      cursor += 1;
      unitX.set(node, x);
      return x;
    }
    const xs = children.map(firstPass);
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    unitX.set(node, x);
    return x;
  }

  function secondPass(node: T, depth: number) {
    const id = adapter.id(node);
    const children = adapter.children(node);
    nodes.push({
      node,
      id,
      x: (unitX.get(node) ?? 0) * (adapter.width(node) + siblingGap),
      y: depth * (NODE_H + levelGap),
      depth,
    });
    children.forEach((child, slot) => {
      edges.push({ from: id, to: adapter.id(child), slot });
      secondPass(child, depth + 1);
    });
  }

  firstPass(root);
  secondPass(root, 0);
  return { nodes, edges };
}
