import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  Maximize,
  Minimize,
  Moon,
  Save,
  Share2,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { canNativeShare, shareNative } from 'react-share';
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
import { SaveSharedTreeDialog } from '../common/components/SaveSharedTreeDialog';
import { ShareDialog } from '../common/components/ShareDialog';
import { SharedTreeNotice } from '../common/components/SharedTreeNotice';
import { ThemeToggle } from '../common/components/ThemeToggle';
import { toast } from '../common/components/ui/use-toast';
import { setNavSource, trackUi } from '../common/analytics';
import { useMediaQuery } from '../common/hooks/use-media-query';
import type { Mode, PlaygroundDefinition } from '../common/playground';
import { buildShareQuery } from '../common/share/codec';
import { useSharedSession } from '../common/share/session-context';
import type { PlaygroundShareAdapter } from '../common/share/types';
import { useChrome } from './use-chrome';
import { getPlayground, PLAYGROUNDS } from './registry';

export interface AppShellShare {
  adapter: PlaygroundShareAdapter;
  state: unknown;
}

export interface AppShellProps {
  playgroundId: string;
  mode: Mode;
  config?: React.ReactNode;
  share?: AppShellShare;
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
  modeSearch,
  canShare,
  canSave,
  onShare,
  onSave,
  onOpenConfig,
  onOpenPlaygrounds,
}: {
  playground: PlaygroundDefinition;
  mode: Mode;
  modeSearch: string;
  canShare: boolean;
  canSave: boolean;
  onShare: () => void;
  onSave: () => void;
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
        <Link to={`/${playground.id}/${other}${modeSearch}`} onClick={() => setNavSource('header')}>
          <OtherIcon />
          Ir a modo {playground.modes[other].label.toLowerCase()}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canShare} onSelect={onShare}>
        <Share2 />
        Compartir árbol
      </DropdownMenuItem>
      {canSave && (
        <DropdownMenuItem onSelect={onSave}>
          <Save />
          Guardar árbol compartido
        </DropdownMenuItem>
      )}
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
export function AppShell({ playgroundId, mode, config, share }: AppShellProps) {
  const playground = getPlayground(playgroundId) ?? PLAYGROUNDS[0];
  const { hidden, showHeader, hideHeader, dark, toggleTheme } = useChrome();
  const [configOpen, setConfigOpen] = React.useState(false);
  const [playgroundsOpen, setPlaygroundsOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const isSmall = useMediaQuery('(max-width: 639px)');
  const routerLocation = useLocation();
  const session = useSharedSession();
  // Un cambio de modo dentro del mismo playground conserva el enlace.
  const modeSearch = session.active ? routerLocation.search : '';
  const other: Mode = mode === 'auto' ? 'manual' : 'auto';
  const OtherIcon = playground.modes[other].icon;
  const canShare = !!share && !share.adapter.isEmpty(mode, share.state);
  const noticeVisible = !!share && session.active && session.status === 'protected';
  const canSave = noticeVisible && !!share;

  async function launchShare() {
    if (!share || !canShare) return;
    const data = share.adapter.serialize(mode, share.state);
    if (!data) {
      toast({ description: 'No se pudo preparar el árbol para compartirlo.' });
      return;
    }
    const query = buildShareQuery({ tree: playground.id, mode, ...data });
    if (!query) {
      toast({ description: 'El árbol es demasiado grande para compartirlo por enlace.' });
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    trackUi('share', { playground: playground.id, mode });
    // La API nativa necesita conservar la activación de usuario: todo el
    // camino hasta acá es síncrono.
    if (canNativeShare({ url, title: 'Arbolito' })) {
      try {
        await shareNative({ url, title: 'Árbol compartido · Arbolito', text: 'Mirá este árbol en Arbolito.' });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    setShareUrl(url);
    setShareOpen(true);
  }

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
      modeSearch={modeSearch}
      canShare={canShare}
      canSave={canSave}
      onShare={launchShare}
      onSave={() => setSaveOpen(true)}
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
                    to={`/${playground.id}/${other}${modeSearch}`}
                    title={`Ir a modo ${playground.modes[other].label.toLowerCase()}`}
                    onClick={() => setNavSource('header')}
                    className={cn(buttonVariants({ variant: 'ghost' }), 'rounded-full')}
                  >
                    <OtherIcon />
                    <span>Ir a modo {playground.modes[other].label.toLowerCase()}</span>
                  </Link>
                  {canSave && (
                    <IconButton variant="default" onClick={() => setSaveOpen(true)} label="Guardar árbol compartido">
                      <Save />
                    </IconButton>
                  )}
                  <IconButton variant="outline" onClick={launchShare} disabled={!canShare} label="Compartir árbol">
                    <Share2 />
                  </IconButton>
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

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} url={shareUrl ?? ''} />

      <SharedTreeNotice
        visible={noticeVisible}
        minimized={session.minimized}
        onMinimize={session.minimize}
        onExpand={session.expand}
        onSave={() => setSaveOpen(true)}
      />

      <SaveSharedTreeDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        autoLabel={playground.modes.auto.label}
        manualLabel={playground.modes.manual.label}
        onConfirm={(target) => {
          if (share) session.save(share.adapter, target);
        }}
      />
    </>
  );
}
