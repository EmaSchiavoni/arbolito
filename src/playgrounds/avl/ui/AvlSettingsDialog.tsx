import type { AvlSettings } from '@/playgrounds/avl/model/stats';
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
  onPick: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onPick(next as T);
        }}
        aria-label={label}
        className="w-max max-w-full rounded-full border bg-card p-1"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.v}
            value={option.v}
            className="data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

const YES_NO = [
  { v: 'yes', label: 'Sí' },
  { v: 'no', label: 'No' },
] as const;

interface AvlSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AvlSettings;
  onChange: (settings: AvlSettings) => void;
}

export function AvlSettingsDialog({ open, onOpenChange, settings, onChange }: AvlSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] w-[calc(100vw-2rem)] overflow-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Más configuraciones</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Cómo interpretar altura, niveles y clasificación del árbol.
        </p>
        <div className="space-y-4">
          <SettingsRow
            label="Altura / profundidad"
            hint="Si la altura cuenta nodos (un árbol de un nodo mide 1) o aristas (mide 0)."
            value={settings.heightMode}
            options={[
              { v: 'nodes', label: 'Nodos' },
              { v: 'edges', label: 'Aristas' },
            ]}
            onPick={(heightMode) => onChange({ ...settings, heightMode })}
          />
          <SettingsRow
            label="Completo con alineación izquierda"
            hint="Además de que esté lleno desde la raíz hasta el anteúltimo nivel, exigir que las hojas estén alineadas a la izquierda."
            value={settings.completeAlignLeft ? 'yes' : 'no'}
            options={[...YES_NO]}
            onPick={(value) => onChange({ ...settings, completeAlignLeft: value === 'yes' })}
          />
          <SettingsRow
            label="Lleno con hojas igual a profundidad"
            hint="Si está activo, el árbol está lleno cuando cada nodo tiene 0 o k hijos y todas las hojas están al mismo nivel (árbol perfecto). Si está desactivado, alcanza con que cada nodo tenga 0 o k hijos."
            value={settings.fullRequiresSameLeafDepth ? 'yes' : 'no'}
            options={[...YES_NO]}
            onPick={(value) => onChange({ ...settings, fullRequiresSameLeafDepth: value === 'yes' })}
          />
          <SettingsRow
            label="Nivel de la raíz"
            hint="Nivel asignado a la raíz para las reglas por niveles."
            value={String(settings.rootLevel) as '0' | '1'}
            options={[
              { v: '0', label: 'Nivel 0' },
              { v: '1', label: 'Nivel 1' },
            ]}
            onPick={(value) => onChange({ ...settings, rootLevel: value === '1' ? 1 : 0 })}
          />
          <SettingsRow
            label="Equilibrio igual a balanceo"
            hint="Usar la misma condición que el balanceo (diferencia de alturas de subárboles ≤ 1). Si seleccionás 'No', se considera equilibrado si desde la raíz hasta el anteúltimo nivel está lleno."
            value={settings.equilibriumEqualsBalance ? 'yes' : 'no'}
            options={[...YES_NO]}
            onPick={(value) => onChange({ ...settings, equilibriumEqualsBalance: value === 'yes' })}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
