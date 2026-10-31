import * as React from 'react';
import { cn } from '@/common/lib/utils';
import { Button } from '@/common/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/common/components/ui/dialog';
import { Label } from '@/common/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/common/components/ui/radio-group';
import type { SaveTarget } from '@/common/share/types';

interface SaveSharedTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoLabel: string;
  manualLabel: string;
  onConfirm: (target: SaveTarget) => void;
}

export function SaveSharedTreeDialog({
  open,
  onOpenChange,
  autoLabel,
  manualLabel,
  onConfirm,
}: SaveSharedTreeDialogProps) {
  const [target, setTarget] = React.useState<SaveTarget | null>(null);

  function handleOpen(next: boolean) {
    if (!next) setTarget(null);
    onOpenChange(next);
  }

  const options: Array<{ value: SaveTarget; title: string; description: string }> = [
    {
      value: 'auto',
      title: `Solo ${autoLabel.toLowerCase()}`,
      description: 'Guarda esta versión y reemplaza el árbol automático guardado.',
    },
    {
      value: 'manual',
      title: `Solo ${manualLabel.toLowerCase()}`,
      description: 'Guarda esta versión y reemplaza el árbol manual guardado.',
    },
    {
      value: 'both',
      title: 'Ambos modos',
      description: 'Reemplaza las copias guardadas de los dos modos con sus versiones actuales.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar árbol compartido</DialogTitle>
          <DialogDescription>
            Elegí qué se guarda. Lo que no elijas se descarta al salir de este enlace y no se puede recuperar.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={target ?? ''}
          onValueChange={(value) => setTarget(value as SaveTarget)}
          aria-label="Modos a guardar"
          className="gap-2"
        >
          {options.map((option) => (
            <Label
              key={option.value}
              htmlFor={`save-${option.value}`}
              onClick={() => setTarget(option.value)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                target === option.value && 'border-zinc-900 dark:border-zinc-100',
              )}
            >
              <RadioGroupItem id={`save-${option.value}`} value={option.value} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="block text-xs font-normal text-muted-foreground">{option.description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => handleOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!target}
            onClick={() => {
              if (!target) return;
              onConfirm(target);
              handleOpen(false);
            }}
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
