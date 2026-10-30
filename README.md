# arbolito

Aplicación web estática para experimentar con estructuras de árbol. Cada estructura es un **playground** con modo automático (opera y explica el algoritmo) y modo manual (se construye y valida a mano). Hoy incluye **Árbol B** y **Árbol AVL**; la arquitectura está preparada para sumar árboles n-arios.

Demo en línea: https://arbolito.schiavoni.dev/ (despliegue automático a GitHub Pages con Actions en cada push a `main`).

## Rutas

- `/` es la landing page; desde ahí se accede al último playground usado (o a `/btree/auto`).
- `/docs` y `/docs/<slug>` para la documentación para desarrolladores.
- `/<estructura>/auto` y `/<estructura>/manual` para cada playground. Por ejemplo, Árbol B vive en `/btree/auto` y `/btree/manual`, y Árbol AVL en `/avl/auto` y `/avl/manual`.
- Las rutas son limpias (`BrowserRouter`); el build copia `dist/index.html` a `dist/404.html` para que los deep links funcionen en GitHub Pages.

## Documentación

La documentación para colaboradores vive en `docs/*.md` y se publica en `/docs`:

- el primer `H1` es el título y el primer párrafo la descripción;
- el orden es por nombre de archivo (los prefijos `01-`, `02-` permiten controlarlo);
- `README.md` es la página de inicio y no genera una página aparte;
- los archivos que empiezan con `_` no se publican;
- cada página se agrega automáticamente al sitemap en el build.

Para crear una página alcanza con sumar un `.md` en `docs/`. El motor de render vive en `src/docs/`.

## Árbol B

En este proyecto, el orden `p` es la cantidad máxima de punteros de árbol por nodo. Cada nodo contiene como máximo `p - 1` claves. Los nodos que no son raíz contienen como mínimo `ceil(p/2) - 1` claves (es decir, `ceil(p/2)` punteros si no son hojas). La raíz contiene entre 1 y `p - 1` claves si es el único nodo, o entre 2 y `p` punteros si tiene hijos. Cada nodo tiene 0 hijos (hoja, con todos sus punteros nulos) o exactamente `|claves| + 1` hijos. Todas las hojas se encuentran a la misma profundidad. Las claves están ordenadas de forma ascendente y no hay duplicados. Cada hijo `i` contiene claves dentro del rango `(claves[i-1], claves[i])`.

- **Automático:** configura `p` y tipo de clave (`123` numérico o `Abc` texto), inserta, elimina y busca claves de a una o en lista, genera claves aleatorias, vacía el árbol y consulta el historial con pasos expandibles (divisiones, préstamos, fusiones, reemplazo por predecesor/sucesor). El panel de ajustes permite elegir qué lado priorizar ante ambigüedades del algoritmo.
- **Manual:** crea y elimina nodos, edita claves, arrastra nodos, marca la raíz y conecta punteros por slots. Validar comprueba todas las reglas de `p`, orden, duplicados, ciclos, alcanzabilidad y hojas a igual profundidad. Incluye deshacer (hasta 6 pasos) y rehacer.

## Árbol AVL

- **Automático:** inserta, elimina y busca claves; muestra el árbol con altura y factor de balance por nodo, resalta el camino de búsqueda, la clave nueva y los nodos tocados por rotaciones. El historial detalla inserciones, reemplazo por sucesor y rotaciones simples/dobles.
- **Manual:** editor libre con un nodo por clave y dos punteros (izquierdo/derecho), arrastre, linking, undo/redo y Validar. El validador comprueba BST, un solo padre, alcanzabilidad, ausencia de ciclos, tipos/duplicados y factor de balance en `{-1, 0, 1}`.

## Compartir árboles

Cada playground tiene un botón para compartir el árbol actual. El enlace lleva el árbol comprimido en la URL y funciona sin cuenta. Quien lo abre ve el árbol tal como fue compartido y puede explorarlo y editarlo en ambos modos, pero el guardado automático queda desactivado para no pisar lo que ya tenía guardado.

- Si no había datos guardados en el modo del enlace, se guarda automáticamente y se limpia la URL, sin avisos.
- Si había datos, aparece un aviso no descartable que se puede minimizar a un banner arriba a la derecha.
- Al guardar se elige explícitamente si se sobrescribe el árbol automático, el manual o ambos. El historial del modo guardado se reinicia.
- Los cambios sin guardar se pierden al actualizar o salir de la página; el navegador pide confirmación si hay ediciones pendientes.

## Estructura del código

- `src/app/`: `App`/router, `registry.ts` (playgrounds y rutas), `AppShell` (header y modo inmersivo) y contexto de tema/header.
- `src/landing/`: landing page (`/`), grilla interactiva en canvas, arte SVG animado y estilos propios.
- `src/common/`: canvas compartido (`TreeCanvas`, `layoutTree`), storage con namespaces y migración, parseo de claves, validación estructural, hooks, primitivas shadcn y enlaces compartidos (`share/`).
- `src/playgrounds/btree/`: modelo puro (`model/btree.ts`, `model/validate.ts`) y UI del playground.
- `src/playgrounds/avl/`: modelo puro (`model/avl.ts`, `model/validate.ts`) y UI del playground.
- `docs/`: markdown de la documentación para desarrolladores.
- `src/docs/`: motor de render, layout, navegación y estilos de `/docs`.
- La lógica de los modelos no depende de React. Para agregar un playground alcanza con crear su carpeta y sumar una entrada al registry.

## Persistencia

Sin backend ni base de datos. Todo vive en `localStorage`:

- Claves globales: `arboles:theme`, `arboles:header-hidden`, `arboles:last-playground`.
- Estado por playground: `arboles:v2:<id>:<nombre>` (árbol automático, historial, borrador manual, vista con paneo/zoom).
- `src/common/storage/migrate.ts` migra una sola vez el formato anterior de almacenamiento y conserva las claves viejas como respaldo.

## Analítica

El sitio envía métricas de uso anónimas a una instancia propia de Umami (sin cookies ni identificadores persistentes): pageviews, apertura de playgrounds, herramientas usadas y clics salientes. **Nunca** se envían claves, árboles ni contenido editado.

- Código: `src/common/analytics` (cola de eventos, opt-out y `tool_use` contextualizado por playground/modo).
- Eventos: `playground_open`, `session_engaged`, `tool_use`, `ui_action`, `config_change`, `outbound_click`, `landing_cta`.
- El tracker se carga en `index.html` y solo se activa en `arbolito.schiavoni.dev` (`data-domains`).
- Opt-out: abrir cualquier ruta con `?no-track=1` (queda guardado en `localStorage` como `arboles:analytics-opt-out`).

## Uso

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # compilación a dist/ + fallback 404.html
npm run preview  # vista previa de la compilación
npm run lint
```
