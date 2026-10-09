import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  EllipsisVertical,
  Maximize,
  Minimize,
  Moon,
  Network,
  PencilRuler,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';

export interface ChromeProps {
  hidden: boolean;
  onShowHeader: () => void;
  onHideHeader: () => void;
  tab: string;
  onToggleTab: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}

interface AppChromeProps extends ChromeProps {
  info: React.ReactNode;
  config: React.ReactNode;
}

function MenuItem({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {icon}
      {children}
    </button>
  );
}

// Header global del playground. En desktop muestra logo, configuración y
// controles en la primera fila, y badges en la segunda. En mobile (y en modo
// inmersivo) concentra el resto en un menú de tres puntos; los badges quedan
// siempre visibles.
export function AppChrome({ hidden, onShowHeader, onHideHeader, tab, onToggleTab, dark, onToggleTheme, info, config }: AppChromeProps) {
  const [configOpen, setConfigOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [badgesExpanded, setBadgesExpanded] = React.useState(false);
  const [badgesOverflow, setBadgesOverflow] = React.useState(false);
  const [isSmall, setIsSmall] = React.useState(
    () => window.matchMedia?.('(max-width: 639px)').matches ?? false,
  );
  const menuRef = React.useRef<HTMLDivElement>(null);
  const badgesRef = React.useRef<HTMLDivElement>(null);

  function showHeader() {
    setConfigOpen(false);
    setMenuOpen(false);
    onShowHeader();
  }

  function hideHeader() {
    setConfigOpen(false);
    setMenuOpen(false);
    onHideHeader();
  }

  function openConfig() {
    setMenuOpen(false);
    setConfigOpen(true);
  }

  function switchTab() {
    setMenuOpen(false);
    onToggleTab();
  }

  function switchTheme() {
    setMenuOpen(false);
    onToggleTheme();
  }

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => {
      setIsSmall(mq.matches);
      setMenuOpen(false);
      setConfigOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Detecta si los badges no entran en una sola fila en mobile. Se mide con el
  // contenedor plegado y se vuelve a medir al cambiar el contenido o el tamaño.
  React.useEffect(() => {
    const el = badgesRef.current;
    if (!el) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setBadgesOverflow(el.scrollWidth > el.clientWidth + 1);
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(check);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    schedule();
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [info, badgesExpanded, hidden, isSmall]);

  React.useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!configOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfigOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [configOpen]);

  function renderMenu() {
    return (
      <div
        role="menu"
        className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border bg-card p-1 shadow-lg"
      >
        <MenuItem
          icon={tab === 'auto' ? <PencilRuler className="size-4" /> : <Network className="size-4" />}
          onClick={switchTab}
        >
          {tab === 'auto' ? 'Ir a modo manual' : 'Ir a modo automático'}
        </MenuItem>
        <MenuItem icon={dark ? <Sun className="size-4" /> : <Moon className="size-4" />} onClick={switchTheme}>
          {dark ? 'Tema claro' : 'Tema oscuro'}
        </MenuItem>
        <MenuItem icon={<SlidersHorizontal className="size-4" />} onClick={openConfig}>
          Mostrar configuración
        </MenuItem>
      </div>
    );
  }

  // En desktop los badges se alinean a la derecha; en mobile, a la izquierda.
  // En mobile se recortan a una fila y muestran "Ver más" si no entran.
  function renderBadges(alignEnd: boolean) {
    const justify = alignEnd ? cn('justify-end', 'max-sm:justify-start') : '';
    return (
      <div className={cn('flex min-w-0 items-center gap-2', alignEnd ? 'w-full flex-1 justify-end' : 'max-w-full')}>
        <div
          ref={badgesRef}
          className={cn(
            'flex min-w-0 items-center gap-2 [&>*]:shrink-0 [&>*]:whitespace-nowrap',
            alignEnd && 'flex-1',
            badgesExpanded ? 'flex-wrap' : 'max-sm:flex-nowrap max-sm:overflow-hidden sm:flex-wrap',
            justify,
          )}
        >
          {info}
        </div>
        {(badgesExpanded || badgesOverflow) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBadgesExpanded((v) => !v)}
            className="pointer-events-auto shrink-0 px-2 sm:hidden"
            title={badgesExpanded ? 'Ver menos' : 'Ver más'}
            aria-expanded={badgesExpanded}
          >
            {badgesExpanded ? (
              <>
                <ChevronLeft />
                Ver menos
              </>
            ) : (
              <>
                Ver más
                <ChevronRight />
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {hidden ? (
        <>
          <div className="pointer-events-none fixed left-3 top-3 z-40 flex w-max max-w-[calc(100vw-7rem)] min-w-0 items-center gap-2">
            {renderBadges(false)}
          </div>

          {!configOpen && (
            <div className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                onClick={showHeader}
                title="Salir de pantalla completa"
                aria-label="Salir de pantalla completa"
              >
                <Minimize />
              </Button>
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Más opciones"
                  title="Más opciones"
                >
                  <EllipsisVertical />
                </Button>
                {menuOpen && renderMenu()}
              </div>
            </div>
          )}
        </>
      ) : (
        <header className="shrink-0 border-b bg-background">
          <div className="flex flex-col gap-2 px-3 py-2">
            {isSmall ? (
              <div className="flex items-center gap-2">
                <Logo />
                <div className="relative ml-auto" ref={menuRef}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Más opciones"
                    title="Más opciones"
                  >
                    <EllipsisVertical />
                  </Button>
                  {menuOpen && renderMenu()}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Logo />

                <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-2">{config}</div>

                  <span className="h-6 w-px shrink-0 bg-border" aria-hidden />

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onToggleTab}
                      title={tab === 'auto' ? 'Ir a modo manual' : 'Ir a modo automático'}
                      className="rounded-full"
                    >
                      {tab === 'auto' ? <PencilRuler /> : <Network />}
                      <span className="hidden md:inline">{tab === 'auto' ? 'Ir a modo manual' : 'Ir a modo automático'}</span>
                      <span className="md:hidden">{tab === 'auto' ? 'Manual' : 'Automático'}</span>
                    </Button>
                    <ThemeToggle dark={dark} onToggle={onToggleTheme} />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={hideHeader}
                      title="Pantalla completa"
                      aria-label="Pantalla completa"
                    >
                      <Maximize />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {renderBadges(true)}
          </div>
        </header>
      )}

      {configOpen && (
        <section
          aria-label="Configuración"
          className="animate-slide-down fixed inset-x-0 top-0 z-50 border-b bg-background shadow-sm"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-sm font-medium">Configuración</span>
            <div className="flex items-center gap-1">
              {hidden && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={showHeader}
                  title="Salir de pantalla completa"
                  aria-label="Salir de pantalla completa"
                >
                  <Minimize />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigOpen(false)}
                title="Ocultar configuración"
                aria-label="Ocultar configuración"
              >
                <ChevronUp />
              </Button>
            </div>
          </div>
          <div className="px-3 pb-3">{config}</div>
        </section>
      )}
    </>
  );
}
