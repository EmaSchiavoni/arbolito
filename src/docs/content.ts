// Motor de la documentación: toma los markdown de /docs, deriva el slug y los
// metadatos de cada página y los expone ordenados por nombre de archivo.
// No hay frontmatter: el título es el primer H1 y la descripción el primer
// párrafo. Los archivos que empiezan con "_" no se publican.

const MODULES = import.meta.glob('/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const INDEX_FILE = '/docs/README.md';
const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

export interface DocEntry {
  slug: string;
  file: string;
  title: string;
  description: string;
  markdown: string;
}

export type DocHref =
  | { kind: 'anchor' }
  | { kind: 'external' }
  | { kind: 'internal'; to: string };

function basename(file: string): string {
  return file.split('/').pop() ?? file;
}

function withoutPrefix(name: string): string {
  return name.replace(/\.md$/i, '').replace(/^\d+[-_]/, '');
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function humanize(file: string): string {
  const name = withoutPrefix(basename(file)).replace(/[-_]+/g, ' ').trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Reemplaza los bloques de código por espacios conservando los saltos de línea
// para que las posiciones sigan siendo válidas.
function maskFences(markdown: string): string {
  return markdown.replace(
    /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm,
    (block) => block.replace(/[^\n]/g, ' '),
  );
}

function plainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findDescription(markdown: string, from: number): string {
  const lines = markdown.slice(from).split(/\r?\n/);
  const paragraph: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (paragraph.length > 0) break;
      continue;
    }

    const isBlock =
      /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||<|```|~~~|!\[|\[!\[)/.test(line) ||
      /^\[[^\]]+\]:/.test(line);

    if (isBlock) {
      if (paragraph.length > 0) break;
      continue;
    }

    paragraph.push(line);
  }

  return paragraph.length > 0 ? plainText(paragraph.join(' ')) : '';
}

function parseDoc(file: string, markdown: string): Omit<DocEntry, 'slug'> {
  const masked = maskFences(markdown);
  const titleMatch = masked.match(/^ {0,3}#\s+(.+?)\s*#*\s*$/m);
  const title = titleMatch ? plainText(titleMatch[1]) : humanize(file);
  const description = findDescription(
    masked,
    titleMatch?.index !== undefined ? titleMatch.index + titleMatch[0].length : 0,
  );

  return {
    file,
    title: title || humanize(file),
    description,
    markdown,
  };
}

function slugFromFile(file: string): string {
  return slugify(withoutPrefix(basename(file)));
}

const docEntries = Object.entries(MODULES)
  .filter(([file]) => file !== INDEX_FILE)
  .filter(([file]) => {
    const name = basename(file);
    return !name.startsWith('_') && !name.startsWith('.');
  })
  .sort(([a], [b]) => collator.compare(basename(a), basename(b)))
  .map(([file, markdown]) => ({ slug: slugFromFile(file), ...parseDoc(file, markdown) }));

const seen = new Set<string>();
for (const doc of docEntries) {
  if (seen.has(doc.slug)) {
    throw new Error(`Documentación duplicada: dos archivos generan el slug "${doc.slug}".`);
  }
  seen.add(doc.slug);
}

export const DOCS: DocEntry[] = docEntries;

const indexMarkdown =
  MODULES[INDEX_FILE] ??
  '# Documentación\n\nDocumentación para desarrolladores que quieran colaborar en el proyecto.';
const indexMeta = parseDoc(INDEX_FILE, indexMarkdown);

export const DOCS_INDEX = {
  title: indexMeta.title,
  description: indexMeta.description,
  markdown: indexMarkdown,
};

const BY_SLUG = new Map(DOCS.map((doc) => [doc.slug, doc]));

export function getDoc(slug: string | undefined): DocEntry | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? null;
}

/**
 * Resuelve un href de markdown. Los enlaces relativos a otro `.md` se
 * convierten en rutas internas de la documentación; los absolutos y los
 * externos conservan su destino.
 */
export function resolveDocHref(href: string): DocHref {
  if (!href || href.startsWith('#')) return { kind: 'anchor' };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return { kind: 'external' };

  const markdownLink = href.match(/^([^?#]*\.md)([?#].*)?$/i);
  if (markdownLink) {
    const name = markdownLink[1].split('/').pop() ?? '';
    const suffix = markdownLink[2] ?? '';
    if (/^readme\.md$/i.test(name)) return { kind: 'internal', to: `/docs${suffix}` };
    return {
      kind: 'internal',
      to: `/docs/${slugify(name.replace(/\.md$/i, '').replace(/^\d+[-_]/, ''))}${suffix}`,
    };
  }

  if (href.startsWith('/')) return { kind: 'internal', to: href };
  return { kind: 'anchor' };
}
