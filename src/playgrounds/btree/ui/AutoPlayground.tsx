import { AppShell } from '@/app/AppShell';
import { useChrome } from '@/app/use-chrome';
import { TreeCanvas } from '@/common/canvas/TreeCanvas';
import { CanvasNotice } from '@/common/components/CanvasNotice';
import { HistoryDialog } from '@/common/components/HistoryDialog';
import { ConfirmDialog } from '@/common/components/ui/alert-dialog';
import { BTreeConfig } from '@/playgrounds/btree/ui/BTreeConfig';
import { SettingsDialog } from '@/playgrounds/btree/ui/SettingsDialog';
import { AUTO_H, autoSlotX, autoTableWidth } from '@/playgrounds/btree/ui/node-metrics';
import { BTreeAutoNode } from './auto/BTreeAutoNode';
import { BTreeAutoToolbar } from './auto/BTreeAutoToolbar';
import { useBTreeAuto } from './auto/use-btree-auto';

export function AutoPlayground() {
  const { hidden } = useChrome();
  const auto = useBTreeAuto();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="btree"
        mode="auto"
        share={auto.share}
        config={
          <BTreeConfig
            id="orden-auto"
            p={auto.p}
            onPChange={auto.changeP}
            keyType={auto.tree.keyType}
            onKeyTypeChange={auto.changeKeyType}
            onOpenSettings={auto.openSettings}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
        {auto.tree.root === null ? (
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
            highlightIds={auto.highlight}
            getNodeWidth={() => autoTableWidth(auto.p)}
            getSlotX={(n, slot) => autoSlotX(n.x, slot)}
            nodeHeight={AUTO_H}
            initialView={auto.initialView}
            onViewChange={auto.handleViewChange}
            renderNode={(placed) => (
              <BTreeAutoNode
                placed={placed}
                p={auto.p}
                hot={auto.highlight.has(placed.id)}
                lastKey={auto.lastKey}
                connected={auto.connected}
              />
            )}
          />
        )}
        {auto.message && <CanvasNotice hidden={hidden}>{auto.message}</CanvasNotice>}
        <HistoryDialog open={auto.showHistory} onOpenChange={auto.setShowHistory} history={auto.history} />
      </div>

      <BTreeAutoToolbar
        keyType={auto.tree.keyType}
        keyInput={auto.keyInput}
        onKeyInputChange={auto.setKeyInput}
        onInsert={auto.doInsert}
        onDelete={auto.doDelete}
        onSearch={auto.doSearch}
        onRandom={auto.doRandom}
        onClearRequest={() => auto.setConfirmClear(true)}
        onHistory={auto.openHistory}
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
      <SettingsDialog
        open={auto.showSettings}
        onOpenChange={auto.setShowSettings}
        settings={auto.policy}
        onChange={auto.setPolicy}
      />
    </div>
  );
}
