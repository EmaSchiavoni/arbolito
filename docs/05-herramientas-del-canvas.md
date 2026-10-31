# Herramientas del canvas

Una **herramienta** es un objeto que interpreta gestos que empiezan sobre el fondo del canvas. No es un componente ni un botón: el botón solo la selecciona. La herramienta recibe puntos ya transformados y decide qué hacer; el canvas se encarga del paneo, el zoom, el pointer capture y los cursores.

El contrato vive en `src/common/tools/types.ts`. La instancia de la herramienta se crea en el hook de la pantalla, se registra en `useCanvasTool` y se pasa a `TreeCanvas`.

## Tipos de la interfaz

### `ToolPoint`

Es el punto de interacción que recibe cada callback de una herramienta. No se construye a mano: lo arma `useCanvasView` con la transformación del canvas ya aplicada.

```ts
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface ToolPoint {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  onNode: boolean;
  dragged: boolean;
  event: ReactPointerEvent<Element>;
}
```

| Campo | Tipo | Para qué sirve |
| --- | --- | --- |
| `x`, `y` | `number` | Coordenadas del **mundo**: paneo y zoom ya descontados. Es lo que se usa para ubicar un nodo o comparar con el layout. |
| `screenX`, `screenY` | `number` | Coordenadas relativas al contenedor del canvas. Sirven para overlays en píxeles de pantalla. |
| `clientX`, `clientY` | `number` | Coordenadas relativas al viewport. Sirven para `document.elementFromPoint` y para comparar con eventos nativos. |
| `onNode` | `boolean` | Indica si el gesto empezó sobre un nodo o un control interactivo. **Ojo:** en la implementación actual `useCanvasView` no inicia el gesto de una tool sobre `[data-node]`, `input` o `button`, así que una tool de fondo no recibe ese caso. Para interactuar con nodos usá handlers en el nodo. |
| `dragged` | `boolean` | `true` cuando el puntero superó el umbral de arrastre desde el `pointerdown`. |
| `event` | `ReactPointerEvent<Element>` | Evento original. Sirve para leer modificadores como `shiftKey`, `altKey` o `metaKey`. |

No conviertas coordenadas a mano ni consultes el zoom dentro de la herramienta. Si necesitás un umbral en píxeles, usá `clientX`/`clientY`.

### `CanvasTool`

Es el contrato que debe cumplir una herramienta para que `useCanvasTool` la seleccione y `TreeCanvas` la ejecute.

```ts
import type { ComponentType } from 'react';

export interface CanvasTool {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  cursor?: string;
  draggingCursor?: string;
  pinned?: boolean;
  onPress?: (point: ToolPoint) => void;
  onDrag?: (point: ToolPoint) => void;
  onRelease?: (point: ToolPoint) => void;
}
```

| Campo | Obligatorio | Para qué sirve |
| --- | --- | --- |
| `id` | Sí | Identidad estable. `useCanvasTool` la usa para saber cuál está activa y `ToolButton` para comparar `activeId`. No la cambies entre renders. |
| `label` | Sí | Texto del tooltip y del `aria-label`. Va en español. |
| `icon` | Sí | Componente de ícono. Tiene que aceptar `className`; sirven los de Lucide o un SVG propio como `Marquee2Icon`. |
| `cursor` | No | Cursor CSS mientras la herramienta está activa: `crosshair`, `copy`, `grab`, etc. |
| `draggingCursor` | No | Cursor mientras se arrastra. En la práctica solo lo aprovechan las herramientas fijas como el paneo. |
| `pinned` | No | Herramienta fija: representa el estado sin herramienta, no captura gestos y no se puede deseleccionar. Debe existir una sola en el arreglo. |
| `onPress` | No | Se llama al presionar el fondo, antes de saber si será un click o un arrastre. |
| `onDrag` | No | Se llama en cada movimiento después de superar el umbral de 4 px. |
| `onRelease` | No | Se llama al soltar. También se llama en un click sin movimiento, con `dragged` en `false`. |

Una herramienta sin callbacks no hace nada: solo cambia el cursor y el estado activo del botón. Si no necesita gestos, probablemente sea un `ToolbarButton`, no una `CanvasTool`.

### Tipos auxiliares

| Tipo | Dónde vive | Para qué se usa |
| --- | --- | --- |
| `CanvasTool` | `@/common/tools/types` | Define la herramienta. |
| `ToolPoint` | `@/common/tools/types` | Argumento de `onPress`, `onDrag` y `onRelease`. |
| `MarqueeNode` | `@/common/tools/selection-tool` | Nodo mínimo que necesita la selección por recuadro: `id`, `x`, `y`. |
| `MarqueeRect` | `@/common/tools/selection-tool` | Rectángulo en coordenadas del mundo: `x`, `y`, `w`, `h`. |
| `TreeCanvasProps` | `@/common/canvas/types` | Props del canvas; define `tool`, `marquee` y `extraSvg`. |
| `ComponentType` | `react` | Tipo del campo `icon`. |

Para la selección por recuadro, `useMarqueeSelection` devuelve `{ tool, rect }`; el `rect` es un `MarqueeRect`.

## Dónde se coloca cada pieza

| Pieza | Dónde se define o se crea | Dónde se usa |
| --- | --- | --- |
| El objeto `CanvasTool` | En un módulo de `src/common/tools/` si es genérico, o en `src/playgrounds/<id>/ui/` si depende del playground | Se pasa al arreglo de `useCanvasTool`. |
| La instancia concreta | En el hook de estado de la pantalla (`use-<id>-auto.ts` o `use-<id>-manual.ts`) | Se guarda en `useMemo` o se devuelve desde un hook propio. |
| El estado activo | `useCanvasTool([panTool, tool])` | Devuelve `activeTool`, `activeId` y `toggleTool`. |
| La herramienta activa | Prop `tool` de `TreeCanvas` | `activeTool`. |
| El botón | `BottomToolbar` con `ToolButton` | Recibe `tool`, `active` y `onSelect`. |
| El preview | Props `marquee` o `extraSvg` de `TreeCanvas` | Coordenadas del mundo, no de pantalla. |
| El nodo interactivo | Componente del nodo, con `data-node` en su raíz | El canvas no inicia gestos encima. |

La instancia no va en una constante de módulo. Se crea en el hook de la pantalla (con `useMemo`) y se devuelve; no armes un objeto nuevo en cada render. Si guarda estado entre eventos, va en un `useRef` dentro de un hook; si no guarda estado, puede ser un objeto estático como `panTool`.

## Ciclo de vida

El comportamiento está en `src/common/canvas/use-canvas-view.ts`:

1. En `pointerdown`, si el objetivo es `[data-node]`, `input` o `button`, el canvas marca el gesto como inerte y **no** llama a la herramienta. Esos elementos manejan sus propios eventos.
2. Si hay una herramienta activa y no es `pinned`, el canvas cancela el paneo, guarda el gesto y llama a `onPress`.
3. En `pointermove`, recién cuando el puntero se movió 4 px o más se marca `dragged` y se empieza a llamar a `onDrag`. Antes de eso no hay `onDrag`.
4. En `pointerup` se llama a `onRelease` con el estado final. En `pointercancel` **no** se llama a `onRelease`: descartá el estado interno.
5. Un segundo dedo cancela el gesto de la herramienta y, si ambos dedos están sobre el fondo, inicia el pinch. La herramienta no recibe un aviso de cancelación; su próximo `onPress` debe reiniciar el estado.
6. Solo se acepta el botón izquierdo del mouse.
7. La herramienta fija (paneo) no captura gestos: el fondo se sigue arrastrando como siempre.

## Paso a paso para integrar una herramienta nueva

### 1. Decidir el alcance

Antes de escribir código, respondé:

- ¿La herramienta sirve en cualquier editor o depende de las reglas de un playground?
- ¿Necesita guardar estado entre `onPress`, `onDrag` y `onRelease`?
- ¿Necesita un preview propio o alcanza con el recuadro de selección?
- ¿La acción es un gesto de fondo o es un botón sobre un nodo?

Si es una acción puntual como Validar, Limpiar o Historial, no es una herramienta: es un `ToolbarButton`. Si es una interacción con un nodo, el handler va en el nodo y no en una tool de fondo.

### 2. Definir la herramienta

Creá un archivo en el lugar que corresponda y exportá una fábrica o un hook que devuelva `CanvasTool`. El siguiente es el esqueleto mínimo de una herramienta con estado:

```ts
import * as React from 'react';
import { Link2 } from 'lucide-react';
import type { CanvasTool, ToolPoint } from '@/common/tools/types';

export function useConnectTool(onConnect: (from: ToolPoint, to: ToolPoint) => void): CanvasTool {
  const startRef = React.useRef<ToolPoint | null>(null);

  return React.useMemo<CanvasTool>(
    () => ({
      id: 'connect',
      label: 'Conectar',
      icon: Link2,
      cursor: 'crosshair',
      onPress: (point) => {
        startRef.current = point;
      },
      onRelease: (point) => {
        const from = startRef.current;
        startRef.current = null;
        if (!from || !point.dragged) return;
        onConnect(from, point);
      },
    }),
    [onConnect],
  );
}
```

Reglas de implementación:

- El estado entre eventos va en `useRef` o en el estado del hook, nunca en una variable de módulo.
- Si la herramienta no guarda estado, devolvé un objeto estático, como `panTool`.
- `onRelease` también se llama en un click sin arrastre. Si la acción requiere arrastre, comprobá `point.dragged`.
- Si el gesto se cancela con un segundo dedo, `onRelease` no se llama. Reiniciá el estado en `onPress`.
- No uses `onNode` para detectar un nodo: un gesto que empieza sobre `[data-node]` no llega a la tool.

### 3. Instanciarla en el hook de la pantalla

La instancia se crea donde vive el estado del editor, no en el componente de la toolbar ni en un módulo global.

```ts
const connectTool = useConnectTool((from, to) => {
  connectNodes(from, to);
});

const { activeTool, activeId, toggleTool } = useCanvasTool([panTool, connectTool]);
```

En un editor completo el arreglo también incluye `nodeTool` y `selectionTool`; el ejemplo muestra solo lo mínimo para una tool nueva.

Si usás `useManualCanvas`, ese hook ya crea `panTool`, `nodeTool`, `selectionTool` y su propio `useCanvasTool`. Para una herramienta nueva tenés dos caminos:

- **Genérica:** agregala a `useManualCanvas` para que todos los editores manuales la reciban.
- **Específica:** extendé `useManualCanvas` con una prop `extraTools?: CanvasTool[]` o construí el arreglo de `useCanvasTool` en la pantalla. No mantengas dos `useCanvasTool` en paralelo.

### 4. Pasarla al canvas

`TreeCanvas` recibe la herramienta activa en la prop `tool`:

```tsx
<TreeCanvas
  nodes={nodes}
  edges={edges}
  tool={activeTool}
  marquee={marquee}
  extraSvg={preview}
  // ...
/>
```

Si la herramienta dibuja un preview, `marquee` espera `{ x, y, w, h }` y `extraSvg` espera elementos SVG. Ambos usan coordenadas del mundo; no les pases píxeles de pantalla.

### 5. Agregar el botón

El botón que selecciona la herramienta va en la barra inferior, junto a las demás acciones:

```tsx
<BottomToolbar label="Herramientas del editor">
  <ToolButton
    tool={connectTool}
    active={activeId === connectTool.id}
    onSelect={() => toggleTool(connectTool.id)}
  />
</BottomToolbar>
```

`ToolButton` ya resuelve el ícono, el tooltip, `aria-pressed` y el estado activo. No lo reemplaces por un `div` clickeable.

Si la herramienta es genérica, agregá su botón a `ManualToolbar`. Si es específica del playground, agregá una prop opcional `extraTools?: React.ReactNode` a `ManualToolbar` y pasale el `ToolButton` desde la pantalla; no dupliques la barra completa.

### 6. Resolver la interacción con nodos

Un gesto de fondo no puede empezar sobre un nodo. Si la herramienta necesita elegir un nodo, tenés dos opciones:

- Poner un botón o un handler en el nodo, como hace el linking del editor manual con `{ nodeId, slot }`.
- Agregar `data-node-id={node.id}` al nodo y hacer hit-test en `onRelease` con `document.elementFromPoint(point.clientX, point.clientY)`.

`data-node` solo marca el nodo para que el canvas no inicie un gesto encima; `data-node-id` no viene por defecto y hay que agregarlo si se necesita.

### 7. Probar el ciclo completo

- La herramienta se activa y se desactiva desde la toolbar.
- Al deseleccionarla, el paneo vuelve solo.
- Un click sin arrastre no dispara la acción de arrastre.
- Un arrastre de menos de 4 px se comporta como click.
- Un arrastre real dispara `onDrag` varias veces y `onRelease` una sola vez.
- Empezar sobre un nodo no activa la tool.
- Un segundo dedo cancela sin dejar un preview pegado.
- El preview queda alineado en zoom 25 %, 100 % y 300 %.
- `Esc` y click en el fondo limpian el estado.

## Recomendaciones de integración

### Reutilizar una herramienta existente

Es la opción por defecto. Antes de crear una tool, revisá si ya existe:

| Necesidad | Herramienta | Cuándo usarla |
| --- | --- | --- |
| Mover la vista | `panTool` | Siempre; es la herramienta fija y no se deselecciona. |
| Crear un nodo en el fondo | `createNodeTool` | Cuando un click en el canvas debe agregar un nodo. El playground decide la posición final. |
| Seleccionar varios nodos | `useMarqueeSelection` | Cuando hace falta seleccionar, arrastrar o borrar grupos. Devuelve el rectángulo del preview. |
| Cablear todo el editor manual | `useManualCanvas` | Cuando el editor necesita paneo, nodo y selección con la vista persistida y el centro inicial. |

Si el editor es manual y solo necesita esas tres herramientas, no escribas un `useCanvasTool` propio: usá `useManualCanvas`.

### Integrarla a todos los playgrounds

Elegí este camino cuando la herramienta no conoce el modelo del árbol y tiene sentido en cualquier editor:

1. Creá el archivo en `src/common/tools/` con `kebab-case.ts` o `.tsx` si exporta un componente.
2. Exportá una fábrica o un hook, no un singleton con estado mutable.
3. Sumala a `src/common/tools/index.ts`.
4. Agregala a `useManualCanvas` si debe estar disponible en todos los editores manuales.
5. Agregá su `ToolButton` a `ManualToolbar`.
6. Documentá su cursor, su umbral y si necesita `marquee` o `extraSvg`.
7. Probala en al menos un editor manual y en mobile.

No importes `@/playgrounds/...` desde `src/common`: una herramienta genérica no puede conocer el modelo de un playground.

### Dejarla en un playground

Elegí este camino cuando la herramienta depende de las reglas, el estado o los tipos de un playground:

1. Creá el hook o la fábrica en `src/playgrounds/<id>/ui/manual/` o `ui/auto/`.
2. Devolvé un `CanvasTool` y, si hace falta, el estado visual del preview.
3. Instanciala en el hook de la pantalla y pasala a `TreeCanvas`.
4. Agregá el botón a la toolbar del playground.
5. Si necesitás reutilizar `ManualToolbar`, extendé su contrato con `extraTools`; no la copies entera.
6. Probá que no rompa el linking, el arrastre de nodos ni la selección por recuadro.

### Cuándo no crear una herramienta

No conviertas en tool una acción que no necesita gestos del fondo. Validar, Limpiar, Historial, Guardar o Compartir son botones. Tampoco crees una tool para una interacción que empieza sobre un nodo: eso va en el componente del nodo.

## Toolbar y accesibilidad

- La barra de acciones va abajo, flotante y centrada, con `BottomToolbar`.
- `ToolButton` ya expone `aria-label`, `aria-pressed` y tooltip.
- El canvas tiene `touch-none`; no agregues `preventDefault` manual en los handlers de la tool.
- El umbral de 4 px evita que un tap se interprete como arrastre.
- En mobile no hay hover: si la herramienta necesita un botón en cada nodo, mostralo siempre.
- `Esc` debe cancelar el estado de linking o preview. Usá `useManualShortcuts`.
- Los cursores son una ayuda visual, no la única señal: el botón activo también se pinta.

## Errores comunes

| Síntoma | Causa |
| --- | --- |
| La tool se dispara al tocar un nodo | El nodo no tiene `data-node` en su raíz. |
| `x`/`y` no coinciden con el nodo | Se usaron coordenadas de pantalla en lugar de mundo, o se volvió a aplicar el zoom. |
| El preview se desalinea al hacer zoom | Se dibujó fuera de `TreeCanvas` con píxeles de pantalla. |
| El estado de la tool se pierde entre renders | Se guardó en una variable local del render en lugar de un `useRef`. |
| El estado queda pegado tras un pinch | No se reinicia en `onPress` y no hay `onRelease` en cancelación. |
| Dos herramientas activas | Se guardó el id en un estado paralelo en vez de usar `useCanvasTool`. |
| El paneo no funciona con una tool activa | Es el comportamiento esperado: una tool no fija captura el fondo. Para volver, deseleccionala o elegí el paneo. |
| El botón no muestra el estado activo | `activeId` no se compara con `tool.id`, o se pasa un objeto de tool nuevo con otro id. |

## Relacionado

- [Crear un playground](./04-nuevo-playground.md): dónde se instancia la herramienta dentro del editor.
- [Enlaces compartidos](./06-enlaces-compartidos.md): si la herramienta modifica el estado que se comparte.
- [Convenciones y calidad](./03-convenciones-y-calidad.md): reglas de archivos, UI y accesibilidad.
