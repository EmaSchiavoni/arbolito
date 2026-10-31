import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { getPlayground } from '@/app/registry';

const SITE_URL = 'https://arbolito.schiavoni.dev';

export { SITE_URL };

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

const HOME_META: PageMeta = {
  title: 'Visualizador de árboles B y AVL · arbolito',
  description:
    'Visualizador de árboles B y AVL para practicar y visualizar estructuras de datos en el navegador. Inserción, eliminación y búsqueda paso a paso, editor manual y validación de reglas. En español y sin registro.',
  canonical: `${SITE_URL}/`,
};

const PLAYGROUND_META: Record<string, PageMeta> = {
  'btree/auto': {
    title: 'Visualizador de árbol B automático · arbolito',
    description:
      'Visualizador de árboles B: insertá, eliminá y buscá claves paso a paso, mirá divisiones, préstamos y fusiones y configurá el orden p. Practicá y visualizá el árbol resultante sin registro.',
    canonical: `${SITE_URL}/btree/auto`,
  },
  'btree/manual': {
    title: 'Árbol B manual: visualizar y validar · arbolito',
    description:
      'Visualizador de árboles B con editor manual: creá nodos, claves y punteros, arrastrá la estructura y comprobá con Validar que se cumplen todas las reglas. Sin registro.',
    canonical: `${SITE_URL}/btree/manual`,
  },
  'avl/auto': {
    title: 'Visualizador de árbol AVL automático · arbolito',
    description:
      'Visualizador de árboles AVL: insertá y eliminá claves con rotaciones simples y dobles, seguí cada paso y consultá la altura y el factor de balance. Sin registro.',
    canonical: `${SITE_URL}/avl/auto`,
  },
  'avl/manual': {
    title: 'Árbol AVL manual: visualizar y validar · arbolito',
    description:
      'Visualizador de árboles AVL con editor libre: enlazá nodos, arrastrá la estructura y verificá BST, alcanzabilidad, ciclos y factor de balance con Validar.',
    canonical: `${SITE_URL}/avl/manual`,
  },
};

const NOT_FOUND_META: PageMeta = {
  title: 'Página no encontrada · arbolito',
  description: 'La ruta no corresponde a ningún playground de arbolito, el visualizador de árboles B y AVL.',
  canonical: `${SITE_URL}/`,
};

export function resolvePageMeta(pathname: string): PageMeta | null {
  if (pathname === '/docs' || pathname.startsWith('/docs/')) return null;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return HOME_META;
  if (segments.length !== 2) return NOT_FOUND_META;

  const [id, mode] = segments;
  const playground = getPlayground(id);
  if (!playground || (mode !== 'auto' && mode !== 'manual')) return NOT_FOUND_META;

  const meta = PLAYGROUND_META[`${playground.id}/${mode}`];
  return meta ?? HOME_META;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function applyPageMeta(meta: PageMeta) {
  document.title = meta.title;
  setMeta('name', 'description', meta.description);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', meta.canonical);
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = meta.canonical;
}

// Mantiene sincronizadas las etiquetas de la ruta activa. Un enlace compartido
// conserva la URL canónica limpia, sin la query del árbol.
export function usePageMeta() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    const meta = resolvePageMeta(pathname);
    if (meta) applyPageMeta(meta);
  }, [pathname]);
}
