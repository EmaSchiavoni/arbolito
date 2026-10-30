import * as React from 'react';
import { ChevronUp, Minimize } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/common/components/ui/sheet';
import type { PlaygroundDefinition } from '@/common/playground';
import { IconButton } from './IconButton';

interface ConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playground: PlaygroundDefinition;
  hidden: boolean;
  config?: React.ReactNode;
  onShowHeader: () => void;
}

export function ConfigSheet({ open, onOpenChange, playground, hidden, config, onShowHeader }: ConfigSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
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
              <IconButton variant="outline" onClick={onShowHeader} label="Salir de pantalla completa">
                <Minimize />
              </IconButton>
            )}
            <IconButton variant="ghost" onClick={() => onOpenChange(false)} label="Ocultar configuración">
              <ChevronUp />
            </IconButton>
          </div>
        </div>
        <div className="px-3 pb-3">{config}</div>
      </SheetContent>
    </Sheet>
  );
}
