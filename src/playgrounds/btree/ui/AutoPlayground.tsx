import * as React from 'react';
import { Dices, Eraser, Plus, Search, Trash2 } from 'lucide-react';
import { Input } from '../../../common/components/ui/input';
import { ToolbarButton, ToolbarSeparator } from '../../../common/components/ui/toolbar';
import { AppShell } from '../../../app/AppShell';
import { useChrome } from '../../../app/use-chrome';
import { BottomToolbar } from '../../../common/components/BottomToolbar';
import { CanvasNotice } from '../../../common/components/CanvasNotice';
import { HistoryDialog, type HistoryItem } from '../../../common/components/HistoryDialog';
import { ORDER_MAX, ORDER_MIN } from '../../../common/components/OrderPicker';
import { SettingsDialog } from './SettingsDialog';
import { BTreeConfig } from './BTreeConfig';
import { TreeCanvas } from '../../../common/components/TreeCanvas';
import { cmpKey, contains, countKeys, createTree, deleteKeyLogged, formatStep, insertKey, insertKeyLogged, searchPath, toTreeKey, type BTree, type BTreePolicy, type Key } from '../model/btree';
import { layoutTree } from '../../../common/tree/layout';
import { useViewPersistence } from '../../../common/hooks/use-view-persistence';
import { parseKeyList } from '../../../common/keys/parse-key-list';
import { toast } from '../../../common/components/ui/use-toast';
import { ConfirmDialog } from '../../../common/components/ui/alert-dialog';
import { trackConfig, trackUi, useToolTracker } from '../../../common/analytics';
import { cn } from '../../../common/lib/utils';
import { BTREE_KEYS as KEYS, btreeStorage } from '../storage';
import { btreeShare } from '../share';
import { AUTO_H, AUTO_KEY_W, AUTO_PTR_W, autoSlotX, autoTableWidth } from './node-metrics';

const load = btreeStorage.load;
const save = btreeStorage.save;

export function AutoPlayground() {
  const { hidden } = useChrome();
  const trackTool = useToolTracker('btree', 'auto');
  const [p, setP] = React.useState<number>(() => load<number>(KEYS.autoP, 4));
  const [tree, setTree] = React.useState<BTree>(() => {
    const saved = load<{ p: number; root: BTree['root']; keyType?: BTree['keyType'] } | null>(KEYS.autoTree, null);
    if (saved && saved.p >= ORDER_MIN && saved.p <= ORDER_MAX) {
      return { p: saved.p, root: saved.root, keyType: saved.keyType === 'string' ? 'string' : 'number' };
    }
    return createTree(load<number>(KEYS.autoP, 4));
  });
  const [history, setHistory] = React.useState<HistoryItem[]>(() => load<HistoryItem[]>(KEYS.autoHistory, []));
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
    save(KEYS.autoP, p);
    if (tree.p !== p) setTree((t) => ({ ...t, p }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  React.useEffect(() => {
    save(KEYS.autoTree, tree);
  }, [tree]);

  React.useEffect(() => {
    save(KEYS.autoHistory, history.slice(0, 60));
  }, [history]);

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

  const layout = React.useMemo(
    () =>
      layoutTree(tree.root, {
        id: (n) => n.id,
        children: (n) => n.children,
        width: () => autoTableWidth(p),
      }),
    [tree.root, p],
  );
  const connected = React.useMemo(() => new Set(layout.edges.map((e) => `${e.from}:${e.slot}`)), [layout]);
  const share = React.useMemo(() => ({ adapter: btreeShare, state: { p, tree } }), [p, tree]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="btree"
        mode="auto"
        share={share}
        config={
          <BTreeConfig
            id="orden-auto"
            p={p}
            onPChange={changeP}
            keyType={tree.keyType}
            onKeyTypeChange={changeKeyType}
            onOpenSettings={() => {
              trackUi('settings_open', { playground: 'btree', mode: 'auto' });
              setShowSettings(true);
            }}
          />
        }
      />
      <div className="relative min-h-0 flex-1">
      {tree.root === null ? (
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
          highlightIds={highlight}
          getNodeWidth={() => autoTableWidth(p)}
          getSlotX={(n, slot) => autoSlotX(n.x, slot)}
          nodeHeight={AUTO_H}
          initialView={initialView}
          onViewChange={handleViewChange}
          renderNode={(placed) => {
            const n = placed.node;
            const hot = highlight.has(placed.id);
            const cols: string[] = [];
            for (let s = 0; s < p; s += 1) {
              cols.push(`${AUTO_PTR_W}px`);
              if (s < p - 1) cols.push(`${AUTO_KEY_W}px`);
            }
            return (
              <div
                data-node
                className={cn(
                  'rounded-md border bg-card shadow-sm',
                  hot ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100' : 'border-border dark:border-zinc-700',
                )}
              >
                <div className="grid h-12 w-full" style={{ gridTemplateColumns: cols.join(' ') }}>
                  {Array.from({ length: p }, (_, s) => (
                    <span key={s} className="contents">
                      <span className={cn('flex items-center justify-center', s > 0 && 'border-l border-border dark:border-zinc-700')}>
                        <span
                          title={connected.has(`${n.id}:${s}`) ? `Puntero ${s} conectado` : `Puntero ${s} nulo`}
                          className={cn(
                            'size-1.5 rounded-full',
                            connected.has(`${n.id}:${s}`) ? 'bg-zinc-700 dark:bg-zinc-300' : 'border border-zinc-300 dark:border-zinc-600',
                          )}
                        />
                      </span>
                      {s < p - 1 && (
                        <span
                          className={cn(
                            'flex items-center justify-center border-l border-border text-sm font-medium dark:border-zinc-700',
                            lastKey !== null && n.keys[s] === lastKey && 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100',
                          )}
                        >
                          {n.keys[s] ?? ''}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          }}
          />
      )}
      {message && <CanvasNotice hidden={hidden}>{message}</CanvasNotice>}
      <HistoryDialog open={showHistory} onOpenChange={setShowHistory} history={history} />
    </div>

      <BottomToolbar label="Acciones del playground automático">
        <div className="flex items-center justify-center gap-2 max-[665px]:w-full">
          <Input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doInsert(); }}
            inputMode={tree.keyType === 'string' ? 'text' : 'numeric'}
            placeholder="Claves: 1, 2, 3"
            aria-label="Claves (una sola o lista separada por coma, punto, guion o espacio)"
            className="w-36"
          />
          <ToolbarButton size="sm" onClick={doInsert} title="Insertar" aria-label="Insertar" className="px-2"><Plus /></ToolbarButton>
          <ToolbarButton size="sm" variant="secondary" onClick={doDelete} title="Eliminar" aria-label="Eliminar" className="px-2"><Trash2 /></ToolbarButton>
          <ToolbarButton size="sm" variant="outline" onClick={doSearch} title="Buscar" aria-label="Buscar" className="px-2"><Search /></ToolbarButton>
        </div>
        <ToolbarSeparator className="mx-0.5 max-[665px]:hidden" />
        <div className="flex items-center justify-center gap-2 max-[665px]:w-full">
          <ToolbarButton size="sm" variant="ghost" onClick={doRandom} title="Insertar clave aleatoria"><Dices />Azar</ToolbarButton>
          <ToolbarButton size="sm" variant="ghost" onClick={() => setConfirmClear(true)} title="Vaciar árbol"><Eraser />Vaciar</ToolbarButton>
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
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} settings={policy} onChange={setPolicy} />
    </div>
  );
}
