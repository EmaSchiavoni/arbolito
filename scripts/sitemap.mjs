import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const MODES = ['auto', 'manual'];
const SITEMAP_PATH = 'dist/sitemap.xml';
const REGISTRY_PATH = 'src/app/registry.ts';

const [registry, sitemap] = await Promise.all([
  readFile(REGISTRY_PATH, 'utf8'),
  readFile(SITEMAP_PATH, 'utf8'),
]);

const ids = [...registry.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
const expectedPaths = ['/', ...ids.flatMap((id) => MODES.map((mode) => `/${id}/${mode}`))];
const documentedPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
const missing = expectedPaths.filter((path) => !documentedPaths.includes(path));
const extra = documentedPaths.filter((path) => !expectedPaths.includes(path));

if (missing.length > 0 || extra.length > 0) {
  const issues = [
    missing.length > 0 ? `faltan: ${missing.join(', ')}` : '',
    extra.length > 0 ? `sobran: ${extra.join(', ')}` : '',
  ].filter(Boolean);
  throw new Error(`Sitemap desactualizado (${issues.join('; ')})`);
}

let lastmod = new Date().toISOString().slice(0, 10);
try {
  lastmod = execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8' }).trim() || lastmod;
} catch {}

const updated = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  if (block.includes('<lastmod>')) return block;
  return block.replace('</loc>', `</loc>\n    <lastmod>${lastmod}</lastmod>`);
});

await writeFile(SITEMAP_PATH, updated);
console.log(`Sitemap: ${expectedPaths.length} rutas validadas (lastmod ${lastmod})`);
