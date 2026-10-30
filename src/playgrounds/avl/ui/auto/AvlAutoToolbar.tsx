import type { ReactNode } from 'react';
import { Dices, Eraser, Plus, Search, Trash2 } from 'lucide-react';
import { BottomToolbar } from '@/common/components/controls/BottomToolbar';
import { Input } from '@/common/components/ui/input';
import { ToolbarButton, ToolbarSeparator } from '@/common/components/ui/toolbar';
import type { KeyType } from '@/common/types';

interface AvlAutoToolbarProps {
  keyType: KeyType;
  keyInput: string;
  onKeyInputChange: (value: string) => void;
  disabled: boolean;
  onInsert: () => void;
  onDelete: () => void;
  onSearch: () => void;
  onRandom: () => void;
  onClearRequest: () => void;
  onHistory: () => void;
  traversalControl: ReactNode;
}

export function AvlAutoToolbar({
  keyType,
  keyInput,
  onKeyInputChange,
  disabled,
  onInsert,
  onDelete,
  onSearch,
  onRandom,
  onClearRequest,
  onHistory,
  traversalControl,
}: AvlAutoToolbarProps) {
  return (
    <BottomToolbar label="Acciones del playground automático de AVL">
      <div className="flex flex-wrap items-center justify-center gap-2 max-[665px]:w-full">
        <Input
          value={keyInput}
          disabled={disabled}
          onChange={(e) => onKeyInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onInsert();
          }}
          inputMode={keyType === 'string' ? 'text' : 'numeric'}
          placeholder="Claves: 1, 2, 3"
          aria-label="Claves (una sola o lista separada por coma, punto, guion o espacio)"
          className="w-36 min-w-0 max-w-full"
        />
        <ToolbarButton size="sm" onClick={onInsert} disabled={disabled} title="Insertar" aria-label="Insertar" className="px-2">
          <Plus />
        </ToolbarButton>
        <ToolbarButton
          size="sm"
          variant="secondary"
          onClick={onDelete}
          disabled={disabled}
          title="Eliminar"
          aria-label="Eliminar"
          className="px-2"
        >
          <Trash2 />
        </ToolbarButton>
        <ToolbarButton
          size="sm"
          variant="outline"
          onClick={onSearch}
          disabled={disabled}
          title="Buscar"
          aria-label="Buscar"
          className="px-2"
        >
          <Search />
        </ToolbarButton>
      </div>
      <ToolbarSeparator className="mx-0.5 max-[665px]:hidden" />
      <div className="flex flex-wrap items-center justify-center gap-2 max-[665px]:w-full">
        <ToolbarButton size="sm" variant="ghost" onClick={onRandom} disabled={disabled} title="Insertar clave aleatoria">
          <Dices />
          Azar
        </ToolbarButton>
        <ToolbarButton size="sm" variant="ghost" onClick={onClearRequest} disabled={disabled} title="Vaciar árbol">
          <Eraser />
          Vaciar
        </ToolbarButton>
        {traversalControl}
        <ToolbarButton size="sm" variant="outline" onClick={onHistory}>
          Historial
        </ToolbarButton>
      </div>
    </BottomToolbar>
  );
}
