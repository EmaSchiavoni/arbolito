import * as React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { applyPageMeta, SITE_URL } from '@/app/seo';
import { DocsLayout } from '@/docs/DocsLayout';
import { Markdown } from '@/docs/Markdown';
import { DOCS, getDoc } from '@/docs/content';
import { useDocToc } from '@/docs/use-doc-toc';

const NOT_FOUND_META = {
  title: 'Página no encontrada — Documentación — arbolito',
  description: 'La página de documentación que buscás no existe o fue movida.',
  canonical: `${SITE_URL}/docs`,
};

const ARTICLE_CLASS =
  'docs-prose prose prose-zinc max-w-3xl dark:prose-invert prose-headings:font-sans prose-headings:tracking-tight prose-h1:font-semibold prose-h2:font-medium prose-h3:font-medium prose-h4:font-medium prose-h5:font-medium prose-h6:font-medium prose-a:font-medium prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none';

export function DocsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const doc = getDoc(slug);
  const articleRef = React.useRef<HTMLElement | null>(null);
  const toc = useDocToc(articleRef, doc?.slug ?? 'not-found');

  React.useEffect(() => {
    if (!doc) {
      applyPageMeta(NOT_FOUND_META);
      return;
    }

    applyPageMeta({
      title: `${doc.title} — Documentación — arbolito`,
      description: doc.description || 'Documentación para desarrolladores de arbolito.',
      canonical: `${SITE_URL}/docs/${doc.slug}`,
    });
  }, [doc]);

  React.useEffect(() => {
    if (!doc) return;

    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) return;

    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });

    return () => cancelAnimationFrame(frame);
  }, [doc, hash]);

  if (!doc) {
    return (
      <DocsLayout>
        <div className="max-w-3xl">
          <h1 className="font-sans text-2xl font-semibold tracking-tight">Página no encontrada</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            La documentación que buscás no existe o cambió de nombre.
          </p>
          <Link
            to="/docs"
            className="mt-6 inline-flex text-sm font-medium underline underline-offset-4"
          >
            Volver a la documentación
          </Link>
        </div>
      </DocsLayout>
    );
  }

  const index = DOCS.findIndex((entry) => entry.slug === doc.slug);
  const previous = index > 0 ? DOCS[index - 1] : null;
  const next = index >= 0 && index < DOCS.length - 1 ? DOCS[index + 1] : null;

  return (
    <DocsLayout toc={toc}>
      <article ref={articleRef} className={ARTICLE_CLASS}>
        <Markdown markdown={doc.markdown} />
      </article>

      <nav className="mt-12 flex max-w-3xl flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Link to={`/docs/${previous.slug}`} className="group inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Anterior
              </span>
              <span className="text-foreground">{previous.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            to={`/docs/${next.slug}`}
            className="group inline-flex items-center gap-2 text-sm sm:ml-auto sm:text-right"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Siguiente
              </span>
              <span className="text-foreground">{next.title}</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </nav>
    </DocsLayout>
  );
}
