import { ArrowDownToLine } from 'lucide-react';
import { AppShell } from '@/app/AppShell';
import { useChrome } from '@/app/use-chrome';
import { TreeCanvas } from '@/common/canvas/TreeCanvas';
import { CanvasNotice } from '@/common/components/CanvasNotice';
import { ValidationSheet } from '@/common/components/ValidationSheet';
import { ConfirmDialog } from '@/common/components/ui/alert-dialog';
import { ManualToolbar } from '@/common/editor/ManualToolbar';
import { useManualCanvas } from '@/common/editor/use-manual-canvas';
import { useNodeDrag } from '@/common/editor/use-node-drag';
import { AvlConfig } from '@/playgrounds/avl/ui/AvlConfig';
import { MANUAL_NODE_H as NODE_H, MANUAL_NODE_W as NODE_W, manualSlotX as slotX } from '@/playgrounds/avl/ui/node-metrics';
import { AVL_KEYS as KEYS } from '@/playgrounds/avl/storage';
import { AvlManualNode } from './manual/AvlManualNode';
import { useAvlManual } from './manual/use-avl-manual';

export function ManualPlayground() {
  const { hidden } = useChrome();
  const editor = useAvlManual();
  const canvas = useManualCanvas({
    storageKey: KEYS.manualView,
    nodes: editor.nodes,
    selectedIds: editor.selectedNodeIds,
    onSelectionChange: editor.setSelectedIds,
    onPlace: editor.addNodeAt,
    getNodeBox: () => ({ width: NODE_W, height: NODE_H }),
    centerOffset: { x: NODE_W / 2, y: NODE_H / 2 },
  });
  const drag = useNodeDrag({
    nodes: editor.nodes,
    selectedIds: editor.selectedNodeIds,
    setSelectedIds: editor.setSelectedIds,
    viewRef: canvas.viewRef,
    getCurrentNodes: () => editor.draftRef.current.nodes,
    getSnapshot: () => editor.draftRef.current,
    onMove: editor.moveNodes,
    onCommit: editor.commitDrag,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="avl"
        mode="manual"
        share={editor.share}
        config={<AvlConfig keyType={editor.keyType} onKeyTypeChange={editor.changeKeyType} />}
      />
      <div className="relative min-h-0 flex-1">
        <TreeCanvas
          nodes={editor.nodes}
          edges={editor.edges}
          gridBackground
          linking={!!editor.linking}
          errorIds={editor.errorIds}
          onBackgroundClick={() => editor.setLinking(null)}
          getNodeWidth={() => NODE_W}
          getSlotCount={() => 2}
          getSlotX={(node, slot) => slotX(node.x, slot)}
          nodeHeight={NODE_H}
          initialCenter={canvas.initialCenter}
          initialView={canvas.initialView}
          onViewChange={canvas.handleViewChange}
          tool={canvas.activeTool}
          marquee={canvas.marquee}
          renderNode={(n) => (
            <AvlManualNode
              node={n}
              keyType={editor.keyType}
              isRoot={n.id === editor.rootId}
              isSelected={editor.selectedNodeIds.has(n.id)}
              isTarget={!!editor.linking && editor.linking.nodeId !== n.id}
              bad={editor.errorIds.has(n.id)}
              linking={editor.linking}
              actions={{
                onPointerDown: drag.onPointerDown,
                onPointerMove: drag.onPointerMove,
                onPointerUp: drag.onPointerUp,
                onFocusKey: editor.focusKey,
                onSetRoot: editor.setRoot,
                onDeleteNode: editor.deleteNode,
                onStartLink: editor.startLink,
                onRemoveLink: editor.removeLink,
                onCompleteLink: editor.completeLink,
                onCommitKey: editor.commitKey,
              }}
            />
          )}
        />
        {editor.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
            <p className="text-center text-sm text-muted-foreground">
              No hay nodos. Elegí la herramienta Nodo y tocá el canvas.
            </p>
          </div>
        )}
        {editor.linking && (
          <CanvasNotice hidden={hidden}>
            Tocá el icono <ArrowDownToLine className="inline size-3.5" /> del nodo destino · Esc o fondo para cancelar
          </CanvasNotice>
        )}
      </div>

      <ManualToolbar
        label="Acciones del editor manual de AVL"
        onValidate={editor.doValidate}
        onClear={editor.doClear}
        onUndo={editor.doUndo}
        onRedo={editor.doRedo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        linking={!!editor.linking}
        onCancelLink={() => editor.setLinking(null)}
        selectedCount={editor.selectedNodeIds.size}
        onDeleteSelected={editor.deleteSelected}
        panTool={canvas.panTool}
        nodeTool={canvas.nodeTool}
        selectionTool={canvas.selectionTool}
        activeId={canvas.activeId}
        onToggleTool={canvas.toggleTool}
      />

      <ValidationSheet
        open={editor.sheetOpen}
        onOpenChange={editor.setSheetOpen}
        result={editor.result}
        successMessage="El árbol cumple BST y la condición de balance AVL."
        errorHint="Revisá los nodos marcados en rojo."
      />

      <ConfirmDialog
        open={editor.confirmType !== null}
        onOpenChange={(open) => {
          if (!open) editor.setConfirmType(null);
        }}
        title="Cambiar tipo de clave"
        description={`Cambiar a claves de ${editor.confirmType === 'string' ? 'texto' : 'tipo numérico'} borrará las claves actuales (se puede deshacer).`}
        confirmLabel="Borrar y cambiar"
        onConfirm={editor.confirmTypeChange}
      />
    </div>
  );
}
