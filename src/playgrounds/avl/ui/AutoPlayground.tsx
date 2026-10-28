import * as React from 'react';
import { Dices, Eraser, Plus, Search, Trash2 } from 'lucide-react';
import { Input } from '../../../common/components/ui/input';
import { ToolbarButton, ToolbarSeparator } from '../../../common/components/ui/toolbar';
import { AppShell } from '../../../app/AppShell';
import { useChrome } from '../../../app/use-chrome';
import { BottomToolbar } from '../../../common/components/BottomToolbar';
import { CanvasNotice } from '../../../common/components/CanvasNotice';
import { HistoryDialog, type HistoryItem } from '../../../common/components/HistoryDialog';
import { TreeCanvas } from '../../../common/components/TreeCanvas';
import { ConfirmDialog } from '../../../common/components/ui/alert-dialog';
import { toast } from '../../../common/components/ui/use-toast';
import { AvlConfig } from './AvlConfig';
import {
  balanceOf,
  contains,
  countKeys,
  createTree,
  deleteKeyLogged,
  formatStep,
  heightOf,
  insertKeyLogged,
  searchPath,
  toTreeKey,
  type AvlTree,
} from '../model/avl';
import type { Key, KeyType } from '../../../common/types';
import { layoutTree } from '../../../common/tree/layout';
import { createScopedStorage } from '../../../common/storage/storage';
import { useViewPersistence } from '../../../common/hooks/use-view-persistence';
import { parseKeyList } from '../../../common/keys/parse-key-list';
import { cn } from '../../../common/lib/utils';

const storage = createScopedStorage('avl');
const KEYS = {
  autoTree: storage.key('auto-tree'),
  autoHistory: storage.key('auto-history'),
  autoView: storage.key('auto-view'),
};
const load = storage.load;
const save = storage.save;

const AVL_W = 120;
const AVL_H = 56;

export function AutoPlayground() {
  const { hidden } = useChrome();
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
  const [lastKey, setLastKey] = React.useState<Key | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<KeyType | null>(null);

  const { initialView, handleViewChange } = useViewPersistence(KEYS.autoView, { x: 16, y: 150, k: 1 });

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

  function changeKeyType(next: KeyType) {
    if (next === tree.keyType) return;
    if (countKeys(tree.root) === 0) {
      setTree({ root: null, keyType: next });
      setHighlight(new Set());
      setLastKey(null);
      return;
    }
    setConfirmType(next);
  }

  function confirmTypeChange() {
    if (!confirmType) return;
    setTree({ root: null, keyType: confirmType });
    setHighlight(new Set());
    setLastKey(null);
    setMessage(`Tipo cambiado a ${confirmType === 'string' ? 'texto' : 'numérico'}. Árbol vaciado.`);
    pushHistory(`tipo → ${confirmType === 'string' ? 'texto' : 'numérico'} (árbol vaciado)`);
    setConfirmType(null);
  }

  function doInsert() {
    const ks = parseKeys();
    if (!ks) return;
    let cur = tree;
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
      const r = insertKeyLogged(cur, kk);
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
  }

  function doDelete() {
    const ks = parseKeys();
    if (!ks) return;
    let cur = tree;
    let deleted = 0;
    let missing = 0;
    for (const k of ks) {
      const kk = toTreeKey(cur, k);
      if (!contains(cur.root, kk)) {
        missing += 1;
        pushHistory(`eliminar ${kk} → no existe`);
        continue;
      }
      const r = deleteKeyLogged(cur, kk);
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
  }

  function doRandom() {
    const k = Math.floor(Math.random() * 100);
    const kk = toTreeKey(tree, k);
    if (contains(tree.root, kk)) {
      doRandom();
      return;
    }
    const { tree: next, touched, steps } = insertKeyLogged(tree, kk);
    setTree(next);
    setHighlight(new Set(touched));
    setLastKey(kk);
    pushHistory(`insertar ${kk} → ok (aleatorio)`, steps.map(formatStep));
    setMessage(`Clave ${kk} insertada (aleatorio).`);
  }

  function doClear() {
    setTree({ root: null, keyType: tree.keyType });
    setHighlight(new Set());
    setLastKey(null);
    setMessage('Árbol vaciado.');
    pushHistory('limpiar → árbol vacío');
  }

  const layout = React.useMemo(
    () =>
      layoutTree(tree.root, {
        id: (n) => n.id,
        children: (n) => {
          const out = [];
          if (n.left) out.push(n.left);
          if (n.right) out.push(n.right);
          return out;
        },
        width: () => AVL_W,
      }),
    [tree.root],
  );
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppShell
        playgroundId="avl"
        mode="auto"
        config={<AvlConfig keyType={tree.keyType} onKeyTypeChange={changeKeyType} />}
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
            highlightIds={highlight}
            getNodeWidth={() => AVL_W}
            getSlotCount={() => 2}
            getSlotX={(n, slot) => n.x + (slot === 0 ? AVL_W * 0.25 : AVL_W * 0.75)}
            nodeHeight={AVL_H}
            initialView={initialView}
            onViewChange={handleViewChange}
            renderNode={(placed) => {
              const n = placed.node;
              const hot = highlight.has(placed.id);
              const bf = balanceOf(n);
              return (
                <div
                  data-node
                  className={cn(
                    'flex h-14 flex-col items-center justify-center rounded-md border bg-card shadow-sm',
                    hot ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100' : 'border-border dark:border-zinc-700',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      lastKey !== null && n.key === lastKey && 'rounded bg-emerald-100 px-1 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100',
                    )}
                  >
                    {n.key}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    h {heightOf(n)} · bf {bf > 0 ? `+${bf}` : bf}
                  </span>
                </div>
              );
            }}
          />
        )}
        {message && <CanvasNotice hidden={hidden}>{message}</CanvasNotice>}
        <HistoryDialog open={showHistory} onOpenChange={setShowHistory} history={history} />
      </div>

      <BottomToolbar label="Acciones del playground automático de AVL">
        <div className="flex items-center justify-center gap-2 max-[510px]:w-full">
          <Input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doInsert();
            }}
            inputMode={tree.keyType === 'string' ? 'text' : 'numeric'}
            placeholder="Claves: 1, 2, 3"
            aria-label="Claves (una sola o lista separada por coma, punto, guion o espacio)"
            className="w-36"
          />
          <ToolbarButton size="sm" onClick={doInsert} title="Insertar" aria-label="Insertar" className="px-2"><Plus /></ToolbarButton>
          <ToolbarButton size="sm" variant="secondary" onClick={doDelete} title="Eliminar" aria-label="Eliminar" className="px-2"><Trash2 /></ToolbarButton>
          <ToolbarButton size="sm" variant="outline" onClick={doSearch} title="Buscar" aria-label="Buscar" className="px-2"><Search /></ToolbarButton>
        </div>
        <ToolbarSeparator className="mx-0.5 max-[510px]:hidden" />
        <div className="flex items-center justify-center gap-2 max-[510px]:w-full">
          <ToolbarButton size="sm" variant="ghost" onClick={doRandom} title="Insertar clave aleatoria"><Dices />Azar</ToolbarButton>
          <ToolbarButton size="sm" variant="ghost" onClick={() => setConfirmClear(true)} title="Vaciar árbol"><Eraser />Vaciar</ToolbarButton>
          <ToolbarButton size="sm" variant="outline" onClick={() => setShowHistory(true)}>
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
    </div>
  );
}
