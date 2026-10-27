// GitHub Pages no reescribe rutas del SPA: una URL profunda devuelve 404.
// Copiar index.html a 404.html permite que el router restaure la ruta.
import { copyFile } from 'node:fs/promises';

await copyFile('dist/index.html', 'dist/404.html');
console.log('SPA fallback: dist/404.html');
