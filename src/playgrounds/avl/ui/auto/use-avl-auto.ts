import * as React from 'react';
import type { HistoryItem } from '@/common/components/HistoryDialog';
import { toast } from '@/common/components/ui/use-toast';
import { useViewPersistence } from '@/common/hooks/use-view-persistence';
import { parseKeyList } from '@/common/keys/parse-key-list';
import { useSharedModeState } from '@/common/share/use-shared-mode-state';
import { layoutTree } from '@/common/tree/layout';
import { trackConfig, trackUi, useToolTracker } from '@/common/analytics';
import type { Key, KeyType } from '@/common/types';
import type { TreeAnimation } from '@/playgrounds/avl/model/animation';
import {
  contains,
  countKeys,
  createTree,
  searchPath,
  toTreeKey,
  type AvlNode,
  type AvlTree,
} from '@/playgrounds/avl/model/avl';
import { buildDeleteAnimation } from '@/playgrounds/avl/model/delete-animation';
import { buildInsertAnimation, insertKeyAnimated } from '@/playgrounds/avl/model/insert-animation';
import {
  avlStatLabels,
  computeAvlStats,
  type AvlSettings,
} from '@/playgrounds/avl/model/stats';
import type { TraversalHighlight } from '@/playgrounds/avl/ui/TraversalDrawer';
import { avlShare, type AvlAutoState } from '@/playgrounds/avl/share';
import { AVL_KEYS as KEYS, avlStorage } from '@/playgrounds/avl/storage';
import { AVL_W } from '@/playgrounds/avl/ui/node-metrics';

const load = avlStorage.load;
const save = avlStorage.save;

export const DEFAULT_ANIM_SPEED = 4;

export function useAvlAuto() {
  const trackTool = useToolTracker('avl', 'auto');
  const shared = useSharedModeState<AvlAutoState>({ tree: 'avl', mode: 'auto', adapter: avlShare });
  const sharedInitial = shared.initial;
  const commitShared = shared.commit;

  const [tree, setTree] = React.useState<AvlTree>(() => {
    if (sharedInitial) return sharedInitial.tree;
    const saved = load<AvlTree | null>(KEYS.autoTree, null);
    if (saved && (saved.keyType === 'string' || saved.keyType === 'number')) {
      return { root: saved.root ?? null, keyType: saved.keyType };
    }
    return createTree('number');
  });
  const [history, setHistory] = React.useState<HistoryItem[]>(() =>
    sharedInitial ? [] : load<HistoryItem[]>(KEYS.autoHistory, []),
  );
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
    if (!shared.active) save(KEYS.autoTree, tree);
  }, [tree, shared.active]);

  React.useEffect(() => {
    if (!shared.active) save(KEYS.autoHistory, history.slice(0, 60));
  }, [history, shared.active]);

  React.useEffect(() => {
    commitShared({ tree });
  }, [tree, commitShared]);

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
        id: (n: AvlNode) => n.id,
        children: (n) => {
          const out: AvlNode[] = [];
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

  const share = React.useMemo(() => ({ adapter: avlShare, state: { tree } }), [tree]);

  function openSettings() {
    trackUi('settings_open', { playground: 'avl', mode: 'auto' });
    setShowSettings(true);
  }

  function openHistory() {
    trackTool('history');
    setShowHistory(true);
  }

  return {
    tree,
    history,
    keyInput,
    setKeyInput,
    highlightIds,
    highlightEdges,
    traversalHighlight,
    setTraversalHighlight,
    animation,
    animationNodes,
    animationPlaying,
    setAnimationPlaying,
    animationSpeed,
    setAnimationSpeed,
    settings,
    setSettings,
    lastKey,
    displayedMessage,
    showHistory,
    setShowHistory,
    showSettings,
    setShowSettings,
    confirmClear,
    setConfirmClear,
    confirmType,
    setConfirmType,
    initialView,
    handleViewChange,
    renderTree,
    animating,
    nodeTransitionMs,
    frameIndex,
    frameFadeEdges: frame?.fadeEdges,
    layout,
    badges,
    share,
    doInsert,
    doDelete,
    doSearch,
    doRandom,
    doClear,
    changeKeyType,
    confirmTypeChange,
    openSettings,
    openHistory,
  };
}
