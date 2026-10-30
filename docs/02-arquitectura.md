# Arquitectura

La aplicación está separada en una capa de modelos puros, una capa de estado y persistencia, y una capa de interfaz. Los modelos no importan React ni componentes, así que se pueden probar y razonar de forma aislada.

## Carpetas

- `src/app/`: router, registry de playgrounds, `AppShell`, contexto de tema/header y metadatos SEO. El chrome del header vive en `app/shell/` (menús, sheets, botones y hooks de compartir/altura).
- `src/landing/`: landing page (`/`), secciones (`sections/`), componentes reutilizables (`components/`), arte SVG (`art/`), grilla interactiva y estilos propios.
- `src/common/`: código compartido. El canvas está en `canvas/`, la lógica común de los editores manuales en `editor/`, el layout de árboles en `tree/`, y el resto se agrupa por dominio (`analytics`, `hooks`, `keys`, `lib`, `share`, `storage`, `tools`, `validate`). Los componentes de interfaz están en `components/`, agrupados por dominio (`brand`, `controls`, `feedback`, `share`, `tree`) y las primitivas shadcn en `components/ui/`.
- `src/playgrounds/<id>/`: una carpeta por estructura, por ejemplo `btree` o `avl`. Cada una agrupa su modelo puro, `storage.ts`, `share.ts` y la UI. Dentro de `ui/`, cada modo tiene su carpeta (`auto/`, `manual/`) con su hook de estado, sus componentes de nodo y su toolbar. Agregar un playground es sumar una carpeta y una entrada en el registry.
- `src/docs/`: motor de esta documentación.
- `docs/`: los archivos markdown que se publican en `/docs`.

## Capas

### Modelos puros

`src/playgrounds/<id>/model/` contiene la lógica del algoritmo: inserción, eliminación, búsqueda, rotaciones, validación y cálculo de métricas. No importa React ni componentes. Cada playground tiene su propio modelo y no se importan modelos entre playgrounds.

### Estado y persistencia

Cada playground centraliza sus claves en `src/playgrounds/<id>/storage.ts` y usa `createScopedStorage` para escribir bajo `arboles:v2:<id>:<nombre>`. Las claves globales viven en `src/common/storage/keys.ts`.

La sesión de enlaces compartidos vive en memoria y se coordina desde `src/common/share`.

### Interfaz

Los playgrounds usan `AppShell` para el header, la configuración y las acciones compartidas. El canvas, las herramientas, los hooks de edición y los componentes de UI viven en `src/common`. La landing y la documentación tienen layouts propios.

Cada pantalla (`AutoPlayground`, `ManualPlayground`) solo compone: recibe el estado de su hook, arma el canvas, la toolbar y los diálogos. Las operaciones y los efectos viven en `ui/auto/use-*.ts` y `ui/manual/use-*.ts`; el render de cada nodo vive en un componente propio.

## Convenciones de módulos

- **Un propósito por archivo.** Una pantalla compone, un componente renderiza, un hook maneja estado/efectos y un módulo calcula. Los subcomponentes privados chicos pueden quedar junto a su padre; si crecen o se reutilizan, se extraen.
- **Imports absolutos.** Usar el alias `@/` para todo lo que esté dentro de `src` (`@/common/...`, `@/playgrounds/...`). Los imports relativos quedan solo para archivos hermanos y CSS.
- **Sin barrels nuevos.** No agregar `index.ts` que reexporten una carpeta completa: se importa el archivo concreto para no romper el tree-shaking de Vite.
- **Dirección de dependencias.** `src/common` no importa `app`, `landing` ni `playgrounds`. Un playground no importa otro playground ni la landing. Estas reglas se validan con `npm run lint:arch`.
- **Nombres.** `PascalCase.tsx` para componentes, `kebab-case.ts` para hooks, modelos y utilidades. El hook se llama igual que su archivo.

## Registry y rutas

`src/app/registry.ts` es la fuente de verdad de los playgrounds: id, título, descripción y modos con componentes lazy. `App.tsx` arma las rutas a partir de ese arreglo y `seo.ts` mantiene los metadatos de cada ruta.

El sitemap se valida en `scripts/sitemap.mjs` contra el registry y, desde que existe la documentación, también contra los archivos de `docs/`.

## Agregar una funcionalidad

1. Si es lógica de un árbol, va en el modelo puro del playground.
2. Si es estado persistente, se declara en el `storage.ts` del playground.
3. Si es UI o edición compartida, va en `src/common`.
4. Si es una ruta nueva, se suma al registry o al router y se actualiza el SEO y el sitemap.
