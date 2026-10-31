# Enlaces compartidos

Un enlace compartido lleva el árbol completo en la URL. No hay backend ni cuentas: el receptor abre el enlace, el playground hidrata una copia en memoria y puede explorar o editar ambos modos. El guardado automático se desactiva si ya había datos guardados, para no pisarlos.

La implementación vive en `src/common/share/` y en el `share.ts` de cada playground. Esta página explica el contrato completo y cómo integrar un playground nuevo.

## Comportamiento visible

- El botón **Compartir** del header serializa el modo actual y arma la URL.
- Si el navegador soporta `navigator.share`, se intenta la hoja nativa; si no, se abre el diálogo con copiar y redes.
- Al abrir un enlace, se hidratan **dos copias independientes**, una por modo, a partir de la misma representación.
- Cambiar de modo conserva el `?shared=...` y las ediciones de cada copia.
- Si ninguno de los dos modos tenía datos guardados, las dos copias se guardan solas, se limpia la URL y no se muestra ningún aviso.
- Si al menos uno tenía datos, aparece un aviso no descartable que se puede minimizar a un banner arriba a la derecha. Guardar exige elegir explícitamente automático, manual o ambos.
- Mientras la sesión está activa no se escribe en `localStorage` el árbol, la configuración ni el historial. Vista, tema, velocidad y ajustes sí se persisten.
- Si el enlace viene del modo manual y su grafo no es un árbol válido, la copia automática se reconstruye insertando sus claves. Se muestra un aviso de duración infinita que el usuario debe descartar.
- `beforeunload` solo se activa si hay cambios sin guardar.

## Formato de la URL

```
/<tree>/<mode>?shared=1&tree=<id>&mode=<auto|manual>
  &keyType=<number|string>[&order=<p>]&nodes=<lz-base64url>
```

| Parámetro | Significado |
| --- | --- |
| `shared` | Versión del formato. Hoy `1`. `parseShareSearch` la exige exactamente. |
| `tree` | Id del playground (`btree`, `avl`, `nary`, ...). |
| `mode` | Modo de origen; indica cómo interpretar `nodes`. |
| `keyType` | `number` o `string`. Obligatorio. |
| `order` | Solo Árbol B. Entero `>= 2`. No lo reutilices para otra configuración. |
| `nodes` | JSON del adaptador comprimido con LZString y convertido a base64url. |

`codec.ts` define:

- `SHARE_VERSION = '1'`.
- `LONG_URL_WARNING = 1800`: a partir de acá algunas apps pueden truncar el enlace.
- `MAX_COMPRESSED_LENGTH = 24_000`: límite defensivo del parámetro.
- `MAX_DECOMPRESSED_LENGTH = 2_000_000`: límite contra bombas de descompresión.
- `encodeNodes` / `decodeNodes`: `JSON.stringify` → `compressToBase64` → base64url y vuelta.
- `buildShareQuery(link)`: arma la query o devuelve `null` si el árbol no se puede codificar.
- `parseShareSearch(search)`: valida versión, parámetros, modo, tipo, `order` y decodifica. Devuelve `null` si algo no cierra.

LZString es **síncrono** a propósito: el click de compartir conserva la activación de usuario que exige `navigator.share`. No cambies la serialización por una promesa.

## La sesión

`SharedSessionProvider` (`session.tsx`) envuelve la app en `App.tsx`. La sesión vive solo en memoria:

```
pending  → el enlace se está registrando
protected → había datos guardados; hay que decidir si guardar
done     → se guardó o se cerró la sesión
idle     → no hay enlace
```

Flujo:

1. `AppFrame` observa `resetKey` y la query. Al aparecer un enlace, las rutas se remontan para que cada playground inicialice su estado desde la sesión.
2. `useSharedModeState` detecta que el enlace es de su playground y que el modo todavía no está en memoria; llama a `adapter.hydrate`.
3. `session.register` guarda los estados de ambos modos, calcula un fingerprint de cada uno y anota los modos degradados.
4. Si `adapter.hasSavedData` es `false` para los dos modos, guarda ambos, limpia la URL y termina. Si es `true` para alguno, pasa a `protected` y muestra el aviso.
5. Cada hook llama a `commit(state)` en un efecto. Mientras está `protected`, `commit` actualiza la copia en memoria y marca `dirty` si el estado difiere del baseline.
6. Guardar llama a `adapter.save` para los modos elegidos, limpia el historial del modo guardado y cierra la sesión. Si falla, muestra un toast y no cierra.
7. Cambiar de modo mantiene la query (`modeSearch = session.active ? location.search : ''`), así que la otra copia se hidrata desde la misma sesión.

No escribas en el estado de la sesión desde un playground. La API es `useSharedModeState` y `useSharedSession`; el resto es interno.

## El adaptador

Cada playground implementa `PlaygroundShareAdapter` (`src/common/share/types.ts`):

```ts
export interface PlaygroundShareAdapter {
  serialize: (mode: Mode, state: unknown) => SharedTreeData | null;
  hydrate: (mode: Mode, data: SharedTreeData) => HydratedModes | null;
  hasSavedData: (mode: Mode) => boolean;
  save: (mode: Mode, state: unknown) => boolean;
  isEmpty: (mode: Mode, state: unknown) => boolean;
}
```

| Método | Contrato |
| --- | --- |
| `serialize` | Convierte el estado actual del modo a `{ keyType, order?, nodes }`. Devuelve `null` si no hay nada que compartir o si el estado es inválido. Debe ser puro y síncrono; no puede lanzar. |
| `hydrate` | Recibe el modo de origen y los datos neutros, y devuelve `{ auto, manual }`, dos copias independientes. Devuelve `null` si el enlace es corrupto o no se puede reconstruir. Puede marcar `degraded`. |
| `hasSavedData` | Revisa las claves reales de `storage.ts` y devuelve `true` solo si hay datos no vacíos. Es la diferencia entre autoguardar y proteger lo existente. |
| `save` | Persiste el estado de un modo en las claves del playground y limpia el historial si corresponde. Devuelve `true`/`false`; no lanza. |
| `isEmpty` | ¿El estado no tiene nada que valga la pena compartir? `AppShell` lo usa para habilitar el botón Compartir. Debe ser coherente con `serialize`. |

`SharedTreeData`:

```ts
export interface SharedTreeData {
  keyType: KeyType;
  order?: number; // solo Árbol B
  nodes: unknown; // formato propio del adaptador
}
```

`HydratedModes`:

```ts
export interface HydratedModes {
  auto: unknown;
  manual: unknown;
  degraded?: Mode[];
}
```

`degraded: ['auto']` significa: "el modo automático no pudo cargar la estructura del manual y se reconstruyó con las mismas claves". La sesión muestra el aviso infinito una vez.

## Integrar un playground

### 1. Estados compartidos

En `src/playgrounds/nary/share.ts`:

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

Los estados deben coincidir exactamente con lo que devuelven los hooks en `share.state` y con lo que espera `useSharedModeState<T>`. Si el hook agrega `maxChildren` al estado, el adaptador lo tiene que serializar.

### 2. Adaptador completo

El siguiente es un adaptador funcional para el ejemplo n-ario. Incluye límites, tipos, IDs, referencias y conversiones.

```ts
// src/playgrounds/nary/share.ts
import { cmpKey, isValidKey, type Key, type KeyType } from '@/common/types';
import type { HydratedModes, PlaygroundShareAdapter, SharedTreeData } from '@/common/share/types';
import { layoutTree } from '@/common/tree/layout';
import {
  createTree,
  insertKeyLogged,
  NARY_MAX,
  NARY_MIN,
  type NNode,
  type NaryTree,
} from '@/playgrounds/nary/model/nary';
import { validateManualNary, type NaryManualNode } from '@/playgrounds/nary/model/validate';
import { NARY_KEYS, naryStorage } from '@/playgrounds/nary/storage';
import { manualNodeWidth } from '@/playgrounds/nary/ui/node-metrics';

const MAX_NODES = 5000;
const MAX_DEPTH = 2000;

type SerializedAutoNode = [Key, SerializedAutoNode[]];

interface SerializedAuto {
  kind: 'auto';
  maxChildren: number;
  root: SerializedAutoNode | null;
}

interface SerializedManual {
  kind: 'manual';
  maxChildren: number;
  rootId: string | null;
  nodes: Array<[string, Key | null, (string | null)[], number, number]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validKey(keyType: KeyType, value: unknown): value is Key {
  return (typeof value === 'number' || typeof value === 'string') && isValidKey(keyType, value);
}

function validMaxChildren(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= NARY_MIN && value <= NARY_MAX;
}

function serializeNode(node: NNode | null): SerializedAutoNode | null {
  if (!node) return null;
  return [node.key, node.children.map(serializeNode).filter((c): c is SerializedAutoNode => c !== null)];
}

function parseAutoNode(
  value: unknown,
  keyType: KeyType,
  maxChildren: number,
  nextId: { n: number },
  depth: number,
): NNode | null {
  if (nextId.n >= MAX_NODES || depth > MAX_DEPTH) return null;
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [rawKey, rawChildren] = value;
  if (!validKey(keyType, rawKey) || !Array.isArray(rawChildren)) return null;
  if (rawChildren.length > maxChildren) return null;

  nextId.n += 1;
  const id = `s${nextId.n}`;
  const children = rawChildren.map((child) => parseAutoNode(child, keyType, maxChildren, nextId, depth + 1));
  if (children.some((child) => child === null)) return null;
  return { id, key: rawKey, children: children as NNode[] };
}

function parseAuto(value: unknown, keyType: KeyType): NaryTree | null {
  if (!isRecord(value) || value.kind !== 'auto' || !validMaxChildren(value.maxChildren)) return null;
  if (value.root === null) return createTree(value.maxChildren, keyType);

  const root = parseAutoNode(value.root, keyType, value.maxChildren, { n: 0 }, 0);
  if (!root) return null;

  const tree: NaryTree = { root, keyType, maxChildren: value.maxChildren };
  // Reutiliza el validador del editor manual: el enlace solo reconstruye un
  // árbol que cumple las reglas del playground.
  const check = layoutManual({ tree });
  if (!validateManualNary(check.nodes, check.rootId, tree.maxChildren, keyType).valid) return null;
  return tree;
}

function parseManual(value: unknown, keyType: KeyType): NaryManualState | null {
  if (!isRecord(value) || value.kind !== 'manual' || !Array.isArray(value.nodes)) return null;
  if (!validMaxChildren(value.maxChildren)) return null;
  if (value.nodes.length > MAX_NODES) return null;

  const maxChildren = value.maxChildren;
  const ids = new Set<string>();
  const nodes: NaryManualNode[] = [];

  for (const raw of value.nodes) {
    if (!Array.isArray(raw) || raw.length !== 5) return null;
    const [id, rawKey, rawSlots, rawX, rawY] = raw;
    if (typeof id !== 'string' || ids.has(id)) return null;

    let key: Key | null = null;
    if (rawKey !== null) {
      if (!validKey(keyType, rawKey)) return null;
      key = rawKey;
    }

    if (!Array.isArray(rawSlots) || rawSlots.length !== maxChildren) return null;
    const slots = rawSlots.filter((s): s is string | null => s === null || typeof s === 'string');
    if (slots.length !== rawSlots.length) return null;
    if (typeof rawX !== 'number' || !Number.isFinite(rawX)) return null;
    if (typeof rawY !== 'number' || !Number.isFinite(rawY)) return null;

    ids.add(id);
    nodes.push({ id, key, slots, x: rawX, y: rawY });
  }

  const rootId = typeof value.rootId === 'string' && ids.has(value.rootId) ? value.rootId : null;
  if (nodes.length > 0 && !rootId) return null;
  for (const n of nodes) {
    for (const slot of n.slots) {
      if (slot !== null && !ids.has(slot)) return null;
    }
  }
  return { nodes, rootId, maxChildren, keyType };
}

function layoutManual(state: NaryAutoState): NaryManualState {
  const { tree } = state;
  const layout = layoutTree(tree.root, {
    id: (n) => n.id,
    children: (n) => n.children,
    width: () => manualNodeWidth(tree.maxChildren),
  });

  return {
    nodes: layout.nodes.map((placed) => {
      const slots: (string | null)[] = placed.node.children.map((child) => child.id);
      while (slots.length < tree.maxChildren) slots.push(null);
      return {
        id: placed.id,
        key: placed.node.key,
        slots,
        x: placed.x,
        y: placed.y,
      };
    }),
    rootId: tree.root?.id ?? null,
    maxChildren: tree.maxChildren,
    keyType: tree.keyType,
  };
}

function manualToAuto(state: NaryManualState): { tree: NaryTree; degraded: boolean } {
  const { nodes, rootId, maxChildren, keyType } = state;
  if (nodes.length === 0 || !rootId) return { tree: createTree(maxChildren, keyType), degraded: false };

  const valid = validateManualNary(nodes, rootId, maxChildren, keyType).valid;
  if (valid && rootId) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const build = (id: string, depth: number): NNode | null => {
      const n = byId.get(id);
      if (!n || n.key === null || depth > MAX_DEPTH) return null;
      const children = n.slots
        .filter((slot): slot is string => slot !== null)
        .map((slot) => build(slot, depth + 1));
      if (children.some((child) => child === null)) return null;
      return { id, key: n.key, children: children as NNode[] };
    };
    const root = build(rootId, 0);
    if (root) return { tree: { root, keyType, maxChildren }, degraded: false };
  }

  // Copia canónica: todas las claves válidas, en orden determinista.
  const keys = [...new Set(nodes.map((n) => n.key).filter((k): k is Key => k !== null))].sort(cmpKey);
  let tree = createTree(maxChildren, keyType);
  for (const key of keys) tree = insertKeyLogged(tree, key).tree;
  return { tree, degraded: true };
}

export const naryShare: PlaygroundShareAdapter = {
  serialize(mode, state) {
    if (mode === 'auto') {
      const s = state as NaryAutoState;
      if (!s?.tree || !validMaxChildren(s.tree.maxChildren)) return null;
      return {
        keyType: s.tree.keyType,
        nodes: {
          kind: 'auto',
          maxChildren: s.tree.maxChildren,
          root: serializeNode(s.tree.root),
        } satisfies SerializedAuto,
      };
    }

    const s = state as NaryManualState;
    if (!s || !validMaxChildren(s.maxChildren) || !Array.isArray(s.nodes)) return null;
    if (s.nodes.length > MAX_NODES) return null;

    return {
      keyType: s.keyType,
      nodes: {
        kind: 'manual',
        maxChildren: s.maxChildren,
        rootId: s.rootId,
        nodes: s.nodes.map((n) => [n.id, n.key, [...n.slots], Math.round(n.x), Math.round(n.y)]),
      } satisfies SerializedManual,
    };
  },

  hydrate(mode, data: SharedTreeData): HydratedModes | null {
    if (mode === 'auto') {
      const auto = parseAuto(data.nodes, data.keyType);
      if (!auto) return null;
      return { auto: { tree: auto }, manual: layoutManual({ tree: auto }) };
    }

    const manual = parseManual(data.nodes, data.keyType);
    if (!manual) return null;
    const { tree, degraded } = manualToAuto(manual);
    return { auto: { tree }, manual, degraded: degraded ? ['auto'] : undefined };
  },

  hasSavedData(mode) {
    if (mode === 'auto') {
      const saved = naryStorage.load<{ root: NNode | null } | null>(NARY_KEYS.autoTree, null);
      return !!saved?.root;
    }
    const saved = naryStorage.load<NaryManualState | null>(NARY_KEYS.manual, null);
    return !!saved && Array.isArray(saved.nodes) && saved.nodes.some((n) => n.key !== null);
  },

  save(mode, state) {
    try {
      if (mode === 'auto') {
        const s = state as NaryAutoState;
        naryStorage.save(NARY_KEYS.autoTree, s.tree);
        naryStorage.save(NARY_KEYS.autoHistory, []);
      } else {
        naryStorage.save(NARY_KEYS.manual, state as NaryManualState);
      }
      return true;
    } catch {
      return false;
    }
  },

  isEmpty(mode, state) {
    if (mode === 'auto') return !(state as NaryAutoState)?.tree?.root;
    const s = state as NaryManualState;
    return !s?.nodes || !s.nodes.some((n) => n.key !== null);
  },
};
```

Puntos clave del ejemplo:

- `maxChildren` viaja **dentro de `nodes`**, no en `order`. `order` es de Árbol B y no debe reutilizarse.
- El modo automático no guarda posiciones: el layout se recalcula desde el árbol.
- El modo manual guarda posiciones redondeadas y los slots; el layout del automático se recalcula al hidratar.
- `parseAuto` reconstruye IDs (`s1`, `s2`, ...). No confíes en los IDs de la URL para el árbol automático.
- `parseManual` conserva los IDs porque los punteros dependen de ellos. Verifica que no estén repetidos y que todas las referencias existan.
- `parseAuto` valida con el mismo validador que el editor manual. Si el enlace no representa un árbol válido, se rechaza en lugar de mostrar algo inconsistente.
- `manualToAuto` tiene dos caminos: si el grafo es válido, lo convierte; si no, reconstruye con las claves y marca `degraded`.
- `layoutManual` devuelve dos copias independientes: no comparte nodos con el árbol automático.
- Los límites (`MAX_NODES`, `MAX_DEPTH`) están en el adaptador, no en el componente. La URL es entrada de usuario.

### 3. Hooks

En cada modo:

```ts
const shared = useSharedModeState<NaryAutoState>({
  tree: 'nary',
  mode: 'auto',
  adapter: naryShare,
});
const initial = shared.initial;

const [tree, setTree] = React.useState<NaryTree>(() => initial?.tree ?? loadSavedTree());

React.useEffect(() => {
  shared.commit({ tree });
}, [tree, shared.commit]);
```

Y la guarda de persistencia:

```ts
React.useEffect(() => {
  if (!shared.active) naryStorage.save(NARY_KEYS.autoTree, tree);
}, [tree, shared.active]);

React.useEffect(() => {
  if (!shared.active) naryStorage.save(NARY_KEYS.autoHistory, history.slice(0, 60));
}, [history, shared.active]);
```

Repetí exactamente el patrón en el manual. Mientras `shared.active` sea `true`, no se escribe el árbol, `maxChildren`, el tipo ni el historial. La vista y el tema sí se guardan.

### 4. AppShell

La pantalla pasa el adaptador y el estado actual:

```tsx
const share = React.useMemo(() => ({ adapter: naryShare, state: { tree } }), [tree]);

<AppShell
  playgroundId="nary"
  mode="auto"
  share={share}
  config={<NaryConfig ... />}
/>
```

`AppShell` calcula `canShare = !!share && !share.adapter.isEmpty(mode, share.state)`, arma la URL con `useShareActions` y muestra el aviso y el diálogo de guardado. No dupliques esos botones ni el aviso en la pantalla.

En el manual:

```tsx
const share = React.useMemo(() => ({ adapter: naryShare, state: draft }), [draft]);
```

Si `share` se crea nuevo en cada render, no rompe, pero hace trabajo innecesario. Memorizalo.

### 5. Guardar y hasSavedData

`hasSavedData` y `save` tienen que hablar de las **mismas claves**:

- Si el hook guarda el árbol automático en `NARY_KEYS.autoTree`, `hasSavedData('auto')` lee esa clave.
- Si el hook guarda el borrador manual en `NARY_KEYS.manual`, `hasSavedData('manual')` lee esa clave.
- `save('auto')` guarda el estado con la forma que el inicializador sabe leer y limpia `autoHistory`.
- `save('manual')` guarda el borrador completo (nodos, raíz, `maxChildren`, tipo).

Un `hasSavedData` que devuelve `false` cuando había datos hace que el enlace los pise sin aviso. Uno que devuelve `true` cuando no hay nada molesta con un aviso innecesario. Probá los dos caminos.

### 6. isEmpty y serialize

`isEmpty` y `serialize` deben coincidir:

- Si `isEmpty` es `true`, `serialize` no se llama y el botón está deshabilitado.
- Si `isEmpty` es `false` pero `serialize` devuelve `null`, el usuario ve "No se pudo preparar el árbol para compartirlo".
- Si `serialize` devuelve un JSON demasiado grande, `buildShareQuery` devuelve `null` y el usuario ve "El árbol es demasiado grande".

Para n-ario, "vacío" es raíz `null` en automático y ningún nodo con clave en manual. Un nodo sin clave pero con hijos no es "vacío" desde el punto de vista del editor, pero `serialize` puede rechazarlo si el estado no es válido; definí la regla y probala.

## Reglas de hidratación

La URL es hostil. El adaptador no puede confiar en nada:

- Validá `kind`, `maxChildren`, `rootId`, longitudes, tipos y coordenadas.
- Rechazá IDs repetidos y referencias a IDs inexistentes.
- Rechazá más hijos que `maxChildren`.
- Rechazá claves del tipo incorrecto y, en modo numérico, no enteras.
- Rechazá duplicados globales.
- Rechazá ciclos, dos padres y nodos inalcanzables. `checkGraphStructure` ya lo hace para el manual; para el automático, validá después de layoutear.
- Poné un tope de nodos y de profundidad. No confíes en el largo del JSON: `MAX_DECOMPRESSED_LENGTH` es una primera barrera, no la única.
- No mutés `data` ni devuelvas el mismo objeto para `auto` y `manual`. Si compartís referencias, editar un modo cambia el otro.
- Regenerá IDs en el automático; conservalos en el manual.
- Si no podés reconstruir, devolvé `null`; la sesión muestra "No se pudo reconstruir el árbol de este enlace" y limpia la URL.

### Degradado

El degradado es solo para el paso manual → automático. Si el grafo manual no cumple las reglas, el automático no puede cargarlo tal cual, pero sí puede reconstruirse insertando todas las claves en orden. En ese caso:

```ts
return { auto: { tree }, manual, degraded: degraded ? ['auto'] : undefined };
```

La sesión muestra un aviso de duración infinita. No lo omitas: el árbol que ve el receptor no es exactamente el que se compartió y tiene que saberlo.

Si el enlace es automático y el árbol no valida, no hay degradado posible: devolvé `null`. Un árbol automático inválido es un enlace corrupto o una versión incompatible.

## Extender el formato

Para una configuración nueva:

1. Si es específica del playground, guardala **dentro de `nodes`**, como `maxChildren` en el ejemplo. No agregues parámetros globales si no son necesarios.
2. Si realmente es transversal (por ejemplo, una versión de layout), agregala a `SharedTreeData`, a `buildShareQuery`/`parseShareSearch` y a todos los adaptadores que la usen. Mantené compatibilidad: los parámetros nuevos deben ser opcionales y tener un default claro.
3. Si el cambio es incompatible con los enlaces existentes, subí `SHARE_VERSION` y aceptá que los enlaces viejos se rechacen con el aviso de enlace dañado. No cambies el significado de `shared=1` en silencio.
4. Actualizá el comentario de cabecera de `codec.ts` y esta página.
5. No agregues datos personales ni claves en parámetros separados: el árbol va en `nodes`.

## Probar enlaces

1. **Roundtrip automático**: construí un árbol, `serialize('auto', state)`, `hydrate('auto', data)`, compará claves, estructura y `maxChildren`.
2. **Roundtrip manual**: mismos nodos, posiciones, raíz y slots; `hydrate('manual', data)` debe devolver un manual equivalente y un automático independiente.
3. **Enlace inválido**: versión distinta, falta `keyType`, `mode` inválido, `nodes` corrupto, ID repetido, slot inexistente, ciclo, dos padres, clave de otro tipo, más hijos que `maxChildren`, nodo gigante. Cada caso debe terminar en toast y URL limpia, sin crash.
4. **Sin datos guardados**: limpiá `localStorage`, abrí el enlace. Debe guardar ambos, limpiar la URL y no mostrar diálogo.
5. **Con datos guardados**: guardá un árbol distinto, abrí el enlace. Debe aparecer el aviso; cambiar de modo debe conservar las copias; editar debe marcar dirty; guardar auto/manual/ambos debe escribir solo lo elegido y limpiar el historial del modo guardado.
6. **Degradado**: compartí un manual inválido (por ejemplo, con un ciclo) y abrilo. El automático debe reconstruirse con las claves y el aviso debe durar hasta descartarlo.
7. **Antes de salir**: con cambios sin guardar, recargar debe pedir confirmación; después de guardar, no.
8. **Cross-playground**: un enlace con `tree=avl` abierto en `/nary/auto` debe redirigir a `/avl/<mode>`.

## Checklist para sumar un playground a los enlaces

- [ ] `storage.ts` con las claves que usa el adaptador.
- [ ] `share.ts` con `AutoState`, `ManualState` y `PlaygroundShareAdapter`.
- [ ] `serialize` devuelve `null` para estados vacíos o inválidos.
- [ ] `hydrate` devuelve dos copias independientes y valida todo.
- [ ] `hasSavedData` lee las claves reales y distingue vacío de no vacío.
- [ ] `save` persiste la forma que el inicializador espera y limpia el historial.
- [ ] `isEmpty` coincide con `serialize`.
- [ ] Cada hook usa `useSharedModeState`, inicializa con `shared.initial` y llama a `shared.commit` en un efecto.
- [ ] Cada hook omite las escrituras de árbol/configuración/historial cuando `shared.active`.
- [ ] Cada pantalla pasa `share={{ adapter, state }}` a `AppShell`.
- [ ] Probaste autoguardado, aviso, guardado por modo, degradado y enlace inválido.

## Errores comunes

| Síntoma | Causa |
| --- | --- |
| El botón Compartir está deshabilitado con un árbol visible | `isEmpty` no coincide con el estado real |
| El enlace abre vacío | El hook no usa `shared.initial` en el primer render |
| El enlace pisa lo guardado | `hasSavedData` mira otra clave o considera vacío un árbol con datos |
| Cambiar de modo pierde ediciones | `commit` no se llama o el estado no se guarda en la sesión |
| El manual y el automático comparten nodos | `hydrate` reutiliza referencias en lugar de clonar |
| El enlace manual válido se marca degradado | `validateManualNary` rechaza algo que el editor acepta; revisá la regla |
| El enlace manual inválido rompe la app | `hydrate` no devuelve `null` o no valida referencias/ciclos |
| El enlace es demasiado largo | `serialize` no compacta o no limita; revisá el formato y los nodos |
| El aviso de degradado no aparece | No se devuelve `degraded` o el modo no lo consume |
| Al guardar no se limpia el historial | `save` no escribe `autoHistory: []` (o la clave equivalente) |

## Relacionado

- [Convenciones y calidad](./03-convenciones-y-calidad.md)
- [Crear un playground](./04-nuevo-playground.md)
- [Herramientas del canvas](./05-herramientas-del-canvas.md)
