import { Link } from 'react-router-dom';
import { BookOpen, Copy, Moon, Save, Share2, SlidersHorizontal, Sun } from 'lucide-react';
import { setNavSource, trackUi } from '@/common/analytics';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/common/components/ui/dropdown-menu';
import type { Mode, PlaygroundDefinition } from '@/common/playground';
import { useChrome } from '@/app/use-chrome';
import { PLAYGROUNDS } from '@/app/registry';

interface ChromeMenuProps {
  playground: PlaygroundDefinition;
  mode: Mode;
  modeSearch: string;
  canShare: boolean;
  canSave: boolean;
  onShare: () => void;
  onCopyLink: () => void;
  onSave: () => void;
  onOpenConfig: () => void;
  onOpenPlaygrounds: () => void;
}

export function ChromeMenu({
  playground,
  mode,
  modeSearch,
  canShare,
  canSave,
  onShare,
  onCopyLink,
  onSave,
  onOpenConfig,
  onOpenPlaygrounds,
}: ChromeMenuProps) {
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
      <DropdownMenuItem asChild>
        <Link to="/docs">
          <BookOpen />
          Documentación
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canShare} onSelect={onShare}>
        <Share2 />
        Compartir árbol
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canShare} onSelect={onCopyLink}>
        <Copy />
        Copiar enlace
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
