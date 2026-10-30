import { Button } from '@/common/components/ui/button';
import { OrderPicker } from '@/common/components/controls/OrderPicker';
import { KeyTypeSelector } from '@/common/components/controls/KeyTypeSelector';
import type { KeyType } from '@/common/types';

interface BTreeConfigProps {
  id: string;
  p: number;
  onPChange: (p: number) => void;
  keyType: KeyType;
  onKeyTypeChange: (v: KeyType) => void;
  onOpenSettings?: () => void;
}

// Controles de configuración del Árbol B (orden, tipo y ajustes del algoritmo).
export function BTreeConfig({ id, p, onPChange, keyType, onKeyTypeChange, onOpenSettings }: BTreeConfigProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 sm:gap-2 md:gap-6">
      <div className="flex items-center gap-2 bg-background">
        <OrderPicker id={id} p={p} onChange={onPChange} />
      </div>
      <div className="flex items-center gap-2 bg-background">
        <span className="shrink-0 text-xs text-muted-foreground">Tipo de clave</span>
        <KeyTypeSelector value={keyType} onChange={onKeyTypeChange} />
      </div>
      {onOpenSettings && (
        <Button
          variant="outline"
          onClick={onOpenSettings}
          title="Más configuraciones"
          aria-label="Más configuraciones"
        >
          Más config.
        </Button>
      )}
    </div>
  );
}
