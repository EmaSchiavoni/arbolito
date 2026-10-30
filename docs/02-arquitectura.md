# Arquitectura

La aplicación está separada en una capa de modelos puros, una capa de estado y persistencia, y una capa de interfaz. Los modelos no importan React ni componentes, así que se pueden probar y razonar de forma aislada.

## Carpetas

- `src/app/`: router, registry de playgrounds, `AppShell`, contexto de tema/header y metadatos SEO.
- `src/landing/`: landing page, grilla interactiva y arte SVG.
- `src/common/`: canvas, layout de árboles, storage, parseo de claves, validación, hooks, share y primitivas de UI.
- `src/playgrounds/<id>/`: una carpeta por estructura, por ejemplo `btree` o `avl`. Cada una agrupa su modelo puro, `storage.ts`, `share.ts` y la UI. Agregar un playground es sumar una carpeta y una entrada en el registry.
- `src/docs/`: motor de esta documentación.
- `docs/`: los archivos markdown que se publican en `/docs`.

## Capas

### Modelos puros

`src/playgrounds/<id>/model/` contiene la lógica del algoritmo: inserción, eliminación, búsqueda, rotaciones, validación y cálculo de métricas. No importa React ni componentes. Cada playground tiene su propio modelo y no se importan modelos entre playgrounds.

### Estado y persistencia

Cada playground centraliza sus claves en `src/playgrounds/<id>/storage.ts` y usa `createScopedStorage` para escribir bajo `arboles:v2:<id>:<nombre>`. Las claves globales viven en `src/common/storage/keys.ts`.

La sesión de enlaces compartidos vive en memoria y se coordina desde `src/common/share`.

### Interfaz

Los playgrounds usan `AppShell` para el header, la configuración y las acciones compartidas. El canvas, las herramientas y los componentes de UI viven en `src/common`. La landing y la documentación tienen layouts propios.

## Registry y rutas

`src/app/registry.ts` es la fuente de verdad de los playgrounds: id, título, descripción y modos con componentes lazy. `App.tsx` arma las rutas a partir de ese arreglo y `seo.ts` mantiene los metadatos de cada ruta.

El sitemap se valida en `scripts/sitemap.mjs` contra el registry y, desde que existe la documentación, también contra los archivos de `docs/`.

## Agregar una funcionalidad

1. Si es lógica de un árbol, va en el modelo puro del playground.
2. Si es estado persistente, se declara en el `storage.ts` del playground.
3. Si es UI compartida, va en `src/common`.
4. Si es una ruta nueva, se suma al registry o al router y se actualiza el SEO y el sitemap.
