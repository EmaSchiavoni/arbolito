import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const MODES = ['auto', 'manual'];
const SITEMAP_PATH = 'dist/sitemap.xml';
const REGISTRY_PATH = 'src/app/registry.ts';
const DOCS_DIR = 'docs';
const SITE_URL = 'https://arbolito.schiavoni.dev';
const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

const [registry, sitemap] = await Promise.all([
  readFile(REGISTRY_PATH, 'utf8'),
  readFile(SITEMAP_PATH, 'utf8'),
]);

const ids = [...registry.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
const playgroundPaths = ids.flatMap((id) => MODES.map((mode) => `/${id}/${mode}`));

async function readDocs() {
  try {
    const entries = await readdir(DOCS_DIR, { withFileTypes: true });
    const markdown = entries
      .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
      .map((entry) => entry.name);

    return {
      files: markdown
        .filter((name) => !/^readme\.md$/i.test(name) && !name.startsWith('_') && !name.startsWith('.'))
        .sort((a, b) => collator.compare(a, b)),
    };
  } catch {
    return { files: [] };
  }
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function docSlug(file) {
  return slugify(file.replace(/\.md$/i, '').replace(/^\d+[-_]/, ''));
}

function lastCommitDate(path) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', path], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

const docs = await readDocs();
const docSlugs = docs.files.map(docSlug);

if (new Set(docSlugs).size !== docSlugs.length) {
  throw new Error('Sitemap: dos archivos de docs generan el mismo slug.');
}

const today = new Date().toISOString().slice(0, 10);
const documentedBefore = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => new URL(match[1]).pathname,
);

const docsEntries = [
  {
    path: '/docs',
    priority: '0.7',
    lastmod: lastCommitDate(`${DOCS_DIR}/README.md`) || today,
  },
  ...docs.files.map((file) => ({
    path: `/docs/${docSlug(file)}`,
    priority: '0.6',
    lastmod: lastCommitDate(`${DOCS_DIR}/${file}`) || today,
  })),
];

const docsXml = docsEntries
  .filter((entry) => !documentedBefore.includes(entry.path))
  .map(
    (entry) => `  <url>
    <loc>${SITE_URL}${entry.path}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n');

const withDocs = docsXml ? sitemap.replace('</urlset>', `${docsXml}\n</urlset>`) : sitemap;

const expectedPaths = ['/', ...playgroundPaths, '/docs', ...docSlugs.map((slug) => `/docs/${slug}`)];
const documentedPaths = [...withDocs.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => new URL(match[1]).pathname,
);
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

const updated = withDocs.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  if (block.includes('<lastmod>')) return block;
  return block.replace('</loc>', `</loc>\n    <lastmod>${lastmod}</lastmod>`);
});

await writeFile(SITEMAP_PATH, updated);
console.log(
  `Sitemap: ${expectedPaths.length} rutas validadas (${docsEntries.length} de docs, lastmod ${lastmod})`,
);
