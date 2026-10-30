// Reglas de dependencia entre capas. Se ejecuta con `npm run lint:arch`.
//
// 1. `src/common` es compartido: no puede importar app, landing ni playgrounds.
// 2. Un playground no puede importar la UI ni los modelos de otro playground.
// 3. Un playground no puede importar la landing.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'src';
const SPECIFIER = /(?:from\s*|import\s*\(\s*)'([^']+)'/g;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function layerOf(file) {
  if (file.startsWith('src/common/')) return { name: 'common' };
  if (file.startsWith('src/playgrounds/')) {
    const id = file.split('/')[2];
    return { name: 'playground', id };
  }
  if (file.startsWith('src/app/')) return { name: 'app' };
  if (file.startsWith('src/landing/')) return { name: 'landing' };
  if (file.startsWith('src/docs/')) return { name: 'docs' };
  return { name: 'other' };
}

const violations = [];

for (const absolute of await walk(SRC)) {
  const file = toPosix(path.relative(process.cwd(), absolute));
  const owner = layerOf(file);
  const source = await readFile(absolute, 'utf8');

  for (const match of source.matchAll(SPECIFIER)) {
    const specifier = match[1];
    if (!specifier.startsWith('@/')) continue;

    if (owner.name === 'common') {
      if (/^@\/(app|landing|playgrounds)\//.test(specifier)) {
        violations.push(`${file} importa ${specifier} (common no puede depender de app, landing ni playgrounds)`);
      }
      continue;
    }

    if (owner.name === 'playground') {
      const other = specifier.match(/^@\/playgrounds\/([^/]+)\//);
      if (other && other[1] !== owner.id) {
        violations.push(`${file} importa ${specifier} (los playgrounds no se importan entre sí)`);
      }
      if (specifier.startsWith('@/landing/')) {
        violations.push(`${file} importa ${specifier} (un playground no puede depender de la landing)`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`\n${violations.length} violación(es) de estructura:\n`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Estructura OK: sin imports cruzados entre capas.');
