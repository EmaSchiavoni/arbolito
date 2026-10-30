# Introducción

Arbolito es una aplicación web estática para experimentar con estructuras de árbol. Cada estructura vive en un playground con un modo automático, que ejecuta el algoritmo y explica cada paso, y un modo manual, que permite construir y validar la estructura a mano.

El proyecto no tiene backend ni base de datos: todo el estado se guarda en `localStorage` y los enlaces compartidos llevan el árbol comprimido en la URL.

## Stack

- React 19 + TypeScript.
- Vite 8 para desarrollo y build.
- React Router con rutas limpias (`BrowserRouter`).
- Shadcn + Tailwind CSS.
- GitHub Pages como hosting, con deploy automático desde `main`.

## Puesta en marcha

```bash
npm install
npm run dev
```

El servidor de desarrollo queda disponible en la URL que muestra Vite. Las rutas principales son:

- `/` para la landing.
- `/docs` para esta documentación.
- `/<estructura>/auto` y `/<estructura>/manual` para cada playground. Por ejemplo, Árbol B vive en `/btree/auto` y `/btree/manual`, y Árbol AVL en `/avl/auto` y `/avl/manual`.

## Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # chequeo de tipos + build + 404.html + sitemap
npm run preview  # vista previa del build
npm run lint     # oxlint
```

El build ejecuta `tsc -b` antes de Vite. Si una ruta nueva no está en el sitemap o el sitemap tiene rutas de más, el script de `postbuild` falla y hay que corregirlo.

## Siguiente paso

- [Arquitectura](./02-arquitectura.md) explica las capas y las carpetas.
