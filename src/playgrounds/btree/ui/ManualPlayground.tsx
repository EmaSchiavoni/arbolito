import { ArrowDownToLine } from 'lucide-react';
import { AppShell } from '@/app/AppShell';
import { useChrome } from '@/app/use-chrome';
import { TreeCanvas } from '@/common/canvas/TreeCanvas';
import { CanvasNotice } from '@/common/components/feedback/CanvasNotice';
import { ValidationSheet } from '@/common/components/feedback/ValidationSheet';
import { ConfirmDialog } from '@/common/components/ui/alert-dialog';
import { ManualToolbar } from '@/common/editor/ManualToolbar';
import { useManualCanvas } from '@/common/editor/use-manual-canvas';
import { useNodeDrag } from '@/common/editor/use-node-drag';
import { BTreeConfig } from '@/playgrounds/btree/ui/BTreeConfig';
import { manualNodeWidth, manualSlotX } from '@/playgrounds/btree/ui/node-metrics';
import { BTREE_KEYS as KEYS } from '@/playgrounds/btree/storage';
import { BTreeManualNode } from './manual/BTreeManualNode';
import { useBTreeManual } from './manual/use-btree-manual';

export function ManualPlayground() {
  const { hidden } = useChrome();
  const editor = useBTreeManual();
  const canvas = useManualCanvas({
    storageKey: KEYS.manualView,
    nodes: editor.nodes,
    selectedIds: editor.selectedNodeIds,
    onSelectionChange: editor.setSelectedIds,
    onPlace: editor.addNodeAt,
    getNodeBox: () => ({ width: manualNodeWidth(editor.p), height: 64 }),
    centerOffset: { x: manualNodeWidth(editor.p) / 2, y: 32 },
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
        playgroundId="btree"
        mode="manual"
        share={editor.share}
        config={
          <BTreeConfig
            id="orden-manual"
            p={editor.p}
            onPChange={editor.changeOrder}
            keyType={editor.keyType}
            onKeyTypeChange={editor.changeKeyType}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
        <TreeCanvas
          nodes={editor.nodes}
          edges={editor.edges}
          gridBackground
          linking={!!editor.linking}
          errorIds={editor.errorIds}
          onBackgroundClick={() => editor.setLinking(null)}
          getNodeWidth={() => manualNodeWidth(editor.p)}
          getSlotX={(node, slot) => manualSlotX(node.x, editor.p, slot)}
          initialCenter={canvas.initialCenter}
          initialView={canvas.initialView}
          onViewChange={canvas.handleViewChange}
          tool={canvas.activeTool}
          marquee={canvas.marquee}
          renderNode={(n) => (
            <BTreeManualNode
              node={n}
              p={editor.p}
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
                onFocusEmptyKey: editor.focusEmptyKey,
                onSetRoot: editor.setRoot,
                onDeleteNode: editor.deleteNode,
                onStartLink: editor.startLink,
                onRemoveLink: editor.removeLink,
                onCompleteLink: editor.completeLink,
                onCommitKeyCell: editor.commitKeyCell,
                onRemoveKey: editor.removeKey,
                onAddKey: editor.addKey,
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
        label="Acciones del editor manual"
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
        successMessage={`El árbol cumple todas las reglas del orden p = ${editor.p}.`}
        errorHint="Revisá los nodos marcados en rojo."
      />

      <ConfirmDialog
        open={editor.confirmType !== null}
        onOpenChange={(open) => {
          if (!open) editor.setConfirmType(null);
        }}
        title="Cambiar tipo de clave"
        description={`Cambiar a claves de ${editor.confirmType === 'string' ? 'texto' : 'tipo numérico'} vaciará los nodos actuales (se puede deshacer).`}
        confirmLabel="Vaciar y cambiar"
        onConfirm={editor.confirmTypeChange}
      />
    </div>
  );
}
