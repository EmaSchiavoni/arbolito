import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useChrome } from '@/app/use-chrome';
import { setNavSource, trackLandingCta, trackOutbound, trackUi } from '@/common/analytics';
import { Logo } from '@/common/components/Logo';
import { ThemeToggle } from '@/common/components/ThemeToggle';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { cn } from '@/common/lib/utils';
import type { PlaygroundDefinition } from '@/common/playground';
import { REPO_URL } from '@/common/repo';
import { GithubMark } from '@/landing/TreeArt';

export function LandingHeader({ last }: { last: PlaygroundDefinition }) {
  const { dark, toggleTheme } = useChrome();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:px-4">
        <Link
          to="/"
          aria-label="Arbolito, inicio"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="shrink-0"
        >
          <Logo />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <a
            href="#proyecto"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Proyecto
          </a>
          <a
            href="#tipos"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Árboles
          </a>
          <a
            href="#playgrounds"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Playgrounds
          </a>
          <a
            href="#open-source"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Open source
          </a>
          <Link
            to="/docs"
            onClick={() => trackLandingCta('docs', 'header')}
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Documentación
          </Link>
          <a
            href="https://schiavoni.dev/?utm_source=arbolito&utm_medium=header"
            target="_blank"
            rel="me noreferrer"
            onClick={() => trackOutbound('schiavoni.dev', 'header')}
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Autor
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle
            dark={dark}
            onToggle={() => {
              trackUi('theme', { value: dark ? 'light' : 'dark' });
              toggleTheme();
            }}
          />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Ver el repositorio en GitHub"
            onClick={() => trackOutbound('github', 'header')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'px-3')}
          >
            <GithubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link
            to={`/${last.id}/auto`}
            onClick={() => setNavSource('landing')}
            className={cn(buttonVariants({ size: 'sm' }), 'px-3')}
          >
            <span className="hidden sm:inline">Abrir</span>
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </header>
  );
}
