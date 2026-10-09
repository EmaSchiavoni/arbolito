import * as React from 'react';
import {
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { HeaderBadges } from './HeaderBadges';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useMediaQuery } from '../lib/use-media-query';

export interface ShellProps {
  hidden: boolean;
  onShowHeader: () => void;
  onHideHeader: () => void;
  tab: string;
  onToggleTab: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}

interface AppShellProps extends ShellProps {
  info: React.ReactNode;
  config: React.ReactNode;
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

function ChromeMenu({
  tab,
  dark,
  onToggleTab,
  onToggleTheme,
  onOpenConfig,
}: {
  tab: string;
  dark: boolean;
  onToggleTab: () => void;
  onToggleTheme: () => void;
  onOpenConfig: () => void;
}) {
  return (
    <DropdownMenuContent align="end" className="w-60">
      <DropdownMenuItem onSelect={onToggleTab}>
        {tab === 'auto' ? <PencilRuler /> : <Network />}
        {tab === 'auto' ? 'Ir a modo manual' : 'Ir a modo automático'}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onToggleTheme}>
        {dark ? <Sun /> : <Moon />}
        {dark ? 'Tema claro' : 'Tema oscuro'}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onOpenConfig}>
        <SlidersHorizontal />
        Mostrar configuración
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

// Header global del playground. En desktop muestra logo, configuración y
// controles en la primera fila, y badges en la segunda. En mobile (y en modo
// inmersivo) concentra el resto en un menú de tres puntos; los badges quedan
// siempre visibles.
export function AppShell({ hidden, onShowHeader, onHideHeader, tab, onToggleTab, dark, onToggleTheme, info, config }: AppShellProps) {
  const [configOpen, setConfigOpen] = React.useState(false);
  const isSmall = useMediaQuery('(max-width: 639px)');

  function showHeader() {
    setConfigOpen(false);
    onShowHeader();
  }

  function hideHeader() {
    setConfigOpen(false);
    onHideHeader();
  }

  const menu = (
    <ChromeMenu
      tab={tab}
      dark={dark}
      onToggleTab={onToggleTab}
      onToggleTheme={onToggleTheme}
      onOpenConfig={() => setConfigOpen(true)}
    />
  );

  return (
    <>
      {hidden ? (
        <>
          <div className="pointer-events-none fixed left-3 top-3 z-40 flex w-max max-w-[calc(100vw-7rem)] min-w-0 items-center gap-2">
            <HeaderBadges align="start">{info}</HeaderBadges>
          </div>

          {!configOpen && (
            <div className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur">
              <IconButton variant="ghost" onClick={showHeader} label="Salir de pantalla completa">
                <Minimize />
              </IconButton>
              <DropdownMenu>
                <MenuButton variant="ghost" />
                {menu}
              </DropdownMenu>
            </div>
          )}
        </>
      ) : (
        <header className="shrink-0 border-b bg-background">
          <div className="flex flex-col gap-4 px-3 py-2">
            {isSmall ? (
              <div className="flex items-center gap-2">
                <Logo />
                <DropdownMenu>
                  <MenuButton variant="outline" className="ml-auto" />
                  {menu}
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Logo />

                <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-2">{config}</div>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-1">
                    <Button
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
                    <IconButton variant="outline" onClick={hideHeader} label="Pantalla completa">
                      <Maximize />
                    </IconButton>
                  </div>
                </div>
              </div>
            )}

            <HeaderBadges align="end">{info}</HeaderBadges>
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
            <SheetTitle className="text-sm font-medium">Configuración</SheetTitle>
            <div className="flex items-center gap-1">
              {hidden && (
                <IconButton variant="outline" onClick={showHeader} label="Salir de pantalla completa">
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
    </>
  );
}
