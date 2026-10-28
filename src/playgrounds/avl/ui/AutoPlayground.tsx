import * as React from 'react';
import { Dices, Eraser, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { Slider } from '../../../common/components/ui/slider';
import { ToolbarButton, ToolbarSeparator } from '../../../common/components/ui/toolbar';
import { AppShell } from '../../../app/AppShell';
import { useChrome } from '../../../app/use-chrome';
import { BottomToolbar } from '../../../common/components/BottomToolbar';
import { CanvasNotice } from '../../../common/components/CanvasNotice';
import { HistoryDialog, type HistoryItem } from '../../../common/components/HistoryDialog';
import { TreeBadges } from '../../../common/components/TreeBadges';
import { TreeCanvas } from '../../../common/components/TreeCanvas';
import { ConfirmDialog } from '../../../common/components/ui/alert-dialog';
import { toast } from '../../../common/components/ui/use-toast';
import { AvlConfig } from './AvlConfig';
import { AvlSettingsDialog } from './AvlSettingsDialog';
import {
  balanceOf,
  contains,
  countKeys,
  createTree,
  searchPath,
  toTreeKey,
  type AvlTree,
} from '../model/avl';
import type { TreeAnimation } from '../model/animation';
import { buildDeleteAnimation } from '../model/delete-animation';
import { buildInsertAnimation, insertKeyAnimated } from '../model/insert-animation';
import {
  avlStatLabels,
  computeAvlStats,
  displayHeight,
  type AvlSettings,
} from '../model/stats';
import { TraversalDrawer, type TraversalHighlight } from './TraversalDrawer';
import type { Key, KeyType } from '../../../common/types';
import { layoutTree } from '../../../common/tree/layout';
import { createScopedStorage } from '../../../common/storage/storage';
import { useViewPersistence } from '../../../common/hooks/use-view-persistence';
import { parseKeyList } from '../../../common/keys/parse-key-list';
import { trackConfig, trackUi, useToolTracker } from '../../../common/analytics';
import { cn } from '../../../common/lib/utils';

const storage = createScopedStorage('avl');
const KEYS = {
  autoTree: storage.key('auto-tree'),
  autoHistory: storage.key('auto-history'),
  autoView: storage.key('auto-view'),
  autoSpeed: storage.key('auto-speed'),
  autoSettings: storage.key('auto-settings'),
};
const load = storage.load;
const save = storage.save;

const AVL_W = 120;
const AVL_H = 56;

const DEFAULT_ANIM_SPEED = 4;

function formatSpeed(speed: number): string {
  return `${Number(speed.toFixed(2))}x`;
}

export function AutoPlayground() {
  const { hidden } = useChrome();
  const trackTool = useToolTracker('avl', 'auto');
  const [tree, setTree] = React.useState<AvlTree>(() => {
    const saved = load<AvlTree | null>(KEYS.autoTree, null);
    if (saved && (saved.keyType === 'string' || saved.keyType === 'number')) {
      return { root: saved.root ?? null, keyType: saved.keyType };
    }
    return createTree('number');
  });
  const [history, setHistory] = React.useState<HistoryItem[]>(() => load<HistoryItem[]>(KEYS.autoHistory, []));
  const [keyInput, setKeyInput] = React.useState('');
  const [highlight, setHighlight] = React.useState<Set<string>>(new Set());
  const [traversalHighlight, setTraversalHighlight] = React.useState<TraversalHighlight>({
    nodes: new Set(),
    edges: new Set(),
  });
  const [animation, setAnimation] = React.useState<TreeAnimation | null>(null);
  const [frameIndex, setFrameIndex] = React.useState(0);
  const [animationPlaying, setAnimationPlaying] = React.useState(true);
  const [animationSpeed, setAnimationSpeed] = React.useState(() => {
    const saved = load<number>(KEYS.autoSpeed, DEFAULT_ANIM_SPEED);
    return Number.isFinite(saved) ? Math.min(7, Math.max(1, saved)) : DEFAULT_ANIM_SPEED;
  });
  const [settings, setSettings] = React.useState<AvlSettings>(() => {
    const saved = load<Partial<AvlSettings> | null>(KEYS.autoSettings, null);
    return {
      heightMode: saved?.heightMode === 'edges' ? 'edges' : 'nodes',
      completeAlignLeft: saved?.completeAlignLeft === true,
      fullRequiresSameLeafDepth: saved?.fullRequiresSameLeafDepth !== false,
      rootLevel: saved?.rootLevel === 1 ? 1 : 0,
      equilibriumEqualsBalance: saved?.equilibriumEqualsBalance === true,
    };
  });
  const [lastKey, setLastKey] = React.useState<Key | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<KeyType | null>(null);

  const { initialView, handleViewChange } = useViewPersistence(KEYS.autoView, { x: 16, y: 150, k: 1 });

  React.useEffect(() => {
    save(KEYS.autoTree, tree);
  }, [tree]);

  React.useEffect(() => {
    save(KEYS.autoHistory, history.slice(0, 60));
  }, [history]);

  React.useEffect(() => {
    save(KEYS.autoSpeed, animationSpeed);
  }, [animationSpeed]);

  React.useEffect(() => {
    save(KEYS.autoSettings, settings);
  }, [settings]);

  function pushHistory(text: string, steps: string[] = []) {
    setHistory((h) => [{ id: Date.now() + Math.random(), text, steps }, ...h].slice(0, 60));
  }

  const frame = animation ? animation.frames[frameIndex] : null;
  const displayedMessage = frame?.message ?? message;
  const frameDelayMs = 1000 / animationSpeed;
  const nodeTransitionMs = Math.max(1, Math.round(frameDelayMs * 0.8));

  React.useEffect(() => {
    if (!animation || !animationPlaying) return;
    const timer = window.setTimeout(() => {
      if (frameIndex >= animation.frames.length - 1) {
        setTree(animation.finalTree);
        setHighlight(new Set(animation.touched));
        setLastKey(animation.lastKey);
        setMessage(animation.finalMessage);
        setAnimation(null);
        setFrameIndex(0);
        setAnimationPlaying(true);
        return;
      }
      setFrameIndex((i) => i + 1);
    }, frameDelayMs);
    return () => window.clearTimeout(timer);
  }, [animation, animationPlaying, frameIndex, animationSpeed, frameDelayMs]);

  function startAnimation(anim: TreeAnimation) {
    for (const entry of anim.history) pushHistory(entry.text, entry.steps);
    setHighlight(new Set());
    setLastKey(anim.lastKey);
    if (anim.frames.length === 0) {
      setMessage(anim.finalMessage);
      return;
    }
    setMessage(anim.frames[0]?.message ?? anim.finalMessage);
    setFrameIndex(0);
    setAnimationPlaying(true);
    setAnimation(anim);
  }

  function parseKeys(): Key[] | null {
    const r = parseKeyList(keyInput, tree.keyType);
    if (!r.ok) {
      if (r.reason === 'empty') {
        toast({ description: 'Debe ingresar un valor en el campo clave antes de realizar esta operación.' });
      } else if (tree.keyType === 'string') {
        setMessage('Ingresá texto separado por un único separador (,, ., - o espacio).');
      } else {
        setMessage('Ingresá un número entero o una lista con un único separador (,, ., - o espacio).');
      }
      return null;
    }
    return r.keys;
  }

  function plural(n: number, one: string, many: string) {
    return `${n} ${n === 1 ? one : many}`;
  }

  function changeKeyType(next: KeyType) {
    if (animation || next === tree.keyType) return;
    if (countKeys(tree.root) === 0) {
      setTree({ root: null, keyType: next });
      setHighlight(new Set());
      setLastKey(null);
      trackConfig('key_type', next, { playground: 'avl', mode: 'auto' });
      return;
    }
    setConfirmType(next);
  }

  function confirmTypeChange() {
    if (animation || !confirmType) return;
    setTree({ root: null, keyType: confirmType });
    setHighlight(new Set());
    setLastKey(null);
    setMessage(`Tipo cambiado a ${confirmType === 'string' ? 'texto' : 'numérico'}. Árbol vaciado.`);
    pushHistory(`tipo → ${confirmType === 'string' ? 'texto' : 'numérico'} (árbol vaciado)`);
    trackConfig('key_type', confirmType, { playground: 'avl', mode: 'auto', emptied: true });
    setConfirmType(null);
  }

  function doInsert() {
    if (animation) return;
    const ks = parseKeys();
    if (!ks) return;
    let cur = tree;
    let inserted = 0;
    let dups = 0;
    let lastK: Key | null = null;
    let touched: string[] = [];
    const frames: TreeAnimation['frames'] = [];
    const historyEntries: TreeAnimation['history'] = [];

    for (const k of ks) {
      const kk = toTreeKey(cur, k);
      const anim = insertKeyAnimated(cur, kk);
      if (!anim.inserted) {
        dups += 1;
        historyEntries.push({ text: `insertar ${kk} → duplicada`, steps: [] });
        continue;
      }
      const built = buildInsertAnimation(anim, cur);
      if (!built) continue;
      frames.push(...built.frames);
      historyEntries.push(...built.history);
      touched = built.touched;
      lastK = built.lastKey;
      cur = anim.tree;
      inserted += 1;
    }

    const finalMessage =
      ks.length === 1
        ? inserted === 1
          ? `Clave ${ks[0]} insertada.`
          : `La clave ${ks[0]} ya existe.`
        : `${[plural(inserted, 'insertada', 'insertadas'), ...(dups > 0 ? [plural(dups, 'duplicada', 'duplicadas')] : [])].join(', ')}.`;

    startAnimation({
      frames,
      finalTree: cur,
      finalMessage,
      history: historyEntries,
      touched,
      lastKey: lastK,
    });
    setKeyInput('');
    trackTool('insert', { keys: ks.length, inserted, duplicates: dups, key_type: tree.keyType });
  }

  function doDelete() {
    if (animation) return;
    const ks = parseKeys();
    if (!ks) return;
    let cur = tree;
    let deleted = 0;
    let missing = 0;
    let touched: string[] = [];
    const frames: TreeAnimation['frames'] = [];
    const historyEntries: TreeAnimation['history'] = [];

    for (const k of ks) {
      const kk = toTreeKey(cur, k);
      const built = buildDeleteAnimation(cur, kk);
      frames.push(...built.frames);
      historyEntries.push(...built.history);
      if (contains(cur.root, kk)) {
        deleted += 1;
        touched = built.touched;
      } else {
        missing += 1;
      }
      cur = built.finalTree;
    }

    const finalMessage =
      ks.length === 1
        ? deleted === 1
          ? `Clave ${ks[0]} eliminada.`
          : `La clave ${ks[0]} no existe.`
        : `${[plural(deleted, 'eliminada', 'eliminadas'), ...(missing > 0 ? [plural(missing, 'no existía', 'no existían')] : [])].join(', ')}.`;

    startAnimation({
      frames,
      finalTree: cur,
      finalMessage,
      history: historyEntries,
      touched,
      lastKey: null,
    });
    setKeyInput('');
    trackTool('delete', { keys: ks.length, deleted, missing });
  }


  function doSearch() {
    if (animation) return;
    const ks = parseKeys();
    if (!ks) return;
    setLastKey(null);
    const path = new Set<string>();
    const found: Key[] = [];
    const lost: Key[] = [];
    for (const k of ks) {
      const kk = toTreeKey(tree, k);
      searchPath(tree.root, kk).forEach((id) => path.add(id));
      if (contains(tree.root, kk)) {
        found.push(kk);
        pushHistory(`buscar ${kk} → encontrada`);
      } else {
        lost.push(kk);
        pushHistory(`buscar ${kk} → no encontrada`);
      }
    }
    setHighlight(path);
    if (ks.length === 1) {
      setMessage(found.length === 1 ? `Clave ${ks[0]} encontrada.` : `Clave ${ks[0]} no encontrada.`);
    } else {
      const parts: string[] = [];
      if (found.length > 0) parts.push(`encontradas: ${found.join(', ')}`);
      if (lost.length > 0) parts.push(`no encontradas: ${lost.join(', ')}`);
      setMessage(parts.join('. ') + '.');
    }
    trackTool('search', { keys: ks.length, found: found.length, missing: lost.length });
  }

  function doRandom() {
    if (animation) return;
    let kk = toTreeKey(tree, 0);
    for (let i = 0; i < 200; i += 1) {
      kk = toTreeKey(tree, Math.floor(Math.random() * 100));
      if (!contains(tree.root, kk)) break;
    }
    const anim = insertKeyAnimated(tree, kk);
    if (!anim.inserted) return;
    const built = buildInsertAnimation(anim, tree);
    if (!built) return;
    const historyEntries = built.history.map((entry, i) =>
      i === 0 ? { ...entry, text: `insertar ${kk} → ok (aleatorio)` } : entry,
    );
    startAnimation({ ...built, history: historyEntries, finalMessage: `Clave ${kk} insertada (aleatorio).` });
    trackTool('random');
  }

  function doClear() {
    if (animation) return;
    setTree({ root: null, keyType: tree.keyType });
    setHighlight(new Set());
    setLastKey(null);
    setMessage('Árbol vaciado.');
    pushHistory('limpiar → árbol vacío');
    trackTool('clear');
  }


  const renderTree = frame?.tree ?? tree;
  const animating = animation !== null;
  const animationNodes = React.useMemo(() => new Set(frame?.nodes ?? []), [frame]);
  const animationEdges = React.useMemo(() => new Set(frame?.edges ?? []), [frame]);

  const layout = React.useMemo(
    () =>
      layoutTree(renderTree.root, {
        id: (n) => n.id,
        children: (n) => {
          const out = [];
          if (n.left) out.push(n.left);
          if (n.right) out.push(n.right);
          return out;
        },
        childSlots: (n) => [n.left, n.right],
        width: () => AVL_W,
      }),
    [renderTree.root],
  );

  const badges = React.useMemo(
    () => avlStatLabels(computeAvlStats(renderTree.root, settings), renderTree.root === null),
    [renderTree.root, settings],
  );

  const highlightIds = React.useMemo(() => {
    if (traversalHighlight.nodes.size === 0 && animationNodes.size === 0) return highlight;
    return new Set([...highlight, ...traversalHighlight.nodes, ...animationNodes]);
  }, [highlight, traversalHighlight.nodes, animationNodes]);

  const highlightEdges = React.useMemo(() => {
    if (traversalHighlight.edges.size === 0 && animationEdges.size === 0) return undefined;
    return new Set([...traversalHighlight.edges, ...animationEdges]);
  }, [traversalHighlight.edges, animationEdges]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="avl"
        mode="auto"
        config={
          <AvlConfig
            keyType={tree.keyType}
            onKeyTypeChange={changeKeyType}
            onOpenSettings={() => {
              trackUi('settings_open', { playground: 'avl', mode: 'auto' });
              setShowSettings(true);
            }}
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
          <TreeBadges items={badges} />
        </div>
        {renderTree.root === null ? (
          <div className="flex h-full items-center justify-center p-3">
            <p className="text-center text-sm text-muted-foreground">
              El árbol está vacío. Insertá la primera clave desde la barra de abajo.
            </p>
          </div>
        ) : (
          <TreeCanvas
            nodes={layout.nodes}
            edges={layout.edges}
            gridBackground
            highlightIds={highlightIds}
            highlightEdges={highlightEdges}
            getNodeWidth={() => AVL_W}
            getSlotCount={() => 2}
            getSlotX={(n, slot) => n.x + (slot === 0 ? AVL_W * 0.25 : AVL_W * 0.75)}
            nodeHeight={AVL_H}
            animateNodes={animating}
            animationDurationMs={nodeTransitionMs}
            fadeEdges={frame?.fadeEdges}
            edgeFadeKey={frameIndex}
            initialView={initialView}
            onViewChange={handleViewChange}
            renderNode={(placed) => {
              const n = placed.node;
              const traversed = traversalHighlight.nodes.has(placed.id) || animationNodes.has(placed.id);
              const hot = highlightIds.has(placed.id);
              const isNew = lastKey !== null && n.key === lastKey;
              const bf = balanceOf(n);
              return (
                <div
                  data-node
                  className={cn(
                    'flex h-14 flex-col items-center justify-center rounded-md border bg-card shadow-sm',
                    traversed
                      ? 'border-2 border-zinc-900 bg-zinc-900/5 dark:border-zinc-100 dark:bg-zinc-100/10'
                      : hot
                        ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100'
                        : 'border-border dark:border-zinc-700',
                    isNew && 'bg-emerald-100/60 dark:bg-emerald-950/50',
                  )}
                >
                  <span className="text-sm font-semibold">{n.key}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    h {displayHeight(n, settings.heightMode)} · bf {bf > 0 ? `+${bf}` : bf}
                  </span>
                </div>
              );
            }}
          />
        )}
        {displayedMessage && (
          <CanvasNotice hidden={hidden} className={hidden ? undefined : 'top-10'}>
            {displayedMessage}
          </CanvasNotice>
        )}
        <HistoryDialog open={showHistory} onOpenChange={setShowHistory} history={history} />
      </div>

      {animation && (
        <div className="fixed bottom-[4.75rem] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur max-[665px]:bottom-32">
          <span className="text-[11px] text-muted-foreground">Animación</span>
          <Slider
            min={1}
            max={7}
            step={0.25}
            value={[animationSpeed]}
            onValueChange={([v]) => setAnimationSpeed(v)}
            aria-label="Velocidad de la animación"
            className="w-24"
          />
          <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
            {formatSpeed(animationSpeed)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="px-1.5"
            onClick={() => setAnimationPlaying((playing) => !playing)}
            aria-label={animationPlaying ? 'Pausar animación' : 'Reanudar animación'}
            title={animationPlaying ? 'Pausar animación' : 'Reanudar animación'}
          >
            {animationPlaying ? <Pause /> : <Play />}
          </Button>
        </div>
      )}

      <BottomToolbar label="Acciones del playground automático de AVL">
        <div className="flex items-center justify-center gap-2 max-[665px]:w-full">
          <Input
            value={keyInput}
            disabled={animating}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doInsert();
            }}
            inputMode={tree.keyType === 'string' ? 'text' : 'numeric'}
            placeholder="Claves: 1, 2, 3"
            aria-label="Claves (una sola o lista separada por coma, punto, guion o espacio)"
            className="w-36"
          />
          <ToolbarButton size="sm" onClick={doInsert} disabled={animating} title="Insertar" aria-label="Insertar" className="px-2"><Plus /></ToolbarButton>
          <ToolbarButton size="sm" variant="secondary" onClick={doDelete} disabled={animating} title="Eliminar" aria-label="Eliminar" className="px-2"><Trash2 /></ToolbarButton>
          <ToolbarButton size="sm" variant="outline" onClick={doSearch} disabled={animating} title="Buscar" aria-label="Buscar" className="px-2"><Search /></ToolbarButton>
        </div>
        <ToolbarSeparator className="mx-0.5 max-[665px]:hidden" />
        <div className="flex items-center justify-center gap-2 max-[665px]:w-full">
          <ToolbarButton size="sm" variant="ghost" onClick={doRandom} disabled={animating} title="Insertar clave aleatoria"><Dices />Azar</ToolbarButton>
          <ToolbarButton size="sm" variant="ghost" onClick={() => setConfirmClear(true)} disabled={animating} title="Vaciar árbol"><Eraser />Vaciar</ToolbarButton>
          <TraversalDrawer root={tree.root} disabled={animating} onHighlightChange={setTraversalHighlight} />
          <ToolbarButton
            size="sm"
            variant="outline"
            onClick={() => {
              trackTool('history');
              setShowHistory(true);
            }}
          >
            Historial
          </ToolbarButton>
        </div>
      </BottomToolbar>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Vaciar árbol"
        description="Se eliminarán todas las claves del árbol. Esta acción no se puede deshacer."
        confirmLabel="Vaciar"
        onConfirm={() => {
          doClear();
          setConfirmClear(false);
        }}
      />
      <ConfirmDialog
        open={confirmType !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmType(null);
        }}
        title="Cambiar tipo de clave"
        description={`Cambiar a claves de ${confirmType === 'string' ? 'texto' : 'tipo numérico'} vaciará el árbol actual. Esta acción no se puede deshacer.`}
        confirmLabel="Vaciar y cambiar"
        onConfirm={confirmTypeChange}
      />
      <AvlSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  );
}
