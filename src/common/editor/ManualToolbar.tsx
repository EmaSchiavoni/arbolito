import { Eraser, Redo2, ShieldCheck, Trash2, Undo2, X } from 'lucide-react';
import { BottomToolbar } from '@/common/components/BottomToolbar';
import { ToolButton } from '@/common/components/ToolButton';
import { ToolbarButton, ToolbarSeparator } from '@/common/components/ui/toolbar';
import type { CanvasTool } from '@/common/tools/types';

interface ManualToolbarProps {
  label: string;
  onValidate: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  linking: boolean;
  onCancelLink: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  panTool: CanvasTool;
  nodeTool: CanvasTool;
  selectionTool: CanvasTool;
  activeId: string | null;
  onToggleTool: (id: string) => void;
}

export function ManualToolbar({
  label,
  onValidate,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  linking,
  onCancelLink,
  selectedCount,
  onDeleteSelected,
  panTool,
  nodeTool,
  selectionTool,
  activeId,
  onToggleTool,
}: ManualToolbarProps) {
  return (
    <BottomToolbar label={label}>
      <ToolbarButton size="sm" onClick={onValidate}>
        <ShieldCheck />
        Validar
      </ToolbarButton>
      <ToolbarButton size="sm" variant="secondary" onClick={onClear} title="Borrar todo">
        <Eraser />
        Limpiar
      </ToolbarButton>
      {canUndo && (
        <ToolbarButton size="sm" variant="outline" onClick={onUndo} title="Deshacer última acción (Ctrl+Z)">
          <Undo2 />
          Deshacer
        </ToolbarButton>
      )}
      {canRedo && (
        <ToolbarButton size="sm" variant="outline" onClick={onRedo} title="Rehacer acción (Ctrl+Shift+Z)">
          <Redo2 />
          Rehacer
        </ToolbarButton>
      )}
      {linking && (
        <ToolbarButton size="sm" variant="outline" onClick={onCancelLink}>
          <X />
          Cancelar
        </ToolbarButton>
      )}
      {selectedCount > 0 && (
        <ToolbarButton size="sm" variant="outline" onClick={onDeleteSelected} title="Eliminar los nodos seleccionados">
          <Trash2 />
          Eliminar ({selectedCount})
        </ToolbarButton>
      )}
      <ToolbarSeparator orientation="vertical" className="mx-1" />
      <ToolButton tool={panTool} active={activeId === panTool.id} onSelect={() => onToggleTool(panTool.id)} />
      <ToolButton tool={nodeTool} active={activeId === nodeTool.id} onSelect={() => onToggleTool(nodeTool.id)} />
      <ToolButton
        tool={selectionTool}
        active={activeId === selectionTool.id}
        onSelect={() => onToggleTool(selectionTool.id)}
      />
    </BottomToolbar>
  );
}
