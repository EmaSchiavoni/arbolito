import { AppShell } from '@/app/AppShell';
import { useChrome } from '@/app/use-chrome';
import { TreeCanvas } from '@/common/canvas/TreeCanvas';
import { CanvasNotice } from '@/common/components/feedback/CanvasNotice';
import { HistoryDialog } from '@/common/components/feedback/HistoryDialog';
import { TreeBadges } from '@/common/components/tree/TreeBadges';
import { ConfirmDialog } from '@/common/components/ui/alert-dialog';
import { AvlConfig } from '@/playgrounds/avl/ui/AvlConfig';
import { AvlSettingsDialog } from '@/playgrounds/avl/ui/AvlSettingsDialog';
import { TraversalDrawer } from '@/playgrounds/avl/ui/TraversalDrawer';
import { AVL_H, AVL_W } from '@/playgrounds/avl/ui/node-metrics';
import { AnimationControls } from './auto/AnimationControls';
import { AvlAutoNode } from './auto/AvlAutoNode';
import { AvlAutoToolbar } from './auto/AvlAutoToolbar';
import { useAvlAuto } from './auto/use-avl-auto';

export function AutoPlayground() {
  const { hidden } = useChrome();
  const auto = useAvlAuto();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="avl"
        mode="auto"
        share={auto.share}
        config={
          <AvlConfig
            keyType={auto.tree.keyType}
            onKeyTypeChange={auto.changeKeyType}
            onOpenSettings={auto.openSettings}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
        <div
          className={
            hidden
              ? 'fixed left-3 top-3 z-40 max-w-[calc(100vw-1rem)]'
              : 'absolute left-3 top-2 z-10 max-w-[calc(100vw-1rem)]'
          }
        >
          <TreeBadges items={auto.badges} />
        </div>
        {auto.renderTree.root === null ? (
          <div className="flex h-full items-center justify-center p-3">
            <p className="text-center text-sm text-muted-foreground">
              El árbol está vacío. Insertá la primera clave desde la barra de abajo.
            </p>
          </div>
        ) : (
          <TreeCanvas
            nodes={auto.layout.nodes}
            edges={auto.layout.edges}
            gridBackground
            highlightIds={auto.highlightIds}
            highlightEdges={auto.highlightEdges}
            getNodeWidth={() => AVL_W}
            getSlotCount={() => 2}
            getSlotX={(n, slot) => n.x + (slot === 0 ? AVL_W * 0.25 : AVL_W * 0.75)}
            nodeHeight={AVL_H}
            animateNodes={auto.animating}
            animationDurationMs={auto.nodeTransitionMs}
            fadeEdges={auto.frameFadeEdges}
            edgeFadeKey={auto.frameIndex}
            initialView={auto.initialView}
            onViewChange={auto.handleViewChange}
            renderNode={(placed) => (
              <AvlAutoNode
                placed={placed}
                traversed={auto.traversalHighlight.nodes.has(placed.id) || auto.animationNodes.has(placed.id)}
                hot={auto.highlightIds.has(placed.id)}
                isNew={auto.lastKey !== null && placed.node.key === auto.lastKey}
                heightMode={auto.settings.heightMode}
              />
            )}
          />
        )}
        {auto.displayedMessage && (
          <CanvasNotice hidden={hidden} className={hidden ? undefined : 'top-10'}>
            {auto.displayedMessage}
          </CanvasNotice>
        )}
        <HistoryDialog open={auto.showHistory} onOpenChange={auto.setShowHistory} history={auto.history} />
      </div>

      {auto.animation && (
        <AnimationControls
          speed={auto.animationSpeed}
          playing={auto.animationPlaying}
          onSpeedChange={auto.setAnimationSpeed}
          onTogglePlay={() => auto.setAnimationPlaying((playing) => !playing)}
        />
      )}

      <AvlAutoToolbar
        keyType={auto.tree.keyType}
        keyInput={auto.keyInput}
        onKeyInputChange={auto.setKeyInput}
        disabled={auto.animating}
        onInsert={auto.doInsert}
        onDelete={auto.doDelete}
        onSearch={auto.doSearch}
        onRandom={auto.doRandom}
        onClearRequest={() => auto.setConfirmClear(true)}
        onHistory={auto.openHistory}
        traversalControl={
          <TraversalDrawer root={auto.tree.root} disabled={auto.animating} onHighlightChange={auto.setTraversalHighlight} />
        }
      />

      <ConfirmDialog
        open={auto.confirmClear}
        onOpenChange={auto.setConfirmClear}
        title="Vaciar árbol"
        description="Se eliminarán todas las claves del árbol. Esta acción no se puede deshacer."
        confirmLabel="Vaciar"
        onConfirm={() => {
          auto.doClear();
          auto.setConfirmClear(false);
        }}
      />
      <ConfirmDialog
        open={auto.confirmType !== null}
        onOpenChange={(open) => {
          if (!open) auto.setConfirmType(null);
        }}
        title="Cambiar tipo de clave"
        description={`Cambiar a claves de ${auto.confirmType === 'string' ? 'texto' : 'tipo numérico'} vaciará el árbol actual. Esta acción no se puede deshacer.`}
        confirmLabel="Vaciar y cambiar"
        onConfirm={auto.confirmTypeChange}
      />
      <AvlSettingsDialog
        open={auto.showSettings}
        onOpenChange={auto.setShowSettings}
        settings={auto.settings}
        onChange={auto.setSettings}
      />
    </div>
  );
}
