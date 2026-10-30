import * as React from 'react';
import type { TocItem } from './DocsLayout';

/**
 * Lee los headings ya renderizados para que el TOC use exactamente los ids
 * que genera rehype-slug. `key` reinicia la lectura cuando cambia la página.
 */
export function useDocToc(ref: React.RefObject<HTMLElement | null>, key: string): TocItem[] {
  const [toc, setToc] = React.useState<TocItem[]>([]);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) {
      setToc([]);
      return;
    }

    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')).map(
      (heading) => ({
        id: heading.id,
        text: (heading.textContent ?? '').trim(),
        level: heading.tagName === 'H3' ? 3 : 2,
      }),
    );

    setToc(headings);
  }, [ref, key]);

  return toc;
}
