import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu } from 'lucide-react';
import { GithubMark } from '@/common/components/GithubMark';
import { Logo } from '@/common/components/Logo';
import { ThemeToggle } from '@/common/components/ThemeToggle';
import { Button } from '@/common/components/ui/button';
import { buttonVariants } from '@/common/components/ui/button-variants';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/common/components/ui/sheet';
import { cn } from '@/common/lib/utils';
import { REPO_URL } from '@/common/repo';
import { trackUi } from '@/common/analytics';
import { GLOBAL_KEYS } from '@/common/storage/keys';
import { load } from '@/common/storage/storage';
import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import { useChrome } from '@/app/use-chrome';
import { DOCS } from '@/docs/content';
import './docs.css';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function DocsNav({ activeSlug, onNavigate }: { activeSlug: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentación" className="space-y-6">
      <Link
        to="/docs"
        onClick={onNavigate}
        className={cn(
          'block rounded-md px-3 py-2 text-sm transition-colors',
          activeSlug === null
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        Inicio
      </Link>

      <div>
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Páginas
        </p>
        <ul className="mt-2 space-y-0.5">
          {DOCS.map((doc) => (
            <li key={doc.slug}>
              <Link
                to={`/docs/${doc.slug}`}
                onClick={onNavigate}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm leading-snug transition-colors',
                  activeSlug === doc.slug
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {doc.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          En esta página
        </p>
        <ul className="mt-3 space-y-2 border-l">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'block border-l border-transparent py-0.5 pr-2 text-xs leading-snug text-muted-foreground transition-colors hover:text-foreground',
                  item.level === 3 ? 'pl-5' : 'pl-3',
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function DocsLayout({ children, toc = [] }: { children: React.ReactNode; toc?: TocItem[] }) {
  const { pathname } = useLocation();
  const { dark, toggleTheme } = useChrome();
  const [navOpen, setNavOpen] = React.useState(false);
  const activeSlug =
    pathname === '/docs' || pathname === '/docs/' ? null : pathname.split('/')[2] || null;

  const lastId = load<string>(GLOBAL_KEYS.lastPlayground, PLAYGROUNDS[0].id);
  const last = getPlayground(lastId) ?? PLAYGROUNDS[0];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir navegación de la documentación"
          >
            <Menu />
          </Button>

          <Link to="/" aria-label="Volver al inicio de arbolito" className="shrink-0">
            <Logo />
          </Link>
          <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Docs
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to={`/${last.id}/auto`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden rounded-full sm:inline-flex')}
            >
              Abrir playground
              <ArrowUpRight />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Ver el repositorio en GitHub"
              className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
            >
              <GithubMark className="size-4" />
            </a>
            <ThemeToggle
              dark={dark}
              onToggle={() => {
                trackUi('theme', { value: dark ? 'light' : 'dark' });
                toggleTheme();
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-10 px-4 py-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <DocsNav activeSlug={activeSlug} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

        <Toc items={toc} />
      </div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>Documentación</SheetTitle>
            <SheetDescription className="sr-only">Páginas de la documentación</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <DocsNav activeSlug={activeSlug} onNavigate={() => setNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
