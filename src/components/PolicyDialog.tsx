import type { BTreePolicy } from '../lib/btree';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

function PolicyRow<T extends string>({
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

interface PolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: BTreePolicy;
  onChange: (policy: BTreePolicy) => void;
}

export function PolicyDialog({ open, onOpenChange, policy, onChange }: PolicyDialogProps) {
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
          <PolicyRow
            label="Dividir nodo con dos medianas candidatas"
            hint="Cuál de las dos claves del medio sube al padre."
            value={policy.splitMedian}
            options={[
              { v: 'left', label: 'Izquierda (menor)' },
              { v: 'right', label: 'Derecha (mayor)' },
            ]}
            onPick={(v) => onChange({ ...policy, splitMedian: v })}
          />
          <PolicyRow
            label="Pedir prestado ante subocupación"
            hint="A qué hermano pedirle una clave primero."
            value={policy.borrowFrom}
            options={[
              { v: 'left', label: 'Izquierdo' },
              { v: 'right', label: 'Derecho' },
            ]}
            onPick={(v) => onChange({ ...policy, borrowFrom: v })}
          />
          <PolicyRow
            label="Fusionar ante subocupación"
            hint="Con qué hermano intentar fusionar primero."
            value={policy.mergeWith}
            options={[
              { v: 'left', label: 'Izquierdo' },
              { v: 'right', label: 'Derecho' },
            ]}
            onPick={(v) => onChange({ ...policy, mergeWith: v })}
          />
          <PolicyRow
            label="Borrar clave de nodo interno"
            hint="Con qué clave de hoja intercambiarla antes de borrar."
            value={policy.replaceWith}
            options={[
              { v: 'pred', label: 'Predecesor (izq.)' },
              { v: 'succ', label: 'Sucesor (der.)' },
            ]}
            onPick={(v) => onChange({ ...policy, replaceWith: v })}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
