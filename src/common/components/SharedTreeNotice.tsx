import { IconArrowsDiagonal2 } from '@tabler/icons-react';
import { Info, Save } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface SharedTreeNoticeProps {
  visible: boolean;
  minimized: boolean;
  onMinimize: () => void;
  onExpand: () => void;
  onSave: () => void;
}

const WARNING = 'Estás viendo un árbol compartido, el guardado automático está desactivado.';

// Aviso no descartable de una sesión compartida. La cruz (o Escape) minimiza
// el modal a un contenedor fijo arriba a la derecha; desde ahí se puede
// expandir de nuevo o guardar.
export function SharedTreeNotice({ visible, minimized, onMinimize, onExpand, onSave }: SharedTreeNoticeProps) {
  if (!visible) return null;

  if (minimized) {
    return (
      <div className="fixed right-3 top-[var(--chrome-top)] z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur">
        <p className="text-xs text-muted-foreground">{WARNING}</p>
        <div className="mt-2 flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" onClick={onExpand}>
            <IconArrowsDiagonal2 />
            Expandir
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save />
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onMinimize();
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="size-5" />
            Árbol compartido
          </DialogTitle>
          <DialogDescription>{WARNING}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Podés explorar y modificar el árbol sin restricciones, pero los cambios se pierden si actualizás o
            cambiás de página.
          </p>
          <p>
            Al guardar elegís qué modos sobrescribir. El árbol que tenías guardado en esos modos se reemplaza por
            esta versión.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onMinimize}>
            Seguir viendo
          </Button>
          <Button onClick={onSave}>
            <Save />
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
