# arbolito

Aplicación web para practicar y visualizar estructuras de árbol. Cada estructura es un playground con dos modos: **automático**, que ejecuta las operaciones paso a paso y explica el algoritmo, y **manual**, que permite construir el árbol y validarlo.

Hoy incluye Árbol B y Árbol AVL. La arquitectura está preparada para sumar árboles n-arios y otras estructuras.

Demo en línea: https://arbolito.schiavoni.dev/

Todo funciona en el navegador: no hay cuentas ni backend. Los árboles se guardan en `localStorage` y se pueden compartir mediante un enlace.

## Contribuciones

Las contribuciones son bienvenidas. Antes de abrir un pull request, revisá:

- [Cómo colaborar](https://arbolito.schiavoni.dev/docs#c%C3%B3mo-colaborar)
- [Recomendaciones para que el PR sea integrado](https://arbolito.schiavoni.dev/docs#recomendaciones-para-que-el-pr-sea-integrado)

## Documentación

La documentación para desarrolladores está en `docs/` y se publica en https://arbolito.schiavoni.dev/docs. Incluye introducción, arquitectura, convenciones, una guía para crear un playground, herramientas del canvas y enlaces compartidos.

Para levantar el proyecto en local:

```bash
npm install
npm run dev
```

## Estructura

```
src/app/          # rutas, registry de playgrounds y shell
src/common/       # canvas, componentes y utilidades compartidas
src/playgrounds/  # una carpeta por estructura
src/landing/      # landing page
src/docs/         # motor de la documentación
docs/             # páginas markdown de la documentación
```

## Privacidad

Umami se usa para tener estadísticas anónimas de uso con el fin de mejorar la app. Los árboles y las claves no se envían a la analítica.

## Licencia

El proyecto se distribuye bajo la [GNU Affero General Public License v3.0](./LICENSE). Si modificás el proyecto y lo ofrecés como servicio en red, la licencia exige publicar el código fuente.
