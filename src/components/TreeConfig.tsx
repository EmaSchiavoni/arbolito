import { Button } from './ui/button';
import { OrderPicker } from './OrderPicker';
import { TypeSelector, type KeyType } from './TypeSelector';

interface TreeConfigProps {
  id: string;
  p: number;
  onPChange: (p: number) => void;
  keyType: KeyType;
  onKeyTypeChange: (v: KeyType) => void;
  onOpenPolicy?: () => void;
}

// Controles de configuración del árbol (orden, tipo y ajustes del algoritmo).
// Se usan tanto en el header como en el panel deslizante del modo inmersivo.
export function TreeConfig({ id, p, onPChange, keyType, onKeyTypeChange, onOpenPolicy }: TreeConfigProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
        <OrderPicker id={id} p={p} onChange={onPChange} />
      </div>
      <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
        <span className="shrink-0 text-xs text-muted-foreground">Tipo de clave</span>
        <TypeSelector value={keyType} onChange={onKeyTypeChange} />
      </div>
      {onOpenPolicy && (
        <Button
          variant="outline"
          onClick={onOpenPolicy}
          title="Más configuraciones"
          aria-label="Más configuraciones"
        >
          Más config.
        </Button>
      )}
    </div>
  );
}
