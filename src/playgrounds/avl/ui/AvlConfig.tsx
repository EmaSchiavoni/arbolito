import { KeyTypeSelector } from '../../../common/components/KeyTypeSelector';
import type { KeyType } from '../../../common/types';

interface AvlConfigProps {
  keyType: KeyType;
  onKeyTypeChange: (v: KeyType) => void;
}

export function AvlConfig({ keyType, onKeyTypeChange }: AvlConfigProps) {
  return (
    <div className="flex items-center gap-2 bg-background">
      <span className="shrink-0 text-xs text-muted-foreground">Tipo de clave</span>
      <KeyTypeSelector value={keyType} onChange={onKeyTypeChange} />
    </div>
  );
}
