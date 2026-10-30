import * as React from 'react';
import { Minimize } from 'lucide-react';
import { DropdownMenu } from '@/common/components/ui/dropdown-menu';
import { IconButton } from './IconButton';
import { MenuButton } from './MenuButton';

export function ImmersiveCluster({ menu, onShowHeader }: { menu: React.ReactNode; onShowHeader: () => void }) {
  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur">
      <IconButton variant="ghost" onClick={onShowHeader} label="Salir de pantalla completa">
        <Minimize />
      </IconButton>
      <DropdownMenu>
        <MenuButton variant="ghost" />
        {menu}
      </DropdownMenu>
    </div>
  );
}
