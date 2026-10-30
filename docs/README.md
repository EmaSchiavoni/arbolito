# Documentación para desarrolladores

Arbolito es un playground de estructuras de árbol pensado para practicar, visualizar y validar árboles B y AVL en el navegador. Esta documentación reúne lo necesario para entender el código, sumar un playground y mantener la aplicación sin romper las convenciones del proyecto.

La guía está pensada para leerse en orden, pero cada página funciona de forma independiente. Si es tu primera vez, empezá por [Introducción](./01-introduccion.md) y seguí con [Arquitectura](./02-arquitectura.md).

## Cómo colaborar

1. Hacé un fork del repositorio y creá una rama descriptiva desde `main` (por ejemplo, `docs/guia-de-estilos` o `fix/validacion-avl`).
2. Instalá las dependencias y levantá el entorno con `npm install` y `npm run dev`.
3. Implementá el cambio respetando la separación entre modelos puros, estado y UI que se explica en [Arquitectura](./02-arquitectura.md).
4. Ejecutá `npm run lint` y `npm run build` antes de subir los cambios.
5. Abrí el pull request contra `main` con una descripción clara del problema y de la solución.

## Recomendaciones para que el PR sea integrado

- Mantené el cambio acotado: un PR por tema facilita la revisión.
- Seguí [Conventional Commits](https://www.conventionalcommits.org/) en los mensajes de commit.
- No mezcles refactors grandes con correcciones puntuales.
- No incluyas archivos generados como `dist/` ni cambios innecesarios en dependencias.
- Si tocás la UI, adjuntá capturas o una descripción de cómo verificarlo en claro, oscuro y mobile.
- Si agregás o cambiás una ruta, revisá el SEO, el fallback de GitHub Pages y el sitemap; el build falla si el sitemap queda desactualizado.
- Si agregás un playground, mantené su modelo puro (sin React) y no importes modelos entre playgrounds; lo compartido va en `src/common`.
- Si cambiás el comportamiento de una estructura o una convención del proyecto, actualizá la documentación correspondiente.
- Asegurate de que el build y el lint pasen antes de pedir la revisión.

## Cómo agregar una página de documentación

Cada archivo `.md` dentro de `docs/` se convierte automáticamente en una página en `/docs/<slug>` y se agrega al sitemap en el próximo build.

- El título sale del primer `H1` del archivo.
- La descripción sale del primer párrafo.
- El orden es por nombre de archivo; los prefijos numéricos permiten controlarlo (`01-`, `02-`, ...).
- El slug se arma con el nombre sin el prefijo numérico.
- Los archivos que empiezan con `_` no se publican.
- `README.md` es esta página de inicio y no genera una página aparte.
- La portada muestra las primeras cuatro páginas por orden; el resto queda en el menú de navegación.

Para enlazar otra página podés usar la ruta absoluta (`/docs/arquitectura`) o un enlace relativo al markdown (`[Arquitectura](./02-arquitectura.md)`); el renderizador lo convierte a la ruta correcta.
