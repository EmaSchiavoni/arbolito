import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import type { KeyType } from '../types';

interface KeyTypeSelectorProps {
  value: KeyType;
  onChange: (v: KeyType) => void;
}

// Segmentado 123 | Abc para elegir el tipo de clave. Siempre activo: si el
// árbol ya tiene claves, el padre pide confirmación (vaciar) antes de cambiar.
export function KeyTypeSelector({ value, onChange }: KeyTypeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as KeyType);
      }}
      aria-label="Tipo de clave"
      title="Tipo de clave del árbol"
      className="shrink-0 rounded-full border bg-card p-0.5"
    >
      {(['number', 'string'] as const).map((v) => (
        <ToggleGroupItem
          key={v}
          value={v}
          size="sm"
          title={v === 'number' ? 'Claves numéricas' : 'Claves de texto'}
          aria-label={v === 'number' ? 'Claves numéricas' : 'Claves de texto'}
          className="data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
        >
          {v === 'number' ? '123' : 'Abc'}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
