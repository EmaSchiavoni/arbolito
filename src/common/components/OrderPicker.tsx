import * as React from 'react';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';
import { Slider } from '@/common/components/ui/slider';

export const ORDER_MIN = 3;
export const ORDER_SLIDER_MAX = 8;
export const ORDER_MAX = 99;

interface OrderPickerProps {
  id: string;
  p: number;
  onChange: (p: number) => void;
}

// Selector de orden: slider rápido (3-8) y un input editable para cualquier
// valor entre 3 y 99.
export function OrderPicker({ id, p, onChange }: OrderPickerProps) {
  const [draft, setDraft] = React.useState(String(p));
  const labelId = `${id}-label`;

  function commit(raw: string) {
    const v = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(v)) {
      setDraft(String(p));
      return;
    }
    const clamped = Math.min(ORDER_MAX, Math.max(ORDER_MIN, Math.floor(v)));
    onChange(clamped);
    setDraft(String(clamped));
  }

  return (
    <div className="flex items-center gap-2">
      <Label id={labelId} htmlFor={id} className="shrink-0 text-xs font-normal text-muted-foreground">
        Orden p
      </Label>
      <Slider
        aria-labelledby={labelId}
        min={ORDER_MIN}
        max={ORDER_SLIDER_MAX}
        step={1}
        value={[Math.min(ORDER_SLIDER_MAX, Math.max(ORDER_MIN, p))]}
        onValueChange={([v]) => {
          onChange(v);
          setDraft(String(v));
        }}
        className="w-28"
      />
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          else if (e.key === 'Escape') {
            setDraft(String(p));
            (e.target as HTMLInputElement).blur();
          }
        }}
        type="number"
        min={ORDER_MIN}
        max={ORDER_MAX}
        aria-label="Orden p"
        className="h-8 w-16 px-2 text-center text-sm"
      />
    </div>
  );
}
