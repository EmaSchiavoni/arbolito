# Crear un playground

Un playground nuevo es una carpeta en `src/playgrounds/<id>/` más una entrada en `src/app/registry.ts`. El resto (rutas, selector del header, landing, enlaces compartidos y sitemap) se apoya en esas dos cosas, pero hay pasos que no son automáticos: el SEO, el sitemap de rutas y la adaptación a los enlaces.

Esta página usa como ejemplo un **árbol n-ario** (`nary`). El ejemplo define un árbol general con una clave por nodo y hasta `maxChildren` hijos. No impone un orden de búsqueda: el automático inserta en el primer hueco por niveles y el manual valida estructura, tipos, duplicados y cantidad de hijos. Si tu n-ario es de búsqueda, cambiá `insertKeyLogged`, `searchPath`, `deleteSubtreeLogged` y el validador; el andamiaje de estado, canvas, toolbar, storage y enlaces no cambia.

Los enlaces compartidos y las herramientas del canvas tienen páginas propias. Esta guía las cita y no repite su implementación: el adaptador completo está en [Enlaces compartidos](./06-enlaces-compartidos.md) y la integración de gestos en [Herramientas del canvas](./05-herramientas-del-canvas.md).

## Qué necesita un playground

Un playground no son solo dos pantallas. Para que funcione, se pueda validar y se pueda compartir necesita estas piezas:

| Pieza | Responsabilidad | Se detalla en |
| --- | --- | --- |
| Modelo puro | Tipos del árbol, operaciones, pasos del historial e invariantes. No importa React ni storage. | [Modelo puro](#modelo-puro) |
| Validador manual | Reglas que debe cumplir un grafo construido a mano. Devuelve `ValidationResult`. | [Validador del editor manual](#validador-del-editor-manual) |
| Storage | Claves de `localStorage` y persistencia del árbol, historial, vista y configuración. | [Storage](#storage) y [Estructura de archivos](./03-convenciones-y-calidad.md#estructura-de-archivos) |
| Adaptador de enlaces | Serializa el estado, hidrata ambos modos y decide qué se guarda al abrir un enlace. | [Enlaces compartidos](./06-enlaces-compartidos.md) |
| Hook automático | Estado, operaciones, historial, layout y persistencia del modo automático. | [Hook del modo automático](#hook-del-modo-automático) |
| Pantalla del modo automático | Compone el header, el canvas, el nodo, la toolbar y los diálogos. No ejecuta el algoritmo. | [Pantalla del modo automático](#pantalla-del-modo-automático) |
| Borrador y hook manual | Estado editable del grafo, selección, linking, undo/redo y validación. | [Borrador y hook del modo manual](#borrador-y-hook-del-modo-manual) |
| Pantalla del modo manual | Compone el editor manual: canvas, nodo editable, toolbar y `ValidationSheet`. | [Pantalla del modo manual](#pantalla-del-modo-manual) |
| Configuración | Controles que se pasan a `AppShell` como `config` (por ejemplo, `maxChildren` y tipo de clave). | [Configuración del header](#configuración-del-header) |
| Registry, SEO y sitemap | Ruta, entrada en el menú, metadatos y sitemap. | [Registry y rutas](#registry-y-rutas) y [SEO, sitemap y textos](#seo-sitemap-y-textos) |
| Herramientas del canvas | Opcionales. Solo si el editor necesita gestos de fondo además de arrastrar nodos y seleccionar. | [Herramientas del canvas](./05-herramientas-del-canvas.md) |

El orden recomendado es: modelo → validador → storage → adaptador de enlaces → hook y pantalla automáticos → borrador, hook y pantalla manuales → configuración → registry, SEO y sitemap. El adaptador de enlaces se puede dejar para después de la primera pantalla, pero conviene definirlo antes de conectar `AppShell` porque el botón Compartir depende de él.

## Decisiones antes de escribir

Respondé esto primero; define casi todo el código:

| Decisión | Ejemplo n-ario | Dónde impacta |
| --- | --- | --- |
| `id` de ruta | `nary` | registry, storage, share, analítica, SEO, sitemap |
| Nombre visible | `Árbol n-ario` | registry, `AppShell`, landing, SEO |
| Configuración | `maxChildren` (2..10) | `NaryConfig`, modelo, storage, share, validación |
| Tipo de clave | `number \| string` | `common/types`, inputs, share |
| Invariantes | una clave por nodo, hasta `maxChildren` hijos, sin duplicados, un padre, sin ciclos | modelo + validador |
| Operaciones automáticas | insertar, eliminar subárbol, buscar, azar, limpiar, historial | hook automático |
| Editor manual | un nodo por clave, slots de hijos, linking, arrastre, undo/redo, Validar | hook manual |
| Ajustes persistidos | árbol, historial, vista, `maxChildren`, tipo | `storage.ts` |
| Enlace compartido | ambos modos derivados del mismo enlace | `share.ts` |

No agregues un tercer modo (`auto`/`manual` son los únicos valores de `Mode`) sin tocar `src/common/playground.ts`, `App.tsx`, `AppShell`, los menús, `SaveSharedTreeDialog` y el codec. Para un playground nuevo no hace falta.

El árbol de archivos que vas a crear:

```
src/playgrounds/nary/
  model/
    nary.ts                 # modelo puro, pasos e invariantes
    validate.ts             # validador del editor manual
  ui/
    AutoPlayground.tsx      # compone header + canvas + toolbar
    ManualPlayground.tsx    # compone header + canvas + toolbar + sheet
    NaryConfig.tsx          # maxChildren + tipo de clave
    node-metrics.ts         # anchos, altos y coordenadas de slots
    auto/
      NaryAutoNode.tsx
      NaryAutoToolbar.tsx
      use-nary-auto.ts
    manual/
      NaryManualNode.tsx
      draft.ts
      use-nary-manual.ts
  storage.ts
  share.ts
```

## Modelo puro

Creá `src/playgrounds/nary/model/nary.ts`. No importa React, componentes ni storage.

```ts
// src/playgrounds/nary/model/nary.ts
import { cmpKey, toKey, type Key, type KeyType } from '@/common/types';

export interface NNode {
  id: string;
  key: Key;
  children: NNode[];
}

export interface NaryTree {
  root: NNode | null;
  keyType: KeyType;
  maxChildren: number;
}

export const NARY_MIN = 2;
export const NARY_MAX = 10;

export type NaryStep =
  | { t: 'insert'; key: Key; parent: Key | null; slot: number }
  | { t: 'remove'; key: Key; removed: number }
  | { t: 'duplicate'; key: Key }
  | { t: 'missing'; key: Key };

export function formatStep(step: NaryStep): string {
  switch (step.t) {
    case 'insert':
      return step.parent === null
        ? `insertar ${step.key} como raíz`
        : `insertar ${step.key} como hijo ${step.slot} de ${step.parent}`;
    case 'remove':
      return `quitar ${step.key} y su subárbol (${step.removed} nodos)`;
    case 'duplicate':
      return `${step.key} ya existe`;
    case 'missing':
      return `${step.key} no existe`;
  }
}

let idCounter = 0;

export function makeNode(key: Key): NNode {
  idCounter += 1;
  return { id: `n${Date.now().toString(36)}${idCounter}`, key, children: [] };
}

export function cloneTree(root: NNode | null): NNode | null {
  if (!root) return null;
  return { id: root.id, key: root.key, children: root.children.map(cloneTree) as NNode[] };
}

export function createTree(maxChildren = 3, keyType: KeyType = 'number'): NaryTree {
  return { root: null, keyType, maxChildren };
}

export function countNodes(root: NNode | null): number {
  return root ? 1 + root.children.reduce((acc, child) => acc + countNodes(child), 0) : 0;
}

export function toTreeKey(tree: NaryTree, key: Key): Key {
  return toKey(tree.keyType, key);
}

export function contains(root: NNode | null, key: Key): boolean {
  if (!root) return false;
  if (cmpKey(root.key, key) === 0) return true;
  return root.children.some((child) => contains(child, key));
}

// Camino visitado hasta encontrar la clave. En un árbol sin orden es un DFS:
// si no la encuentra, devuelve los nodos explorados.
export function searchPath(root: NNode | null, key: Key): string[] {
  const path: string[] = [];
  let found = false;

  function walk(node: NNode | null) {
    if (!node || found) return;
    path.push(node.id);
    if (cmpKey(node.key, key) === 0) {
      found = true;
      return;
    }
    for (const child of node.children) {
      walk(child);
      if (found) return;
    }
  }

  walk(root);
  return path;
}

// Inserción por niveles: primer nodo con un slot libre. Es determinista y
// sirve para un árbol general; para un n-ario de búsqueda reemplazá esta regla.
export function insertKeyLogged(
  tree: NaryTree,
  key: Key,
): { tree: NaryTree; steps: NaryStep[]; inserted: boolean } {
  const k = toTreeKey(tree, key);
  if (contains(tree.root, k)) {
    return { tree, steps: [{ t: 'duplicate', key: k }], inserted: false };
  }

  const root = cloneTree(tree.root);
  if (!root) {
    return {
      tree: { ...tree, root: makeNode(k) },
      steps: [{ t: 'insert', key: k, parent: null, slot: 0 }],
      inserted: true,
    };
  }

  const queue: NNode[] = [root];
  for (let i = 0; i < queue.length; i += 1) {
    const node = queue[i];
    if (node.children.length < tree.maxChildren) {
      const child = makeNode(k);
      node.children.push(child);
      return {
        tree: { ...tree, root },
        steps: [{ t: 'insert', key: k, parent: node.key, slot: node.children.length - 1 }],
        inserted: true,
      };
    }
    queue.push(...node.children);
  }

  // Defensivo: con maxChildren >= 1 siempre hay una hoja con lugar.
  return { tree, steps: [], inserted: false };
}

// Borrado de subárbol: simple y explícito. Si preferís reparentar los hijos,
// cambiá esta función y el mensaje del paso.
export function deleteSubtreeLogged(
  tree: NaryTree,
  key: Key,
): { tree: NaryTree; steps: NaryStep[]; deleted: boolean } {
  const k = toTreeKey(tree, key);
  if (!contains(tree.root, k)) {
    return { tree, steps: [{ t: 'missing', key: k }], deleted: false };
  }

  const root = cloneTree(tree.root);
  let removed = 0;

  function remove(node: NNode): NNode | null {
    if (cmpKey(node.key, k) === 0) {
      removed = countNodes(node);
      return null;
    }
    node.children = node.children.map(remove).filter((c): c is NNode => c !== null);
    return node;
  }

  const nextRoot = root ? remove(root) : null;
  return {
    tree: { ...tree, root: nextRoot },
    steps: [{ t: 'remove', key: k, removed }],
    deleted: true,
  };
}
```

Reglas para el modelo:

- No importa `React`, `localStorage`, componentes ni `@/app`.
- No importa el modelo de otro playground. Si algo es realmente común (comparación de claves, validación de grafo), va en `src/common`.
- Las operaciones devuelven un resultado; no mutan el estado que reciben. Cloná antes de modificar.
- Los pasos son datos (`Step`), no strings: el hook los formatea con `formatStep` para el historial. Así se pueden testear y traducir sin tocar la lógica.
- Poné límites en el modelo o en el adaptador de enlaces: cantidad de nodos, profundidad y longitud de claves.

## Validador del editor manual

El validador de un editor manual trabaja sobre un **grafo libre**: los nodos existen en un arreglo y cada slot guarda el id del hijo o `null`. No se asume que el usuario haya construido un árbol correcto; justamente se valida.

`src/common/validate/graph.ts` ya resuelve lo estructural: ids inexistentes, auto-referencia, dos padres, nodos sueltos, ciclos y alcanzabilidad. Usalo antes de las reglas propias.

```ts
// src/playgrounds/nary/model/validate.ts
import type { Key, KeyType } from '@/common/types';
import { checkGraphStructure, type ValidationResult } from '@/common/validate/graph';

export interface NaryManualNode {
  id: string;
  key: Key | null;
  slots: (string | null)[]; // siempre maxChildren posiciones
  x: number;
  y: number;
}

export function validateManualNary(
  nodes: NaryManualNode[],
  rootId: string | null,
  maxChildren: number,
  keyType: KeyType = 'number',
): ValidationResult {
  if (nodes.length === 0) return { valid: true, issues: [] };

  const { byId, issues } = checkGraphStructure(nodes, rootId);
  if (!rootId || !byId.has(rootId)) return { valid: false, issues };

  for (const n of nodes) {
    if (n.slots.length !== maxChildren) {
      issues.push({ nodeId: n.id, message: `Cada nodo debe tener ${maxChildren} punteros.` });
    }
    if (n.key === null) {
      issues.push({ nodeId: n.id, message: 'El nodo no tiene clave.' });
      continue;
    }
    if (typeof n.key !== (keyType === 'string' ? 'string' : 'number')) {
      issues.push({
        nodeId: n.id,
        message: `La clave ${n.key} no es del tipo ${keyType === 'string' ? 'texto' : 'numérico'} del árbol.`,
      });
    } else if (keyType === 'number' && !Number.isInteger(n.key)) {
      issues.push({ nodeId: n.id, message: 'Hay claves no enteras. Usá solo enteros.' });
    }
  }

  const seen = new Map<Key, string>();
  for (const n of nodes) {
    if (n.key === null) continue;
    if (seen.has(n.key)) {
      issues.push({
        nodeId: n.id,
        message: `La clave ${n.key} está repetida en otro nodo. No se permiten duplicados.`,
      });
    } else {
      seen.set(n.key, n.id);
    }
  }

  return { valid: issues.length === 0, issues };
}
```

Buenas prácticas del validador:

- Devolvé `{ valid: true, issues: [] }` para el árbol vacío: el editor vacío es un estado válido.
- Cada `issue` que puedas asociar a un nodo lleva `nodeId`; el editor lo usa para pintar el nodo en rojo (`errorIds`).
- Los mensajes se escriben para el usuario final, en español, y explican el número o la regla incumplida.
- No dupliques los chequeos de `checkGraphStructure`. Si necesitás el mapa de padres o el conjunto de visitados, ya vienen en el resultado.
- Si tu n-ario tiene orden (por ejemplo, claves ordenadas entre hermanos), agregá una pasada con cotas `low`/`high` como hace el validador de Árbol B, y comprobá que las hojas estén al mismo nivel solo si esa es tu regla.

## Storage

Las claves se centralizan en `src/playgrounds/nary/storage.ts`:

```ts
import { createScopedStorage } from '@/common/storage/storage';

export const naryStorage = createScopedStorage('nary');

export const NARY_KEYS = {
  autoTree: naryStorage.key('auto-tree'),
  autoHistory: naryStorage.key('auto-history'),
  autoView: naryStorage.key('auto-view'),
  manual: naryStorage.key('manual-draft'),
  manualView: naryStorage.key('manual-view'),
} as const;
```

Reglas:

- Namespace automático: `arboles:v2:nary:<nombre>`.
- `createScopedStorage` acepta el nombre lógico (`'auto-tree'`) o la clave completa (`NARY_KEYS.autoTree`); no dupliques el namespace.
- Usá `load`/`save` del storage con scope, no `localStorage` directo.
- Lo que se guarda en `autoTree` debe ser exactamente lo que el inicializador del hook sabe leer. Si guardás `{ root, keyType, maxChildren }`, validá los tres al cargar.
- Al guardar automático, limpiá el historial (`naryStorage.save(NARY_KEYS.autoHistory, [])`) cuando corresponda a una restauración de enlace.
- La vista se persiste con `useViewPersistence(NARY_KEYS.autoView, { x: 16, y: 150, k: 1 })`; no escribas la vista en cada `pointermove`.
- No agregues claves al `migrate.ts` global salvo que estés migrando datos de una versión anterior real. Un playground nuevo arranca en v2.

## Adaptador de enlaces

Creá `src/playgrounds/nary/share.ts` con los estados que comparten los hooks:

```ts
export interface NaryAutoState {
  tree: NaryTree;
}

export interface NaryManualState {
  nodes: NaryManualNode[];
  rootId: string | null;
  maxChildren: number;
  keyType: KeyType;
}
```

El adaptador completo, con serialización, hidratación, conversiones y límites, está en [Enlaces compartidos](./06-enlaces-compartidos.md). No lo dejes para el final: `AppShell` lo necesita para el botón Compartir y los hooks lo usan para inicializar el estado.

## Hook del modo automático

Archivo: `src/playgrounds/nary/ui/auto/use-nary-auto.ts`. Es el cerebro del modo automático: recibe el estado guardado o hidratado desde un enlace, expone `tree`, `layout`, `share` y las acciones, y se encarga de la persistencia, el historial y las animaciones. No devuelve JSX ni conoce componentes; la pantalla solo consume su resultado.

```ts
import * as React from 'react';
import type { HistoryItem } from '@/common/components/feedback/HistoryDialog';
import { useViewPersistence } from '@/common/hooks/use-view-persistence';
import { parseKeyList } from '@/common/keys/parse-key-list';
import { useSharedModeState } from '@/common/share/use-shared-mode-state';
import { layoutTree } from '@/common/tree/layout';
import { trackConfig, useToolTracker } from '@/common/analytics';
import type { Key, KeyType } from '@/common/types';
import {
  contains,
  countNodes,
  createTree,
  deleteSubtreeLogged,
  formatStep,
  insertKeyLogged,
  NARY_MAX,
  NARY_MIN,
  searchPath,
  toTreeKey,
  type NNode,
  type NaryTree,
} from '@/playgrounds/nary/model/nary';
import { naryShare, type NaryAutoState } from '@/playgrounds/nary/share';
import { NARY_KEYS as KEYS, naryStorage } from '@/playgrounds/nary/storage';
import { NARY_W } from '@/playgrounds/nary/ui/node-metrics';

export const DEFAULT_MAX_CHILDREN = 3;

export function useNaryAuto() {
  const trackTool = useToolTracker('nary', 'auto');
  const shared = useSharedModeState<NaryAutoState>({ tree: 'nary', mode: 'auto', adapter: naryShare });
  const initial = shared.initial;
  const commit = shared.commit;

  const [tree, setTree] = React.useState<NaryTree>(() => {
    if (initial) return initial.tree;
    const saved = naryStorage.load<{ root: NNode | null; keyType: KeyType; maxChildren: number } | null>(
      KEYS.autoTree,
      null,
    );
    if (
      saved &&
      Number.isInteger(saved.maxChildren) &&
      saved.maxChildren >= NARY_MIN &&
      saved.maxChildren <= NARY_MAX
    ) {
      return {
        root: saved.root ?? null,
        keyType: saved.keyType === 'string' ? 'string' : 'number',
        maxChildren: saved.maxChildren,
      };
    }
    return createTree(DEFAULT_MAX_CHILDREN);
  });

  const [history, setHistory] = React.useState<HistoryItem[]>(() =>
    initial ? [] : naryStorage.load<HistoryItem[]>(KEYS.autoHistory, []),
  );
  const [keyInput, setKeyInput] = React.useState('');
  const [highlight, setHighlight] = React.useState<Set<string>>(new Set());
  const [lastKey, setLastKey] = React.useState<Key | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<KeyType | null>(null);

  const { initialView, handleViewChange } = useViewPersistence(KEYS.autoView, { x: 16, y: 150, k: 1 });

  React.useEffect(() => {
    if (!shared.active) naryStorage.save(KEYS.autoTree, tree);
  }, [tree, shared.active]);

  React.useEffect(() => {
    if (!shared.active) naryStorage.save(KEYS.autoHistory, history.slice(0, 60));
  }, [history, shared.active]);

  React.useEffect(() => {
    commit({ tree });
  }, [tree, commit]);

  function pushHistory(text: string, steps: string[] = []) {
    setHistory((h) => [{ id: Date.now() + Math.random(), text, steps }, ...h].slice(0, 60));
  }

  function parseKeys(): Key[] | null {
    const result = parseKeyList(keyInput, tree.keyType);
    if (!result.ok) {
      setMessage(
        tree.keyType === 'string'
          ? 'Ingresá texto separado por un único separador (,, ., - o espacio).'
          : 'Ingresá un número entero o una lista con un único separador (,, ., - o espacio).',
      );
      return null;
    }
    return result.keys;
  }

  function doInsert() {
    const keys = parseKeys();
    if (!keys) return;
    let next = tree;
    let inserted = 0;
    let duplicates = 0;
    let lastInserted: Key | null = null;

    for (const raw of keys) {
      const key = toTreeKey(next, raw);
      const result = insertKeyLogged(next, key);
      next = result.tree;
      if (!result.inserted) {
        duplicates += 1;
        pushHistory(`insertar ${key} → duplicada`);
        continue;
      }
      inserted += 1;
      lastInserted = key;
      pushHistory(`insertar ${key} → ok`, result.steps.map(formatStep));
    }

    setTree(next);
    setHighlight(new Set());
    setLastKey(lastInserted);
    setMessage(
      keys.length === 1
        ? inserted === 1
          ? `Clave ${keys[0]} insertada.`
          : `La clave ${keys[0]} ya existe.`
        : `${inserted} insertada(s)${duplicates > 0 ? `, ${duplicates} duplicada(s)` : ''}.`,
    );
    setKeyInput('');
    trackTool('insert', { keys: keys.length, inserted, duplicates, key_type: tree.keyType });
  }

  function doDelete() {
    const keys = parseKeys();
    if (!keys) return;
    let next = tree;
    let deleted = 0;
    let missing = 0;

    for (const raw of keys) {
      const key = toTreeKey(next, raw);
      const result = deleteSubtreeLogged(next, key);
      next = result.tree;
      if (result.deleted) {
        deleted += 1;
        pushHistory(`eliminar ${key} → ok`, result.steps.map(formatStep));
      } else {
        missing += 1;
        pushHistory(`eliminar ${key} → no existe`);
      }
    }

    setTree(next);
    setHighlight(new Set());
    setLastKey(null);
    setMessage(
      keys.length === 1
        ? deleted === 1
          ? `Clave ${keys[0]} eliminada.`
          : `La clave ${keys[0]} no existe.`
        : `${deleted} eliminada(s), ${missing} inexistente(s).`,
    );
    setKeyInput('');
    trackTool('delete', { keys: keys.length, deleted, missing });
  }

  function doSearch() {
    const keys = parseKeys();
    if (!keys) return;
    const path = new Set<string>();
    const found: Key[] = [];
    const lost: Key[] = [];

    for (const raw of keys) {
      const key = toTreeKey(tree, raw);
      searchPath(tree.root, key).forEach((id) => path.add(id));
      if (contains(tree.root, key)) {
        found.push(key);
        pushHistory(`buscar ${key} → encontrada`);
      } else {
        lost.push(key);
        pushHistory(`buscar ${key} → no encontrada`);
      }
    }

    setHighlight(path);
    setLastKey(null);
    setMessage(
      keys.length === 1
        ? found.length === 1
          ? `Clave ${keys[0]} encontrada.`
          : `Clave ${keys[0]} no encontrada.`
        : `Encontradas: ${found.join(', ') || 'ninguna'}. No encontradas: ${lost.join(', ') || 'ninguna'}.`,
    );
    trackTool('search', { keys: keys.length, found: found.length, missing: lost.length });
  }

  function doRandom() {
    let key = toTreeKey(tree, 0);
    for (let i = 0; i < 200; i += 1) {
      key = toTreeKey(tree, Math.floor(Math.random() * 100));
      if (!contains(tree.root, key)) break;
    }
    const result = insertKeyLogged(tree, key);
    if (!result.inserted) return;
    setTree(result.tree);
    setLastKey(key);
    pushHistory(`insertar ${key} → ok (aleatorio)`, result.steps.map(formatStep));
    setMessage(`Clave ${key} insertada (aleatorio).`);
    trackTool('random');
  }

  function doClear() {
    setTree({ ...tree, root: null });
    setHighlight(new Set());
    setLastKey(null);
    setMessage('Árbol vaciado.');
    pushHistory('limpiar → árbol vacío');
    trackTool('clear');
  }

  function changeMaxChildren(next: number) {
    const clamped = Math.min(NARY_MAX, Math.max(NARY_MIN, Math.floor(next)));
    if (clamped === tree.maxChildren) return;
    const keys: Key[] = [];
    (function walk(node: NNode | null) {
      if (!node) return;
      keys.push(node.key);
      node.children.forEach(walk);
    })(tree.root);
    let rebuilt = createTree(clamped, tree.keyType);
    for (const key of keys) rebuilt = insertKeyLogged(rebuilt, key).tree;
    setTree(rebuilt);
    setHighlight(new Set());
    setLastKey(null);
    pushHistory(`máximo de hijos n=${clamped} → reconstruido con ${keys.length} claves`);
    trackConfig('max_children', clamped, { playground: 'nary', mode: 'auto' });
  }

  function changeKeyType(next: KeyType) {
    if (next === tree.keyType) return;
    if (countNodes(tree.root) === 0) {
      setTree({ ...tree, keyType: next });
      setHighlight(new Set());
      trackConfig('key_type', next, { playground: 'nary', mode: 'auto' });
      return;
    }
    setConfirmType(next);
  }

  function confirmTypeChange() {
    if (!confirmType) return;
    setTree({ ...tree, root: null, keyType: confirmType });
    setHighlight(new Set());
    setLastKey(null);
    pushHistory(`tipo → ${confirmType === 'string' ? 'texto' : 'numérico'} (árbol vaciado)`);
    trackConfig('key_type', confirmType, { playground: 'nary', mode: 'auto', emptied: true });
    setConfirmType(null);
  }

  const layout = React.useMemo(
    () =>
      layoutTree(tree.root, {
        id: (n) => n.id,
        children: (n) => n.children,
        width: () => NARY_W,
      }),
    [tree.root],
  );

  const share = React.useMemo(() => ({ adapter: naryShare, state: { tree } }), [tree]);

  function openHistory() {
    trackTool('history');
    setShowHistory(true);
  }

  return {
    tree,
    history,
    keyInput,
    setKeyInput,
    highlight,
    lastKey,
    message,
    showHistory,
    setShowHistory,
    confirmClear,
    setConfirmClear,
    confirmType,
    setConfirmType,
    initialView,
    handleViewChange,
    layout,
    share,
    doInsert,
    doDelete,
    doSearch,
    doRandom,
    doClear,
    changeMaxChildren,
    changeKeyType,
    confirmTypeChange,
    openHistory,
  };
}
```

Detalles que importan:

- `initial` se lee una sola vez en el inicializador del estado. No lo pongas en un efecto posterior: el primer render ya debe mostrar el árbol hidratado.
- `commit({ tree })` se llama en un efecto. Es lo que mantiene la copia en memoria si el usuario cambia de modo o guarda.
- Si `shared.active`, no escribas `autoTree` ni `autoHistory` en `localStorage`.
- `layout` con `useMemo` sobre `tree.root`, no sobre `tree` entero si cambiás solo la configuración sin tocar la raíz.
- `share` con `useMemo`: si creás un objeto nuevo en cada render, `AppShell` recalcula `canShare` y el adaptador en cada render.
- El hook devuelve acciones y estado; no devuelve JSX.
- `trackTool` se llama una vez por operación, con cantidades, nunca con las claves.

## Pantalla del modo automático

La «pantalla» es el componente que se registra en el registry y se monta en la ruta `/nary/auto`. No ejecuta el algoritmo: recibe el hook `useNaryAuto`, arma el `AppShell`, el `TreeCanvas`, el nodo, la barra de acciones, el historial y los diálogos. Toda la lógica y la persistencia viven en el hook.

Archivos:

- `src/playgrounds/nary/ui/AutoPlayground.tsx`
- `src/playgrounds/nary/ui/auto/NaryAutoNode.tsx`
- `src/playgrounds/nary/ui/auto/NaryAutoToolbar.tsx`
- `src/playgrounds/nary/ui/node-metrics.ts`

### Medidas del nodo

```ts
export const NARY_W = 120;
export const NARY_H = 56;

export function autoSlotX(x: number, children: number, slot: number): number {
  return x + (NARY_W * (slot + 1)) / (Math.max(1, children) + 1);
}
```

`NARY_MIN` y `NARY_MAX` viven en `model/nary.ts`, junto al rango que valida el adaptador. `getSlotX` devuelve una coordenada **absoluta** del mundo, no relativa al nodo. `edgePath` la usa directamente para el punto de salida de la flecha. Las medidas del editor manual también viven en `node-metrics.ts` y se explican en [Medidas del editor manual](#medidas-del-editor-manual).

### Componente del nodo

```tsx
import { cn } from '@/common/lib/utils';
import type { PlacedNode } from '@/common/tree/layout';
import type { NNode } from '@/playgrounds/nary/model/nary';

interface NaryAutoNodeProps {
  placed: PlacedNode<NNode>;
  hot: boolean;
  isNew: boolean;
}

export function NaryAutoNode({ placed, hot, isNew }: NaryAutoNodeProps) {
  return (
    <div
      data-node
      className={cn(
        'flex h-14 flex-col items-center justify-center rounded-md border bg-card shadow-sm',
        hot
          ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100'
          : 'border-border dark:border-zinc-700',
        isNew && 'bg-emerald-100/60 dark:bg-emerald-950/50',
      )}
    >
      <span className="text-sm font-semibold">{placed.node.key}</span>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {placed.node.children.length} hijo(s)
      </span>
    </div>
  );
}
```

El `data-node` es obligatorio: sin él, el canvas considera que el puntero está sobre el fondo y puede panelear o disparar una herramienta encima del nodo.

### Barra de acciones

```tsx
import { Dices, Eraser, Plus, Search, Trash2 } from 'lucide-react';
import { BottomToolbar } from '@/common/components/controls/BottomToolbar';
import { Input } from '@/common/components/ui/input';
import { ToolbarButton, ToolbarSeparator } from '@/common/components/ui/toolbar';
import type { KeyType } from '@/common/types';

interface NaryAutoToolbarProps {
  keyType: KeyType;
  keyInput: string;
  onKeyInputChange: (value: string) => void;
  onInsert: () => void;
  onDelete: () => void;
  onSearch: () => void;
  onRandom: () => void;
  onClearRequest: () => void;
  onHistory: () => void;
}

export function NaryAutoToolbar(props: NaryAutoToolbarProps) {
  const { keyType, keyInput, onKeyInputChange, onInsert, onDelete, onSearch, onRandom, onClearRequest, onHistory } =
    props;

  return (
    <BottomToolbar label="Acciones del playground automático de árbol n-ario">
      <Input
        value={keyInput}
        onChange={(e) => onKeyInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onInsert();
        }}
        inputMode={keyType === 'string' ? 'text' : 'numeric'}
        placeholder="Claves: 1, 2, 3"
        aria-label="Claves (una sola o lista separada por coma, punto, guion o espacio)"
        className="w-36 min-w-0 max-w-full"
      />
      <ToolbarButton size="sm" onClick={onInsert} title="Insertar" aria-label="Insertar" className="px-2">
        <Plus />
      </ToolbarButton>
      <ToolbarButton size="sm" variant="secondary" onClick={onDelete} title="Eliminar" aria-label="Eliminar" className="px-2">
        <Trash2 />
      </ToolbarButton>
      <ToolbarButton size="sm" variant="outline" onClick={onSearch} title="Buscar" aria-label="Buscar" className="px-2">
        <Search />
      </ToolbarButton>
      <ToolbarSeparator className="mx-0.5 max-[665px]:hidden" />
      <ToolbarButton size="sm" variant="ghost" onClick={onRandom} title="Insertar clave aleatoria">
        <Dices />
        Azar
      </ToolbarButton>
      <ToolbarButton size="sm" variant="ghost" onClick={onClearRequest} title="Vaciar árbol">
        <Eraser />
        Vaciar
      </ToolbarButton>
      <ToolbarButton size="sm" variant="outline" onClick={onHistory}>
        Historial
      </ToolbarButton>
    </BottomToolbar>
  );
}
```

La toolbar siempre va abajo y flotante. No agregues una barra superior para las operaciones.

### Configuración del header

La configuración se pasa a `AppShell` como `config`. Tiene que ser compacta y funcionar en la franja del header y en el `Sheet` superior:

```tsx
import * as React from 'react';
import { KeyTypeSelector } from '@/common/components/controls/KeyTypeSelector';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';
import type { KeyType } from '@/common/types';
import { NARY_MAX, NARY_MIN } from '@/playgrounds/nary/model/nary';

interface NaryConfigProps {
  id: string;
  maxChildren: number;
  onMaxChildrenChange: (value: number) => void;
  keyType: KeyType;
  onKeyTypeChange: (value: KeyType) => void;
}

export function NaryConfig({ id, maxChildren, onMaxChildrenChange, keyType, onKeyTypeChange }: NaryConfigProps) {
  const [draft, setDraft] = React.useState(String(maxChildren));

  React.useEffect(() => {
    setDraft(String(maxChildren));
  }, [maxChildren]);

  function commit(raw: string) {
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isInteger(value)) {
      setDraft(String(maxChildren));
      return;
    }
    const clamped = Math.min(NARY_MAX, Math.max(NARY_MIN, value));
    onMaxChildrenChange(clamped);
    setDraft(String(clamped));
  }

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-2 md:gap-6">
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="shrink-0 text-xs font-normal text-muted-foreground">
          Máx. hijos
        </Label>
        <Input
          id={id}
          type="number"
          min={NARY_MIN}
          max={NARY_MAX}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setDraft(String(maxChildren));
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label="Cantidad máxima de hijos por nodo"
          className="h-8 w-16 px-2 text-center text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted-foreground">Tipo de clave</span>
        <KeyTypeSelector value={keyType} onChange={onKeyTypeChange} />
      </div>
    </div>
  );
}
```

No congeles el cambio de `maxChildren` en cada tecla: el input escribe en un borrador local y llama a `onMaxChildrenChange` en `blur`/Enter. Cambiar la cantidad puede reconstruir el árbol, así que no debe pasar en cada pulsación.

### Composición de la pantalla

```tsx
export function AutoPlayground() {
  const { hidden } = useChrome();
  const auto = useNaryAuto();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="nary"
        mode="auto"
        share={auto.share}
        config={
          <NaryConfig
            id="nary-auto"
            maxChildren={auto.tree.maxChildren}
            onMaxChildrenChange={auto.changeMaxChildren}
            keyType={auto.tree.keyType}
            onKeyTypeChange={auto.changeKeyType}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
        {auto.tree.root === null ? (
          <div className="flex h-full items-center justify-center p-3">
            <p className="text-center text-sm text-muted-foreground">
              El árbol está vacío. Insertá la primera clave desde la barra de abajo.
            </p>
          </div>
        ) : (
          <TreeCanvas
            nodes={auto.layout.nodes}
            edges={auto.layout.edges}
            gridBackground
            highlightIds={auto.highlight}
            getNodeWidth={() => NARY_W}
            getSlotCount={(n) => n.node.children.length}
            getSlotX={(n, slot) => autoSlotX(n.x, n.node.children.length, slot)}
            nodeHeight={NARY_H}
            initialView={auto.initialView}
            onViewChange={auto.handleViewChange}
            renderNode={(placed) => (
              <NaryAutoNode
                placed={placed}
                hot={auto.highlight.has(placed.id)}
                isNew={auto.lastKey !== null && placed.node.key === auto.lastKey}
              />
            )}
          />
        )}
        {auto.message && <CanvasNotice hidden={hidden}>{auto.message}</CanvasNotice>}
        <HistoryDialog open={auto.showHistory} onOpenChange={auto.setShowHistory} history={auto.history} />
      </div>

      <NaryAutoToolbar
        keyType={auto.tree.keyType}
        keyInput={auto.keyInput}
        onKeyInputChange={auto.setKeyInput}
        onInsert={auto.doInsert}
        onDelete={auto.doDelete}
        onSearch={auto.doSearch}
        onRandom={auto.doRandom}
        onClearRequest={() => auto.setConfirmClear(true)}
        onHistory={auto.openHistory}
      />

      {/* Dos ConfirmDialog con el mismo patrón que BTree/AVL: vaciar y cambiar tipo. */}
    </div>
  );
}
```

La configuración se pasa como `config` a `AppShell`; el header la muestra en desktop y el `Sheet` superior en mobile e inmersivo. `NaryConfig` debe ser un fragmento compacto, con `flex flex-wrap`, porque se renderiza en una franja de altura acotada.

## Borrador y hook del modo manual

### Medidas del editor manual

El editor manual comparte `node-metrics.ts` con el automático, pero usa medidas propias: la celda de clave es más ancha y cada nodo suma una columna por cada hijo posible.

```ts
export const MANUAL_KEY_W = 96;
export const MANUAL_SLOT_W = 30;
export const MANUAL_NODE_H = 48;

export function manualNodeWidth(maxChildren: number): number {
  return MANUAL_KEY_W + maxChildren * MANUAL_SLOT_W;
}

export function manualSlotX(x: number, maxChildren: number, slot: number): number {
  return x + MANUAL_KEY_W + slot * MANUAL_SLOT_W + MANUAL_SLOT_W / 2;
}
```

`manualNodeWidth` debe coincidir con el ancho real del componente del nodo en el canvas; si no, el área táctil y las flechas quedan corridas. `manualSlotX` devuelve la coordenada absoluta del centro del slot de salida.

### Borrador del editor

`src/playgrounds/nary/ui/manual/draft.ts` define el estado editable y un seed útil:

```ts
import type { KeyType } from '@/common/types';
import type { NaryManualNode } from '@/playgrounds/nary/model/validate';

export interface NaryManualDraft {
  nodes: NaryManualNode[];
  rootId: string | null;
  maxChildren: number;
  keyType: KeyType;
}

export function uid(): string {
  return `na${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function seed(): NaryManualDraft {
  const root: NaryManualNode = { id: uid(), key: 10, slots: [null, null, null], x: 700, y: 450 };
  const a: NaryManualNode = { id: uid(), key: 5, slots: [null, null, null], x: 350, y: 800 };
  const b: NaryManualNode = { id: uid(), key: 15, slots: [null, null, null], x: 1050, y: 800 };
  root.slots[0] = a.id;
  root.slots[1] = b.id;
  return { nodes: [root, a, b], rootId: root.id, maxChildren: 3, keyType: 'number' };
}

export function fixSlots(slots: (string | null)[], maxChildren: number): (string | null)[] {
  const next = slots.slice(0, maxChildren);
  while (next.length < maxChildren) next.push(null);
  return next;
}
```

Los nodos del editor manual usan `x`/`y` como **esquina superior izquierda** y `slots` de longitud fija `maxChildren`. Si cambiás `maxChildren`, normalizá todos los slots con `fixSlots` y pedí confirmación si vas a descartar punteros.

### Hook del editor manual

`src/playgrounds/nary/ui/manual/use-nary-manual.ts` sigue exactamente el patrón de `useBTreeManual`/`useAvlManual`. El bloque muestra el esqueleto; las operaciones que faltan se definen en el mismo archivo y se listan debajo. Definí `doUndo`/`doRedo` antes del `useManualShortcuts` (o como `function`, que se hoistea):

```ts
export function useNaryManual() {
  const trackTool = useToolTracker('nary', 'manual');
  const shared = useSharedModeState<NaryManualState>({ tree: 'nary', mode: 'manual', adapter: naryShare });
  const initial = shared.initial;
  const commit = shared.commit;

  const [draft, setDraft] = React.useState<NaryManualDraft>(() => {
    if (initial) return initial;
    const saved = naryStorage.load<NaryManualDraft | null>(KEYS.manual, null);
    if (saved && Array.isArray(saved.nodes)) {
      const maxChildren = Math.min(NARY_MAX, Math.max(NARY_MIN, saved.maxChildren || 3));
      return {
        ...saved,
        maxChildren,
        keyType: saved.keyType === 'string' ? 'string' : 'number',
        nodes: saved.nodes.map((n) => ({
          ...n,
          slots: fixSlots(Array.isArray(n.slots) ? n.slots : [], maxChildren),
        })),
      };
    }
    return seed();
  });

  const [linking, setLinking] = React.useState<{ nodeId: string; slot: number } | null>(null);
  const [result, setResult] = React.useState<ValidationResult | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<KeyType | null>(null);
  const { nodes, rootId, maxChildren, keyType } = draft;
  const { setSelectedIds, selectedNodeIds } = useManualSelection(nodes);
  const history = useHistory<NaryManualDraft>();
  const draftRef = React.useRef(draft);
  React.useLayoutEffect(() => {
    draftRef.current = draft;
  });

  React.useEffect(() => {
    if (!shared.active) naryStorage.save(KEYS.manual, draft);
  }, [draft, shared.active]);

  React.useEffect(() => {
    commit(draft);
  }, [draft, commit]);

  useManualShortcuts({
    onEscape: () => setLinking(null),
    onUndo: doUndo,
    onRedo: doRedo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  });

  // Toda mutación pasa por acá: un snapshot al historial, clon del borrador y
  // limpieza del resultado de la validación anterior.
  function update(fn: (d: NaryManualDraft) => NaryManualDraft) {
    history.push(draft);
    setDraft((d) => fn(structuredClone(d)));
    setResult(null);
    setSheetOpen(false);
  }

  function doValidate() {
    const next = validateManualNary(nodes, rootId, maxChildren, keyType);
    setResult(next);
    setSheetOpen(true);
    trackTool('validate', { valid: next.valid, errors: next.issues.length });
  }

  const errorIds = React.useMemo(
    () => new Set((result?.issues ?? []).map((i) => i.nodeId).filter(Boolean) as string[]),
    [result],
  );

  const edges = React.useMemo(
    () =>
      nodes.flatMap((n) =>
        n.slots
          .map((target, slot) => (target ? { from: n.id, to: target, slot } : null))
          .filter((e): e is { from: string; to: string; slot: number } => e !== null),
      ),
    [nodes],
  );

  const share = React.useMemo(() => ({ adapter: naryShare, state: draft }), [draft]);

  return {
    draft,
    draftRef,
    nodes,
    rootId,
    maxChildren,
    keyType,
    linking,
    setLinking,
    setSelectedIds,
    selectedNodeIds,
    result,
    sheetOpen,
    setSheetOpen,
    confirmType,
    setConfirmType,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    errorIds,
    edges,
    update,
    commitDrag: history.push,
    doValidate,
    // ...doUndo, doRedo, changeMaxChildren, changeKeyType, confirmTypeChange,
    // addNodeAt, deleteNode, setRoot, commitKey, startLink, completeLink,
    // removeLink, doClear, deleteSelected, moveNodes, focusKey
    share,
  };
}
```

Las operaciones concretas se copian del patrón existente y se adaptan:

- `addNodeAt(point)`: crea `{ id: uid(), key: null, slots: Array(maxChildren).fill(null), x: point.x - NODE_W / 2, y: point.y - NODE_H / 2 }`; si no hay raíz, la marca.
- `deleteNode(id)`: quita el nodo y limpia cualquier slot que lo apunte; si era la raíz, elige el primer nodo restante o `null`.
- `setRoot(id)`: cambia `rootId`.
- `commitKey(id, raw)`: parsea según `keyType`; vaciar el input deja `key: null`; un valor igual al actual no genera snapshot.
- `startLink/completeLink/removeLink`: mueven `linking` y escriben `slots[slot]`. No permitas un nodo apuntándose a sí mismo; el validador igual lo reporta.
- `deleteSelected`: un solo `update` para que el borrado múltiple sea un paso de historial.
- `moveNodes(origins, dx, dy)`: no pasa por `update` en cada `pointermove`; el snapshot se guarda una vez al soltar (`commitDrag: history.push`).
- `doUndo`/`doRedo`: restauran nodos y raíz, pero conservan el `maxChildren` actual (igual que BTree conserva `p`); si el cambio de configuración también debe deshacerse, guardalo en el snapshot y explicá la decisión.
- `changeMaxChildren`: normaliza slots; si reduce y hay punteros que se pierden, pedí confirmación.
- `changeKeyType`: con claves, pedí confirmación y vaciá las claves (se puede deshacer); sin claves, cambia directo.
- `doClear`: vacía nodos y raíz en un solo paso.
- `focusKey`: busca el input por `data-key-cell` y le da foco.

## Pantalla del modo manual

La «pantalla» es el componente que se monta en `/nary/manual`. No edita el grafo por sí misma: conecta el hook del editor (`useNaryManual`) con las piezas compartidas del editor manual: `useManualCanvas` para vista, herramientas y selección; `useNodeDrag` para arrastrar; y `TreeCanvas`, `ManualToolbar` y `ValidationSheet` para la interfaz.

```tsx
export function ManualPlayground() {
  const { hidden } = useChrome();
  const editor = useNaryManual();
  const canvas = useManualCanvas({
    storageKey: NARY_KEYS.manualView,
    nodes: editor.nodes,
    selectedIds: editor.selectedNodeIds,
    onSelectionChange: editor.setSelectedIds,
    onPlace: editor.addNodeAt,
    getNodeBox: () => ({ width: manualNodeWidth(editor.maxChildren), height: MANUAL_NODE_H }),
    centerOffset: { x: manualNodeWidth(editor.maxChildren) / 2, y: MANUAL_NODE_H / 2 },
  });
  const drag = useNodeDrag({
    nodes: editor.nodes,
    selectedIds: editor.selectedNodeIds,
    setSelectedIds: editor.setSelectedIds,
    viewRef: canvas.viewRef,
    getCurrentNodes: () => editor.draftRef.current.nodes,
    getSnapshot: () => editor.draftRef.current,
    onMove: editor.moveNodes,
    onCommit: editor.commitDrag,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="nary"
        mode="manual"
        share={editor.share}
        config={
          <NaryConfig
            id="nary-manual"
            maxChildren={editor.maxChildren}
            onMaxChildrenChange={editor.changeMaxChildren}
            keyType={editor.keyType}
            onKeyTypeChange={editor.changeKeyType}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
        <TreeCanvas
          nodes={editor.nodes}
          edges={editor.edges}
          gridBackground
          linking={!!editor.linking}
          errorIds={editor.errorIds}
          onBackgroundClick={() => editor.setLinking(null)}
          getNodeWidth={() => manualNodeWidth(editor.maxChildren)}
          getSlotCount={() => editor.maxChildren}
          getSlotX={(node, slot) => manualSlotX(node.x, editor.maxChildren, slot)}
          nodeHeight={MANUAL_NODE_H}
          initialCenter={canvas.initialCenter}
          initialView={canvas.initialView}
          onViewChange={canvas.handleViewChange}
          tool={canvas.activeTool}
          marquee={canvas.marquee}
          renderNode={(node) => (
            <NaryManualNode
              node={node}
              maxChildren={editor.maxChildren}
              keyType={editor.keyType}
              isRoot={node.id === editor.rootId}
              isSelected={editor.selectedNodeIds.has(node.id)}
              isTarget={!!editor.linking && editor.linking.nodeId !== node.id}
              bad={editor.errorIds.has(node.id)}
              linking={editor.linking}
              actions={{
                onPointerDown: drag.onPointerDown,
                onPointerMove: drag.onPointerMove,
                onPointerUp: drag.onPointerUp,
                onFocusKey: editor.focusKey,
                onSetRoot: editor.setRoot,
                onDeleteNode: editor.deleteNode,
                onStartLink: editor.startLink,
                onRemoveLink: editor.removeLink,
                onCompleteLink: editor.completeLink,
                onCommitKey: editor.commitKey,
              }}
            />
          )}
        />
        {editor.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
            <p className="text-center text-sm text-muted-foreground">
              No hay nodos. Elegí la herramienta Nodo y tocá el canvas.
            </p>
          </div>
        )}
        {editor.linking && (
          <CanvasNotice hidden={hidden}>
            Tocá el icono <ArrowDownToLine className="inline size-3.5" /> del nodo destino · Esc o fondo para cancelar
          </CanvasNotice>
        )}
      </div>

      <ManualToolbar
        label="Acciones del editor manual de árbol n-ario"
        onValidate={editor.doValidate}
        onClear={editor.doClear}
        onUndo={editor.doUndo}
        onRedo={editor.doRedo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        linking={!!editor.linking}
        onCancelLink={() => editor.setLinking(null)}
        selectedCount={editor.selectedNodeIds.size}
        onDeleteSelected={editor.deleteSelected}
        panTool={canvas.panTool}
        nodeTool={canvas.nodeTool}
        selectionTool={canvas.selectionTool}
        activeId={canvas.activeId}
        onToggleTool={canvas.toggleTool}
      />

      <ValidationSheet
        open={editor.sheetOpen}
        onOpenChange={editor.setSheetOpen}
        result={editor.result}
        successMessage={`El árbol cumple las reglas con n = ${editor.maxChildren}.`}
        errorHint="Revisá los nodos marcados en rojo."
      />

      {/* ConfirmDialog de cambio de tipo, con el mismo patrón que BTree/AVL. */}
    </div>
  );
}
```

El nodo manual tiene que respetar este contrato:

- Raíz `div` con `data-node`, ancho `manualNodeWidth(maxChildren)` y alto `MANUAL_NODE_H`.
- Barra superior de arrastre con `cursor-move` y `touch-none`; el `onPointerDown` de arrastre se ignora si el objetivo es un `input` o un `button`.
- Input de clave con `data-key-cell={node.id}`, `defaultValue={node.key ?? ''}` y una `key` que cambie cuando cambia el valor (el proyecto usa ``key={`${node.id}-${node.key ?? 'empty'}`}`` para remontar el input después de un commit).
- `onBlur` hace el commit de la celda. Enter hace `blur()`. Vaciar la celda borra la clave.
- Un botón por slot: si está libre, inicia linking; si está conectado, quita el puntero. En modo linking, el nodo destino muestra el botón "Conectar aquí".
- Los slots inactivos (más allá de `maxChildren`) no existen en el DOM. Si tu diseño muestra una tabla fija, los slots extra son inertes.
- El nodo destino y el nodo con error necesitan un estilo claro; no dependas solo del color: agregá `title` o texto.

## Registry y rutas

En `src/app/registry.ts`:

```ts
const NaryAuto = lazy(() =>
  import('@/playgrounds/nary/ui/AutoPlayground').then((m) => ({ default: m.AutoPlayground })),
);
const NaryManual = lazy(() =>
  import('@/playgrounds/nary/ui/ManualPlayground').then((m) => ({ default: m.ManualPlayground })),
);

export const PLAYGROUNDS: PlaygroundDefinition[] = [
  // ...
  {
    id: 'nary',
    title: 'Árbol n-ario',
    short: 'N',
    description: 'Visualizá y practicá árboles con más de dos hijos por nodo, con inserción por niveles y validación.',
    modes: {
      auto: { label: 'Automático', icon: Sparkles, component: NaryAuto },
      manual: { label: 'Manual', icon: PencilRuler, component: NaryManual },
    },
  },
];
```

Con eso `App.tsx` genera `/nary/auto` y `/nary/manual`, el header y los menús muestran el playground y la landing lo lista. No agregues rutas a mano en `App.tsx`.

## SEO, sitemap y textos

El registry no genera el SEO. Completá:

1. `src/app/seo.ts`: agregá `nary/auto` y `nary/manual` a `PLAYGROUND_META` con `title`, `description` y `canonical`. Si falta, `resolvePageMeta` cae en `HOME_META` y el canonical queda mal.
2. `src/app/seo.ts` `HOME_META` y `NOT_FOUND_META`: actualizá el título y la descripción generales si el nuevo playground pasa a ser parte de la propuesta principal.
3. `index.html`: título, `description`, `keywords`, `og:*`, `twitter:*` y JSON-LD. Es el HTML que ven los crawlers antes de que React monte.
4. `public/sitemap.xml`: agregá las dos rutas nuevas con prioridad `0.9` (auto) y `0.8` (manual). El build **no** agrega rutas de playground: solo completa las de `docs/`. Si faltan, `scripts/sitemap.mjs` falla.
5. `src/landing/sections/StructuresSection.tsx`: si el n-ario estaba como "previsto", cambialo a disponible y actualizá el texto.
6. `src/landing/sections/AboutSection.tsx`, `HeroSection.tsx` y `LandingFooter.tsx`: los textos que dicen "B y AVL" quedan desactualizados.
7. `README.md` y `docs/01-introduccion.md`: la lista de estructuras y las rutas.
8. `src/landing/components/PlaygroundPreview.tsx`: hoy elige el arte por `id`; un id nuevo cae en `NaryArt`, que es lo esperado para n-ario, pero si el arte no corresponde, agregá la rama.
9. `src/docs/DocsIndex.tsx` no necesita cambios: las páginas se descubren solas.

La página de documentación nueva no se agrega al sitemap a mano: `scripts/sitemap.mjs` lee `docs/*.md`, calcula el slug y completa `dist/sitemap.xml`. Sí conviene enlazarla desde `docs/README.md`.

## Verificación del playground

Antes de dar por terminado:

- **Automático**: insertar una clave, insertar una lista, duplicado, eliminar existente, eliminar inexistente, buscar encontrada y no encontrada, azar, vaciar, historial con pasos.
- **Configuración**: cambiar `maxChildren` reconstruye el árbol y no deja nodos con más hijos que el máximo; cambiar tipo con claves pide confirmación y vacía; con árbol vacío cambia directo.
- **Manual**: crear nodo, escribir clave, borrar clave vaciando la celda, marcar raíz, crear puntero, quitar puntero, conectar a destino, cancelar con Esc/fondo, arrastrar uno y varios, undo/redo, borrado múltiple, limpiar.
- **Validar**: árbol vacío válido; nodo sin clave; dos padres; ciclo; nodo suelto; clave duplicada; tipo incorrecto; más hijos que `maxChildren`; mensajes y nodos en rojo.
- **Canvas**: nodo no arrastra el fondo, paneo con fondo, zoom con rueda/Ctrl, pinch, `Ctrl+0`, recentrar.
- **Persistencia**: recargar conserva árbol, `maxChildren`, tipo, historial y vista; el manual conserva posiciones y slots.
- **Enlaces**: compartir desde ambos modos, abrir en pestaña nueva, cambiar de modo conserva las copias, guardar solo auto/manual/ambos, aviso cuando había datos, reconstrucción degradada cuando el manual es inválido.
- **Responsive**: 320 px, 640 px, desktop; toolbar inferior; sheet de configuración; modo inmersivo.
- **Tema**: claro y oscuro.
- **Analítica**: eventos sin claves; `playground_open` sale del registry; `tool_use` y `config_change` con el id correcto.

Después:

```bash
npm run lint
npm run build
npm run preview
```

## Errores comunes

| Síntoma | Causa probable |
| --- | --- |
| El nodo no se puede arrastrar y el canvas se mueve | Falta `data-node` en la raíz del nodo |
| Las flechas salen corridas | `getSlotX` devuelve una coordenada relativa o no coincide con las columnas del nodo |
| El recentrado y el zoom ignoran parte del nodo | `getNodeWidth`/`nodeHeight` no coinciden con el tamaño real |
| El árbol compartido no muestra el modo manual | `hydrate` no devuelve `manual`, o `layoutManual` usa mal `layoutTree` |
| El enlace no se puede compartir | `isEmpty` devuelve `true` o `serialize` devuelve `null` |
| Al abrir el enlace no aparece el árbol | El estado inicial no usa `shared.initial` en el primer render |
| El enlace pisa lo guardado | `hasSavedData` no revisa las claves reales del playground |
| El build falla por el sitemap | Faltan las rutas del playground en `public/sitemap.xml` |
| La ruta nueva no tiene título propio | Falta la entrada en `PLAYGROUND_META` de `seo.ts` |
| El historial no deshace el arrastre | El snapshot se guarda en cada `pointermove` o no se guarda al soltar |
| El undo restaura referencias compartidas | No se clonó con `structuredClone` |

## Relacionado

- [Convenciones y calidad](./03-convenciones-y-calidad.md)
- [Herramientas del canvas](./05-herramientas-del-canvas.md)
- [Enlaces compartidos](./06-enlaces-compartidos.md)
