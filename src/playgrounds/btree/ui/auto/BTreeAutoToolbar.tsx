import { Dices, Eraser, Plus, Search, Trash2 } from 'lucide-react';
import { BottomToolbar } from '@/common/components/BottomToolbar';
import { Input } from '@/common/components/ui/input';
import { ToolbarButton, ToolbarSeparator } from '@/common/components/ui/toolbar';
import type { KeyType } from '@/common/types';

interface BTreeAutoToolbarProps {
  keyType: KeyType;
  keyInput: string;
  onKeyInputChange: (value: string) => void;
  onInsert: () => void;
  onDelete: () => void;
  onSearch: () => void;
  onRandom: () => void;
  onClearRequest: () => void;
  onHistory: () => void;
}

export function BTreeAutoToolbar({
  keyType,
  keyInput,
  onKeyInputChange,
  onInsert,
  onDelete,
  onSearch,
  onRandom,
  onClearRequest,
  onHistory,
}: BTreeAutoToolbarProps) {
  return (
    <BottomToolbar label="Acciones del playground automático">
      <div className="flex flex-wrap items-center justify-center gap-2 max-[665px]:w-full">
        <Input
          value={keyInput}
          onChange={(e) => onKeyInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onInsert();
          }}
          inputMode={keyType === 'string' ? 'text' : 'numeric'}
          placeholder="Claves: 1, 2, 3"
          aria-label="Claves (una sola o lista separada por coma, punto, guion o espacio)"
          className="w-36 min-w-0 max-w-full"
        />
        <ToolbarButton size="sm" onClick={onInsert} title="Insertar" aria-label="Insertar" className="px-2">
          <Plus />
        </ToolbarButton>
        <ToolbarButton size="sm" variant="secondary" onClick={onDelete} title="Eliminar" aria-label="Eliminar" className="px-2">
          <Trash2 />
        </ToolbarButton>
        <ToolbarButton size="sm" variant="outline" onClick={onSearch} title="Buscar" aria-label="Buscar" className="px-2">
          <Search />
        </ToolbarButton>
      </div>
      <ToolbarSeparator className="mx-0.5 max-[665px]:hidden" />
      <div className="flex flex-wrap items-center justify-center gap-2 max-[665px]:w-full">
        <ToolbarButton size="sm" variant="ghost" onClick={onRandom} title="Insertar clave aleatoria">
          <Dices />
          Azar
        </ToolbarButton>
        <ToolbarButton size="sm" variant="ghost" onClick={onClearRequest} title="Vaciar árbol">
          <Eraser />
          Vaciar
        </ToolbarButton>
        <ToolbarButton size="sm" variant="outline" onClick={onHistory}>
          Historial
        </ToolbarButton>
      </div>
    </BottomToolbar>
  );
}
