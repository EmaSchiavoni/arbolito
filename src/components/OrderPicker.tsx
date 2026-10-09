import * as React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

export const ORDER_MIN = 3;
export const ORDER_SLIDER_MAX = 8;
export const ORDER_MAX = 99;

interface OrderPickerProps {
  id: string;
  p: number;
  onChange: (p: number) => void;
}

// Selector de orden: slider rápido (3-8) + botón "Otro" con input numérico
// para cualquier valor entre 3 y 99.
export function OrderPicker({ id, p, onChange }: OrderPickerProps) {
  const [custom, setCustom] = React.useState(() => p < ORDER_MIN || p > ORDER_SLIDER_MAX);
  const [draft, setDraft] = React.useState(String(p));
  const labelId = `${id}-label`;

  function applyCustom(raw: string) {
    const v = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(v)) return;
    const clamped = Math.min(ORDER_MAX, Math.max(ORDER_MIN, Math.floor(v)));
    onChange(clamped);
    setDraft(String(clamped));
    if (clamped >= ORDER_MIN && clamped <= ORDER_SLIDER_MAX) setCustom(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Label id={labelId} htmlFor={custom ? id : undefined} className="shrink-0 text-xs font-normal text-muted-foreground">
        Orden p
      </Label>
      {!custom ? (
        <>
          <Slider
            id={id}
            aria-labelledby={labelId}
            min={ORDER_MIN}
            max={ORDER_SLIDER_MAX}
            step={1}
            value={[Math.min(ORDER_SLIDER_MAX, Math.max(ORDER_MIN, p))]}
            onValueChange={([v]) => onChange(v)}
            className="w-40"
          />
          <span className="min-w-6 text-sm font-medium">{p}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(String(p));
              setCustom(true);
            }}
            title="Ingresar otro orden manualmente (3-99)"
          >
            Otro
          </Button>
        </>
      ) : (
        <>
          <Input
            id={id}
            aria-labelledby={labelId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => applyCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                (e.target as HTMLInputElement).value = String(p);
                setDraft(String(p));
                (e.target as HTMLInputElement).blur();
              }
            }}
            type="number"
            min={ORDER_MIN}
            max={ORDER_MAX}
            aria-label="Orden personalizado"
            className="h-8 w-20 px-2 text-center text-sm"
          />
          <span className="min-w-6 text-sm font-medium">{p}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCustom(false)}
            title="Volver al slider (3-8)"
          >
            Rango
          </Button>
        </>
      )}
    </div>
  );
}
