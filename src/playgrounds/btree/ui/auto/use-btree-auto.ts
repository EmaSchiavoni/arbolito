import * as React from 'react';
import { ORDER_MAX, ORDER_MIN } from '@/common/components/OrderPicker';
import type { HistoryItem } from '@/common/components/HistoryDialog';
import { toast } from '@/common/components/ui/use-toast';
import { useViewPersistence } from '@/common/hooks/use-view-persistence';
import { parseKeyList } from '@/common/keys/parse-key-list';
import { useSharedModeState } from '@/common/share/use-shared-mode-state';
import { layoutTree } from '@/common/tree/layout';
import { trackConfig, trackUi, useToolTracker } from '@/common/analytics';
import {
  cmpKey,
  contains,
  countKeys,
  createTree,
  deleteKeyLogged,
  formatStep,
  insertKey,
  insertKeyLogged,
  searchPath,
  toTreeKey,
  type BNode,
  type BTree,
  type BTreePolicy,
  type Key,
} from '@/playgrounds/btree/model/btree';
import { btreeShare, type BTreeAutoState } from '@/playgrounds/btree/share';
import { BTREE_KEYS as KEYS, btreeStorage } from '@/playgrounds/btree/storage';
import { autoTableWidth } from '@/playgrounds/btree/ui/node-metrics';

const load = btreeStorage.load;
const save = btreeStorage.save;

export function useBTreeAuto() {
  const trackTool = useToolTracker('btree', 'auto');
  const shared = useSharedModeState<BTreeAutoState>({ tree: 'btree', mode: 'auto', adapter: btreeShare });
  const sharedInitial = shared.initial;
  const commitShared = shared.commit;

  const [p, setP] = React.useState<number>(() => sharedInitial?.p ?? load<number>(KEYS.autoP, 4));
  const [tree, setTree] = React.useState<BTree>(() => {
    if (sharedInitial) return sharedInitial.tree;
    const saved = load<{ p: number; root: BTree['root']; keyType?: BTree['keyType'] } | null>(KEYS.autoTree, null);
    if (saved && saved.p >= ORDER_MIN && saved.p <= ORDER_MAX) {
      return { p: saved.p, root: saved.root, keyType: saved.keyType === 'string' ? 'string' : 'number' };
    }
    return createTree(load<number>(KEYS.autoP, 4));
  });
  const [history, setHistory] = React.useState<HistoryItem[]>(() =>
    sharedInitial ? [] : load<HistoryItem[]>(KEYS.autoHistory, []),
  );
  const [keyInput, setKeyInput] = React.useState('');
  const [highlight, setHighlight] = React.useState<Set<string>>(new Set());
  const [lastKey, setLastKey] = React.useState<Key | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<BTree['keyType'] | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);

  // Política del algoritmo (qué lado priorizar). Por defecto la cátedra.
  // Se aplica a las operaciones futuras y se conserva en localStorage.
  const [policy, setPolicy] = React.useState<BTreePolicy>(() => {
    const saved = load<Partial<BTreePolicy> | null>(KEYS.autoPolicy, null);
    const side = (v: unknown): 'left' | 'right' => (v === 'left' || v === 'right' ? v : 'left');
    return {
      splitMedian: side(saved?.splitMedian),
      borrowFrom: side(saved?.borrowFrom),
      mergeWith: side(saved?.mergeWith),
      replaceWith: saved?.replaceWith === 'succ' ? 'succ' : 'pred',
    };
  });
  React.useEffect(() => {
    save(KEYS.autoPolicy, policy);
  }, [policy]);

  // Vista del canvas (paneo/zoom): se restaura al abrir y se guarda con
  // debounce en cada cambio (más un volcado al desmontar por cambio de modo).
  const { initialView, handleViewChange } = useViewPersistence(KEYS.autoView, { x: 16, y: 150, k: 1 });

  React.useEffect(() => {
    if (!shared.active) save(KEYS.autoP, p);
  }, [p, shared.active]);

  React.useEffect(() => {
    if (tree.p !== p) setTree((t) => ({ ...t, p }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  React.useEffect(() => {
    if (!shared.active) save(KEYS.autoTree, tree);
  }, [tree, shared.active]);

  React.useEffect(() => {
    if (!shared.active) save(KEYS.autoHistory, history.slice(0, 60));
  }, [history, shared.active]);

  React.useEffect(() => {
    commitShared({ p, tree });
  }, [p, tree, commitShared]);

  function pushHistory(text: string, steps: string[] = []) {
    setHistory((h) => [{ id: Date.now() + Math.random(), text, steps }, ...h].slice(0, 60));
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

  // Cambiar el tipo con el árbol vacío es directo; con claves pide
  // confirmación porque vacía el árbol.
  function changeKeyType(next: BTree['keyType']) {
    if (next === tree.keyType) return;
    if (countKeys(tree.root) === 0) {
      setTree({ p, root: null, keyType: next });
      setHighlight(new Set());
      setLastKey(null);
      trackConfig('key_type', next, { playground: 'btree', mode: 'auto' });
      return;
    }
    setConfirmType(next);
  }

  function confirmTypeChange() {
    if (!confirmType) return;
    setTree({ p, root: null, keyType: confirmType });
    setHighlight(new Set());
    setLastKey(null);
    setMessage(`Tipo cambiado a ${confirmType === 'string' ? 'texto' : 'numérico'}. Árbol vaciado.`);
    pushHistory(`tipo → ${confirmType === 'string' ? 'texto' : 'numérico'} (árbol vaciado)`);
    trackConfig('key_type', confirmType, { playground: 'btree', mode: 'auto', emptied: true });
    setConfirmType(null);
  }

  function doInsert() {
    const ks = parseKeys();
    if (!ks) return;
    let cur = { ...tree, p };
    let inserted = 0;
    let dups = 0;
    let touched: string[] = [];
    let lastK: Key | null = null;
    for (const k of ks) {
      const kk = toTreeKey(cur, k);
      if (contains(cur.root, kk)) {
        dups += 1;
        pushHistory(`insertar ${kk} → duplicada`);
        continue;
      }
      const r = insertKeyLogged(cur, kk, policy);
      cur = r.tree;
      touched = r.touched;
      lastK = kk;
      inserted += 1;
      pushHistory(`insertar ${kk} → ok`, r.steps.map(formatStep));
    }
    setTree(cur);
    setHighlight(new Set(touched));
    setLastKey(lastK);
    if (ks.length === 1) {
      setMessage(inserted === 1 ? `Clave ${ks[0]} insertada.` : `La clave ${ks[0]} ya existe.`);
    } else {
      const parts = [plural(inserted, 'insertada', 'insertadas')];
      if (dups > 0) parts.push(plural(dups, 'duplicada', 'duplicadas'));
      setMessage(parts.join(', ') + '.');
    }
    setKeyInput('');
    trackTool('insert', {
      keys: ks.length,
      inserted,
      duplicates: dups,
      key_type: tree.keyType,
    });
  }

  function doDelete() {
    const ks = parseKeys();
    if (!ks) return;
    let cur = { ...tree, p };
    let deleted = 0;
    let missing = 0;
    for (const k of ks) {
      const kk = toTreeKey(cur, k);
      if (!contains(cur.root, kk)) {
        missing += 1;
        pushHistory(`eliminar ${kk} → no existe`);
        continue;
      }
      const r = deleteKeyLogged(cur, kk, policy);
      cur = r.tree;
      deleted += 1;
      pushHistory(`eliminar ${kk} → ok`, r.steps.map(formatStep));
    }
    setTree(cur);
    setHighlight(new Set());
    setLastKey(null);
    if (ks.length === 1) {
      setMessage(deleted === 1 ? `Clave ${ks[0]} eliminada.` : `La clave ${ks[0]} no existe.`);
    } else {
      const parts = [plural(deleted, 'eliminada', 'eliminadas')];
      if (missing > 0) parts.push(plural(missing, 'no existía', 'no existían'));
      setMessage(parts.join(', ') + '.');
    }
    setKeyInput('');
    trackTool('delete', { keys: ks.length, deleted, missing });
  }

  function doSearch() {
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
    const k = Math.floor(Math.random() * 100);
    const kk = toTreeKey(tree, k);
    if (contains(tree.root, kk)) {
      doRandom();
      return;
    }
    const { tree: next, touched, steps } = insertKeyLogged({ ...tree, p }, kk, policy);
    setTree(next);
    setHighlight(new Set(touched));
    setLastKey(kk);
    pushHistory(`insertar ${kk} → ok (aleatorio)`, steps.map(formatStep));
    setMessage(`Clave ${kk} insertada (aleatorio).`);
    trackTool('random');
  }

  function doClear() {
    // Vaciar conserva el tipo elegido (es un ajuste como el orden).
    setTree({ p, root: null, keyType: tree.keyType });
    setHighlight(new Set());
    setLastKey(null);
    setMessage('Árbol vaciado.');
    pushHistory('limpiar → árbol vacío');
    trackTool('clear');
  }

  function changeP(next: number) {
    const clamped = Math.min(ORDER_MAX, Math.max(ORDER_MIN, next));
    if (clamped === p) return;
    // Cambiar p reconstruye insertando las claves existentes en orden.
    const keys: Key[] = [];
    (function walk(n = tree.root) {
      if (!n) return;
      n.keys.forEach((k) => keys.push(k));
      n.children.forEach((c) => walk(c));
    })();
    keys.sort(cmpKey);
    let rebuilt: BTree = { p: clamped, root: null, keyType: tree.keyType };
    for (const k of keys) rebuilt = insertKey(rebuilt, k, policy);
    setP(clamped);
    setTree(rebuilt);
    setHighlight(new Set());
    setLastKey(null);
    pushHistory(`orden p=${clamped} → reconstruido con ${keys.length} claves`);
    trackConfig('order_p', clamped, { playground: 'btree', mode: 'auto' });
  }

  function openSettings() {
    trackUi('settings_open', { playground: 'btree', mode: 'auto' });
    setShowSettings(true);
  }

  function openHistory() {
    trackTool('history');
    setShowHistory(true);
  }

  const layout = React.useMemo(
    () =>
      layoutTree(tree.root, {
        id: (n: BNode) => n.id,
        children: (n) => n.children,
        width: () => autoTableWidth(p),
      }),
    [tree.root, p],
  );
  const connected = React.useMemo(() => new Set(layout.edges.map((e) => `${e.from}:${e.slot}`)), [layout]);
  const share = React.useMemo(() => ({ adapter: btreeShare, state: { p, tree } }), [p, tree]);

  return {
    p,
    tree,
    history,
    keyInput,
    setKeyInput,
    highlight,
    lastKey,
    message,
    showHistory,
    setShowHistory,
    confirmClear,
    setConfirmClear,
    confirmType,
    setConfirmType,
    showSettings,
    setShowSettings,
    policy,
    setPolicy,
    initialView,
    handleViewChange,
    layout,
    connected,
    share,
    doInsert,
    doDelete,
    doSearch,
    doRandom,
    doClear,
    changeP,
    changeKeyType,
    confirmTypeChange,
    openSettings,
    openHistory,
  };
}
