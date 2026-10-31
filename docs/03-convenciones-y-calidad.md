# Convenciones y calidad

Esta página reúne las reglas que hacen que un cambio se sienta parte del proyecto. No son preferencias: varias se verifican en el build y otras son las que mantienen el árbol de dependencias sano.

## Principios

- **Sin backend y sin estado global de servidor.** Todo vive en el navegador: `localStorage` para la sesión y la URL para los enlaces compartidos.
- **Modelo puro primero.** La lógica de una estructura no importa React, componentes ni `localStorage`. Se puede ejecutar y razonar de forma aislada.
- **Una estructura, un playground.** Cada estructura tiene su carpeta, su modelo y su adaptador de enlaces. No se importan modelos entre playgrounds.
- **La UI compone, no calcula.** Las pantallas arman canvas, toolbar y diálogos; las operaciones y los efectos viven en hooks; el render de un nodo vive en su componente.
- **Mobile-first y tema claro/oscuro desde el primer día.** No hay una versión "después para mobile".
- **Español para la interfaz y los comentarios.** Los identificadores del código siguen en inglés, como el resto del repositorio.

## Estructura de archivos

```
src/
  app/                       # router, registry, AppShell, SEO, chrome del header
  common/                    # todo lo compartido entre playgrounds
    analytics/               # Umami: estadísticas anónimas de uso para mejorar la app
    canvas/                  # TreeCanvas, paneo, zoom, animación, edge-path
    components/              # UI compartida agrupada por dominio + primitivas ui/
    editor/                  # hooks y toolbar de los editores manuales
    hooks/                   # hooks transversales (tema, media query, vista)
    keys/                    # parseo del campo de claves
    lib/                     # utilidades (cn, clipboard)
    share/                   # codec, sesión y hook de enlaces compartidos
    storage/                 # load/save, namespaces, claves globales, migración
    tools/                   # contrato CanvasTool y herramientas del canvas
    tree/                    # layoutTree para los canvas automáticos
    types.ts                 # Key, KeyType, cmpKey, toKey, isValidKey
    validate/                # chequeos de grafo comunes a los editores manuales
  docs/                      # motor de /docs
  landing/                   # landing page
  playgrounds/
    btree/
    avl/
    nary/                    # ejemplo de playground nuevo
      model/                 # lógica pura
      ui/                    # pantallas, hooks, nodos y toolbars
      storage.ts             # claves de localStorage del playground
      share.ts               # adaptador de enlaces compartidos
docs/                        # markdown que se publica en /docs
scripts/                     # spa-fallback, sitemap, chequeo de arquitectura
```

Dentro de `ui/`, cada modo tiene su carpeta:

- `ui/auto/`: hook `use-<id>-auto.ts`, nodo `XxxAutoNode.tsx`, toolbar `XxxAutoToolbar.tsx`.
- `ui/manual/`: hook `use-<id>-manual.ts`, nodo `XxxManualNode.tsx`, borrador `draft.ts`.
- La pantalla `AutoPlayground.tsx` o `ManualPlayground.tsx` compone todo.
- `node-metrics.ts` concentra medidas que comparten el canvas automático y el manual.

## Nombres

| Tipo | Convención | Ejemplo |
| --- | --- | --- |
| Componente React | `PascalCase.tsx` | `NaryAutoNode.tsx` |
| Hook | `kebab-case.ts`, exporta el mismo nombre en camelCase | `use-nary-auto.ts` → `useNaryAuto` |
| Modelo, utilidad, storage | `kebab-case.ts` | `parse-key-list.ts`, `node-metrics.ts` |
| Archivo de pantalla | `PascalCase.tsx` | `ManualPlayground.tsx` |
| Constantes | `SCREAMING_SNAKE_CASE` | `NARY_MIN`, `MAX_COMPRESSED_LENGTH` |
| Tipos e interfaces | `PascalCase`, sin prefijo `I` | `CanvasTool`, `SharedTreeData` |
| Funciones | `camelCase`, verbo al inicio | `validateManualNary`, `insertKeyLogged` |

No se agregan barrels nuevos (`index.ts` que reexporten una carpeta). El proyecto importa el archivo concreto para no romper el tree-shaking. Las únicas agregaciones existentes son `src/common/share/index.ts`, `src/common/tools/index.ts` y `src/common/analytics/index.ts`; no copies ese patrón para una carpeta nueva.

## Imports y dependencias

- Usá siempre el alias `@/` para código dentro de `src`: `@/common/...`, `@/playgrounds/...`, `@/landing/...`, `@/app/...`.
- Los imports relativos quedan para CSS y para archivos hermanos de la misma pantalla cuando aportan claridad (`./auto/NaryAutoNode`).
- `src/common` **no puede** importar `app`, `landing` ni `playgrounds`.
- Un playground **no puede** importar la UI ni el modelo de otro playground.
- Un playground **no puede** importar la landing.
- Un playground sí puede importar `app/AppShell`, `app/use-chrome`, `common/**` y sus propios archivos.

Estas reglas se validan con:

```bash
npm run lint:arch
```

El script `scripts/check-structure.mjs` recorre `src/**/*.ts(x)` y falla si encuentra un import cruzado. `npm run lint` también lo ejecuta.

## TypeScript

La configuración de `tsconfig.app.json` es estricta en varios puntos que afectan el código diario:

- `verbatimModuleSyntax`: los tipos se importan con `import type { ... }`. Si un import mezcla valores y tipos, separalo:
  ```ts
  import { cmpKey, type Key, type KeyType } from '@/common/types';
  ```
- `noUnusedLocals` y `noUnusedParameters`: no dejes variables ni parámetros sin usar. Si un callback de la API recibe un parámetro que no usás, omitilo o prefijalo con `_` solo cuando la firma lo exija.
- `noFallthroughCasesInSwitch`: cada rama de un `switch` termina en `return`, `break` o `throw`.
- `erasableSyntaxOnly`: no uses `enum`, `namespace` ni parameter properties. Para variantes usá uniones discriminadas:
  ```ts
  export type Step =
    | { t: 'insert'; key: Key }
    | { t: 'remove'; key: Key };
  ```
- No hay `any` explícito en el código existente. Cuando el dato viene de `localStorage` o de la URL, el tipo de entrada es `unknown` y se valida con type guards antes de usarlo.
- Evitá aserciones no nulas (`!`) salvo que la invariante sea evidente en el lugar. En el código existente se usan en casos acotados, por ejemplo `document.getElementById('root')!` en `main.tsx`.

## React

- Componentes de función y hooks. No class components.
- Los hooks se llaman en el nivel superior del componente o de otro hook. `oxlint` marca `react/rules-of-hooks` como error.
- Un archivo de componente exporta componentes; si necesita exportar constantes, usá `allowConstantExport` (configurado en `.oxlintrc.json`). Los tipos y helpers van a otro archivo.
- El estado derivado se calcula con `useMemo`, no se copia a otro `useState` ni se sincroniza con un efecto.
- La persistencia va en efectos separados y con una guarda explícita:
  ```ts
  React.useEffect(() => {
    if (!shared.active) storage.save(KEYS.autoTree, tree);
  }, [tree, shared.active]);
  ```
  Mientras hay un enlace compartido activo no se escribe el árbol, la configuración ni el historial en `localStorage`.
- Para gestos y mediciones usá `useRef`. No dispares un render por cada `pointermove` si el dato no se pinta.
- Los snapshots de deshacer se clonan con `structuredClone` antes de mutar.
- Las pantallas de modo se cargan con `React.lazy` desde el registry; no las importes de forma estática.

## Estilo visual

- Tailwind + primitivas shadcn de `src/common/components/ui`. No agregues una librería de componentes nueva por una pantalla.
- Tema Vercel: blanco y negro, zinc, bordes sutiles, radio pequeño. Usá tokens semánticos (`bg-background`, `bg-card`, `border-border`, `text-muted-foreground`) antes que colores literales.
- Los colores con significado se mantienen: rojo para errores de validación, verde para la clave nueva o el nodo recién insertado, zinc para selección y foco.
- Siempre claro y oscuro. Si usás un color literal, agregá su variante `dark:`.
- `cn` de `@/common/lib/utils` para combinar clases condicionales.
- No uses estilos inline salvo geometría dinámica (columnas de una grilla, posición de un nodo, ancho calculado).
- Iconos con `lucide-react`. La excepción existente es `Marquee2Icon`, un SVG embebido para no sumar toda una librería por un ícono.

### Reglas de layout que no se negocian

- El **header global** lo pone `AppShell`; la configuración del playground se pasa como `config`.
- La **barra de acciones** va abajo, flotante y centrada, con `BottomToolbar` + `ToolbarButton`/`ToolButton`. No agregues sidebars fijas en mobile ni barras superiores para acciones.
- `BottomToolbar` publica `--bottom-toolbar-offset`; los flotantes que deben quedar por encima (por ejemplo el botón "Centrar el árbol") lo consumen.
- El **canvas ocupa el resto de la pantalla**, sin bordes. Mensajes, aviso de linking e historial flotan sobre el canvas.
- El resultado de Validar va en `ValidationSheet` (bottom sheet). Los mensajes de estado van en `CanvasNotice`.
- La pantalla de un playground usa `flex h-full min-h-0 flex-col` y el contenedor del canvas `relative min-h-0 flex-1`.
- Todo nodo interactivo lleva `data-node` en su elemento raíz. `TreeCanvas` y `useCanvasView` usan ese atributo para no iniciar un paneo ni una herramienta sobre un nodo.
- El ancho y el alto que declara el nodo deben coincidir con `getNodeWidth`/`nodeHeight` del canvas. Si no coinciden, las flechas, el recentrado y el área táctil quedan mal.

## Accesibilidad

- Todo botón con solo ícono necesita `aria-label` y `title`.
- Los botones de herramienta usan `aria-pressed` (`ToolButton` ya lo hace).
- Los inputs de clave necesitan `aria-label` y el `inputMode` correcto (`numeric` o `text`).
- `Esc` cancela el linking. `Ctrl/Cmd+Z` deshace y `Ctrl/Cmd+Shift+Z` o `Ctrl/Cmd+Y` rehace en los editores manuales (`useManualShortcuts`).
- No dependas solo de `hover` para una acción: en mobile no existe. El patrón del proyecto es mostrar los botones de slot siempre en mobile y en hover en desktop.
- Mantené el foco visible y devolvé el foco a la celda correcta después de un commit que remonta inputs.

## Calidad y defensas

- Los modelos no lanzan por datos de usuario: devuelven resultados (`{ valid, issues }`, `{ inserted: false }`, `null`).
- Los datos externos (URL, `localStorage`) se consideran hostiles. Validá tipo, longitud, duplicados, referencias y límites antes de construir el estado.
- Los límites defensivos existentes son parte del contrato: nodos máximos, longitud comprimida, longitud descomprimida, profundidad y cantidad de claves.
- No uses `console.log` como depuración permanente.
- Comentá el **porqué** de una decisión no obvia (una guarda, un orden de eventos, un límite), no lo que el código ya dice.
- Evitá archivos gigantes. Si una pantalla crece, extraé el nodo, la toolbar o el hook.
- No escribas en `dist/` ni en `public/sitemap.xml` a mano por un cambio de docs: el sitemap de documentación se completa en el build. La excepción son las rutas nuevas de playground, que sí se agregan a `public/sitemap.xml`.

## Analítica

`src/common/analytics` concentra la integración con Umami, que se usa para tener estadísticas anónimas de uso con el fin de mejorar la app.

## Verificaciones antes de abrir un PR

```bash
npm run lint       # oxlint + reglas de arquitectura
npm run build      # tsc -b + vite build + 404.html + sitemap
npm run preview    # revisar el build servido
```

`npm run build` falla si el sitemap no coincide con el registry y los archivos de `docs/`. No lo saltees: es la red de seguridad de las rutas.

Checklist manual mínima:

- La ruta nueva abre en limpio y con recarga directa (fallback de GitHub Pages).
- Claro y oscuro.
- Desktop y mobile (ancho menor a 640 px, toolbar inferior).
- Zoom, paneo, recentrado y arrastre con mouse y con touch.
- Persistencia después de recargar.
- Enlace compartido: abrir en otra pestaña, cambiar de modo, guardar.
- Sin errores en la consola.

## Commits

Conventional Commits. No agregues autor ni coautor de ningún agente. Si hacés varios commits, respetá la regla horaria del proyecto: cada commit posterior suma entre 15 y 90 minutos al anterior, y si cae entre la 01:01 y las 08:59 se adelanta a después de las 09:00 del mismo día.

## Relacionado

- [Crear un playground](./04-nuevo-playground.md)
- [Herramientas del canvas](./05-herramientas-del-canvas.md)
- [Enlaces compartidos](./06-enlaces-compartidos.md)
