import { Link } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { resolveDocHref } from '@/docs/content';

const components: Components = {
  a({ href, title, children }) {
    const resolved = resolveDocHref(href ?? '');

    if (resolved.kind === 'internal') {
      return (
        <Link to={resolved.to} title={title}>
          {children}
        </Link>
      );
    }

    if (resolved.kind === 'external') {
      return (
        <a href={href} title={title} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }

    return (
      <a href={href} title={title}>
        {children}
      </a>
    );
  },
  img({ src, alt, title }) {
    return <img src={src} alt={alt ?? ''} title={title} loading="lazy" className="rounded-md border" />;
  },
  table({ children }) {
    return (
      <div className="my-6 overflow-x-auto">
        <table>{children}</table>
      </div>
    );
  },
};

export function Markdown({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
