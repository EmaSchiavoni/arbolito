import * as React from 'react';
import { Link } from 'react-router-dom';
import { Maximize, Save, Share2 } from 'lucide-react';
import { setNavSource, trackUi } from '@/common/analytics';
import { Logo } from '@/common/components/Logo';
import { ThemeToggle } from '@/common/components/ThemeToggle';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { DropdownMenu } from '@/common/components/ui/dropdown-menu';
import { cn } from '@/common/lib/utils';
import type { Mode, PlaygroundDefinition } from '@/common/playground';
import { useChrome } from '@/app/use-chrome';
import { IconButton } from './IconButton';
import { MenuButton } from './MenuButton';
import { PlaygroundMenu } from './PlaygroundMenu';

interface AppShellHeaderProps {
  playground: PlaygroundDefinition;
  mode: Mode;
  modeSearch: string;
  isSmall: boolean;
  canShare: boolean;
  canSave: boolean;
  config?: React.ReactNode;
  headerRef: React.RefObject<HTMLElement | null>;
  menu: React.ReactNode;
  onShare: () => void;
  onSave: () => void;
  onHideHeader: () => void;
}

export function AppShellHeader({
  playground,
  mode,
  modeSearch,
  isSmall,
  canShare,
  canSave,
  config,
  headerRef,
  menu,
  onShare,
  onSave,
  onHideHeader,
}: AppShellHeaderProps) {
  const { dark, toggleTheme } = useChrome();
  const other: Mode = mode === 'auto' ? 'manual' : 'auto';
  const OtherIcon = playground.modes[other].icon;

  return (
    <header ref={headerRef} className="shrink-0 border-b bg-background">
      <div className="flex items-center gap-2 px-3 py-2">
        <Link to="/" aria-label="Ir a la landing">
          <Logo />
        </Link>

        {isSmall ? (
          <div className="ml-auto flex min-w-0 items-center gap-1">
            <PlaygroundMenu playground={playground} mode={mode} />
            <DropdownMenu>
              <MenuButton variant="outline" />
              {menu}
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
                <IconButton variant="default" onClick={onSave} label="Guardar árbol compartido">
                  <Save />
                </IconButton>
              )}
              <IconButton variant="outline" onClick={onShare} disabled={!canShare} label="Compartir árbol">
                <Share2 />
              </IconButton>
              <ThemeToggle
                dark={dark}
                onToggle={() => {
                  trackUi('theme', { value: dark ? 'light' : 'dark' });
                  toggleTheme();
                }}
              />
              <IconButton variant="outline" onClick={onHideHeader} label="Pantalla completa">
                <Maximize />
              </IconButton>
            </div>

            <div className="flex items-center gap-2">{config}</div>
          </div>
        )}
      </div>
    </header>
  );
}
