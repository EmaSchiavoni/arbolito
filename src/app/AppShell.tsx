import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  Maximize,
  Minimize,
  Moon,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { Button } from '../common/components/ui/button';
import { buttonVariants } from '../common/components/ui/button-variants';
import { cn } from '../common/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../common/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../common/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../common/components/ui/tooltip';
import { Logo } from '../common/components/Logo';
import { ThemeToggle } from '../common/components/ThemeToggle';
import { setNavSource, trackUi } from '../common/analytics';
import { useMediaQuery } from '../common/hooks/use-media-query';
import type { Mode, PlaygroundDefinition } from '../common/playground';
import { useChrome } from './use-chrome';
import { getPlayground, PLAYGROUNDS } from './registry';

export interface AppShellProps {
  playgroundId: string;
  mode: Mode;
  config?: React.ReactNode;
}

interface IconButtonProps extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  label: string;
  children: React.ReactNode;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ label, children, ...props }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button ref={ref} size="icon" aria-label={label} {...props}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
));
IconButton.displayName = 'IconButton';

function MenuButton({ variant, className }: { variant: 'ghost' | 'outline'; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className={className} aria-label="Más opciones">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent>Más opciones</TooltipContent>
    </Tooltip>
  );
}

function PlaygroundMenu({ playground, mode }: { playground: PlaygroundDefinition; mode: Mode }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full" aria-label="Cambiar de playground">
              <span>{playground.title}</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Cambiar de playground</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Playgrounds</DropdownMenuLabel>
        {PLAYGROUNDS.map((p) => (
          <DropdownMenuItem key={p.id} asChild>
            <Link
              to={`/${p.id}/${mode}`}
              onClick={() => setNavSource('header')}
              className={p.id === playground.id ? 'font-medium' : undefined}
            >
              <span className="min-w-0 flex-1">
                <span className="block">{p.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.description}</span>
              </span>
              {p.id === playground.id && <span className="text-xs text-muted-foreground">actual</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChromeMenu({
  playground,
  mode,
  onOpenConfig,
  onOpenPlaygrounds,
}: {
  playground: PlaygroundDefinition;
  mode: Mode;
  onOpenConfig: () => void;
  onOpenPlaygrounds: () => void;
}) {
  const { dark, toggleTheme } = useChrome();
  const other: Mode = mode === 'auto' ? 'manual' : 'auto';
  const OtherIcon = playground.modes[other].icon;
  return (
    <DropdownMenuContent align="end" className="w-60">
      <DropdownMenuItem onSelect={onOpenPlaygrounds}>
        <span className="font-mono text-xs font-bold">{PLAYGROUNDS.map((p) => p.short).join(' / ')}</span>
        Cambiar de playground
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to={`/${playground.id}/${other}`} onClick={() => setNavSource('header')}>
          <OtherIcon />
          Ir a modo {playground.modes[other].label.toLowerCase()}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          trackUi('theme', { value: dark ? 'light' : 'dark' });
          toggleTheme();
        }}
      >
        {dark ? <Sun /> : <Moon />}
        {dark ? 'Tema claro' : 'Tema oscuro'}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          trackUi('settings_open', { source: 'menu' });
          onOpenConfig();
        }}
      >
        <SlidersHorizontal />
        Mostrar configuración
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

// Header global: logo, selector de playground, cambio de modo y configuración.
// En mobile (y en modo inmersivo) todo se concentra en menús.
export function AppShell({ playgroundId, mode, config }: AppShellProps) {
  const playground = getPlayground(playgroundId) ?? PLAYGROUNDS[0];
  const { hidden, showHeader, hideHeader, dark, toggleTheme } = useChrome();
  const [configOpen, setConfigOpen] = React.useState(false);
  const [playgroundsOpen, setPlaygroundsOpen] = React.useState(false);
  const isSmall = useMediaQuery('(max-width: 639px)');
  const other: Mode = mode === 'auto' ? 'manual' : 'auto';
  const OtherIcon = playground.modes[other].icon;

  function showHeaderTop() {
    setConfigOpen(false);
    setPlaygroundsOpen(false);
    trackUi('fullscreen', { value: 'off' });
    showHeader();
  }

  function hideHeaderTop() {
    setConfigOpen(false);
    setPlaygroundsOpen(false);
    trackUi('fullscreen', { value: 'on' });
    hideHeader();
  }

  const chromeMenu = (
    <ChromeMenu
      playground={playground}
      mode={mode}
      onOpenConfig={() => setConfigOpen(true)}
      onOpenPlaygrounds={() => setPlaygroundsOpen(true)}
    />
  );

  return (
    <>
      {hidden ? (
        <>
          {!configOpen && !playgroundsOpen && (
            <div className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur">
              <IconButton variant="ghost" onClick={showHeaderTop} label="Salir de pantalla completa">
                <Minimize />
              </IconButton>
              <DropdownMenu>
                <MenuButton variant="ghost" />
                {chromeMenu}
              </DropdownMenu>
            </div>
          )}
        </>
      ) : (
        <header className="shrink-0 border-b bg-background">
          <div className="flex items-center gap-2 px-3 py-2">
            <Link to="/" aria-label="Ir a la landing">
              <Logo />
            </Link>

            {isSmall ? (
              <div className="ml-auto flex min-w-0 items-center gap-1">
                <PlaygroundMenu playground={playground} mode={mode} />
                <DropdownMenu>
                  <MenuButton variant="outline" />
                  {chromeMenu}
                </DropdownMenu>
              </div>
            ) : (
              <div className="ml-auto flex min-w-0 flex-1 flex-col items-end gap-2">
                <div className="flex items-center gap-1">
                  <PlaygroundMenu playground={playground} mode={mode} />
                  <Link
                    to={`/${playground.id}/${other}`}
                    title={`Ir a modo ${playground.modes[other].label.toLowerCase()}`}
                    onClick={() => setNavSource('header')}
                    className={cn(buttonVariants({ variant: 'ghost' }), 'rounded-full')}
                  >
                    <OtherIcon />
                    <span>Ir a modo {playground.modes[other].label.toLowerCase()}</span>
                  </Link>
                  <ThemeToggle
                    dark={dark}
                    onToggle={() => {
                      trackUi('theme', { value: dark ? 'light' : 'dark' });
                      toggleTheme();
                    }}
                  />
                  <IconButton variant="outline" onClick={hideHeaderTop} label="Pantalla completa">
                    <Maximize />
                  </IconButton>
                </div>

                <div className="flex items-center gap-2">{config}</div>
              </div>
            )}
          </div>
        </header>
      )}

      <Sheet open={configOpen} onOpenChange={setConfigOpen} modal={false}>
        <SheetContent
          side="top"
          overlay={false}
          showClose={false}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="rounded-none border-b p-0 shadow-sm data-[state=closed]:duration-200 data-[state=open]:duration-200"
        >
          <SheetDescription className="sr-only">Configuración del árbol</SheetDescription>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <SheetTitle className="text-sm font-medium">{playground.title}</SheetTitle>
            <div className="flex items-center gap-1">
              {hidden && (
                <IconButton variant="outline" onClick={showHeaderTop} label="Salir de pantalla completa">
                  <Minimize />
                </IconButton>
              )}
              <IconButton variant="ghost" onClick={() => setConfigOpen(false)} label="Ocultar configuración">
                <ChevronUp />
              </IconButton>
            </div>
          </div>
          <div className="px-3 pb-3">{config}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={playgroundsOpen} onOpenChange={setPlaygroundsOpen} modal={false}>
        <SheetContent
          side="top"
          overlay={false}
          showClose={false}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="rounded-none border-b p-0 shadow-sm"
        >
          <SheetDescription className="sr-only">Cambiar de playground</SheetDescription>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <SheetTitle className="text-sm font-medium">Playgrounds</SheetTitle>
            <IconButton variant="ghost" onClick={() => setPlaygroundsOpen(false)} label="Ocultar playgrounds">
              <ChevronUp />
            </IconButton>
          </div>
          <div className="space-y-1 px-3 pb-3">
            {PLAYGROUNDS.map((p) => (
              <Link
                key={p.id}
                to={`/${p.id}/${mode}`}
                onClick={() => {
                  setNavSource('header');
                  setPlaygroundsOpen(false);
                }}
                className="flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="mt-0.5 font-mono text-xs font-bold">{p.short}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{p.title}</span>
                  <span className="block text-xs text-muted-foreground">{p.description}</span>
                </span>
                {p.id === playground.id && <span className="text-xs text-muted-foreground">actual</span>}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
