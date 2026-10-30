import * as React from 'react';
import { Link } from 'react-router-dom';
import { applyPageMeta, SITE_URL } from '../app/seo';
import { DocsLayout } from './DocsLayout';
import { Markdown } from './Markdown';
import { DOCS, DOCS_INDEX } from './content';
import { useDocToc } from './use-doc-toc';

const INDEX_META = {
  title: 'Documentación para desarrolladores — arbolito',
  description:
    'Guía para desarrolladores que quieran colaborar en arbolito: arquitectura, modelos de árboles, estado, UI y convenciones del proyecto.',
  canonical: `${SITE_URL}/docs`,
};

export function DocsIndex() {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const toc = useDocToc(contentRef, 'index');

  React.useEffect(() => {
    applyPageMeta(INDEX_META);
  }, []);

  return (
    <DocsLayout toc={toc}>
      <div ref={contentRef}>
        <article className="docs-prose prose prose-zinc max-w-3xl dark:prose-invert prose-headings:font-sans prose-headings:tracking-tight prose-h1:font-semibold prose-h2:font-medium prose-h3:font-medium prose-h4:font-medium prose-h5:font-medium prose-h6:font-medium prose-a:font-medium prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
          <Markdown markdown={DOCS_INDEX.markdown} />
        </article>

        <section className="mt-12 max-w-3xl">
          <h2 id="paginas" className="font-sans text-lg font-medium tracking-tight">
            Páginas
          </h2>
          {DOCS.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Todavía no hay páginas. Agregá un archivo <code className="font-mono">.md</code> en{' '}
              <code className="font-mono">docs/</code>.
            </p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {DOCS.slice(0, 4).map((doc) => (
                  <Link
                    key={doc.slug}
                    to={`/docs/${doc.slug}`}
                    className="group rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30"
                  >
                    <span className="block font-medium">{doc.title}</span>
                    {doc.description && (
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        {doc.description}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              {DOCS.length > 4 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  El resto de las páginas está en el menú de navegación.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </DocsLayout>
  );
}
