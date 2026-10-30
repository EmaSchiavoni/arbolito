import { Button } from '@/common/components/ui/button';
import { KeyTypeSelector } from '@/common/components/controls/KeyTypeSelector';
import type { KeyType } from '@/common/types';

interface AvlConfigProps {
  keyType: KeyType;
  onKeyTypeChange: (v: KeyType) => void;
  onOpenSettings?: () => void;
}

export function AvlConfig({ keyType, onKeyTypeChange, onOpenSettings }: AvlConfigProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 sm:gap-2 md:gap-6">
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
