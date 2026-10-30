import type { BTreePolicy } from '@/playgrounds/btree/model/btree';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/common/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/common/components/ui/toggle-group';

function SettingsRow<T extends string>({
  label,
  hint,
  value,
  options,
  onPick,
}: {
  label: string;
  hint: string;
  value: T;
  options: { v: T; label: string }[];
  onPick: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onPick(v as T);
        }}
        aria-label={label}
        className="w-max max-w-full rounded-full border bg-card p-1"
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.v}
            value={o.v}
            className="data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: BTreePolicy;
  onChange: (settings: BTreePolicy) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] w-[calc(100vw-2rem)] overflow-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Más configuraciones</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Qué lado priorizar ante ambigüedades del algoritmo. Rige para operaciones futuras.
        </p>
        <div className="space-y-4">
          <SettingsRow
            label="Dividir nodo con dos medianas candidatas"
            hint="Cuál de las dos claves del medio sube al padre."
            value={settings.splitMedian}
            options={[
              { v: 'left', label: 'Izquierda (menor)' },
              { v: 'right', label: 'Derecha (mayor)' },
            ]}
            onPick={(v) => onChange({ ...settings, splitMedian: v })}
          />
          <SettingsRow
            label="Pedir prestado ante subocupación"
            hint="A qué hermano pedirle una clave primero."
            value={settings.borrowFrom}
            options={[
              { v: 'left', label: 'Izquierdo' },
              { v: 'right', label: 'Derecho' },
            ]}
            onPick={(v) => onChange({ ...settings, borrowFrom: v })}
          />
          <SettingsRow
            label="Fusionar ante subocupación"
            hint="Con qué hermano intentar fusionar primero."
            value={settings.mergeWith}
            options={[
              { v: 'left', label: 'Izquierdo' },
              { v: 'right', label: 'Derecho' },
            ]}
            onPick={(v) => onChange({ ...settings, mergeWith: v })}
          />
          <SettingsRow
            label="Borrar clave de nodo interno"
            hint="Con qué clave de hoja intercambiarla antes de borrar."
            value={settings.replaceWith}
            options={[
              { v: 'pred', label: 'Predecesor (izq.)' },
              { v: 'succ', label: 'Sucesor (der.)' },
            ]}
            onPick={(v) => onChange({ ...settings, replaceWith: v })}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
