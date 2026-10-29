// Provider de la sesión de un árbol compartido por enlace.
//
// Reglas:
// - Vive solo en memoria: nada se escribe en localStorage hasta guardar.
// - Cada modo mantiene una copia independiente derivada del mismo enlace.
// - Cambiar de modo conserva el `?shared=...` y las copias ya editadas.
// - Si el modo del enlace no tenía datos guardados, se guarda solo y se
//   limpia la URL; si tenía, se protege con el aviso y el botón Guardar.
//
// La sesión es un objeto mutable en memoria: los mapas de estados y el flag
// `status` se actualizan fuera de los setters de React a propósito.
// oxlint-disable react/immutability, react/set-state-in-effect

import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Mode } from '../playground';
import { toast } from '../components/ui/use-toast';
import { trackUi } from '../analytics';
import { isSharedSearch, parseShareSearch } from './codec';
import { SharedSessionContext, type SharedSessionValue } from './session-context';
import type {
  HydratedModes,
  PlaygroundShareAdapter,
  SaveTarget,
  SharedLink,
  SharedSessionStatus,
} from './types';

interface SessionMemory {
  link: SharedLink;
  states: Map<Mode, unknown>;
  baselines: Map<Mode, string>;
  registered: boolean;
  fresh: boolean;
  status: Exclude<SharedSessionStatus, 'idle'>;
  degraded: Set<Mode>;
  notified: Set<Mode>;
}

interface SessionEntry {
  search: string;
  memory: SessionMemory;
}

function fingerprint(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

function createSession(link: SharedLink): SessionMemory {
  return {
    link,
    states: new Map(),
    baselines: new Map(),
    registered: false,
    fresh: true,
    status: 'pending',
    degraded: new Set(),
    notified: new Set(),
  };
}

export function SharedSessionProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const sharedSearch = isSharedSearch(location.search);
  const parsed = React.useMemo(
    () => (sharedSearch ? parseShareSearch(location.search) : null),
    [sharedSearch, location.search],
  );
  const [treeId, modeId] = location.pathname.split('/').filter(Boolean);
  const desiredSearch = parsed && parsed.tree === treeId ? location.search : null;

  // La sesión se crea en el mismo render en que aparece el enlace para que los
  // playgrounds inicialicen su estado con los datos hidratados. El ajuste de
  // estado en render hace que React vuelva a renderizar antes de montar hijos.
  const [entry, setEntry] = React.useState<SessionEntry | null>(() =>
    desiredSearch && parsed ? { search: desiredSearch, memory: createSession(parsed) } : null,
  );
  if ((entry?.search ?? null) !== desiredSearch) {
    setEntry(desiredSearch && parsed ? { search: desiredSearch, memory: createSession(parsed) } : null);
  }
  const session = entry?.search === desiredSearch ? entry.memory : null;

  const [dirty, setDirty] = React.useState(false);
  const dirtyRef = React.useRef(false);
  const [minimized, setMinimized] = React.useState(false);
  const [status, setStatus] = React.useState<SharedSessionStatus>('idle');
  const [resetKey, setResetKey] = React.useState(0);
  const handledRef = React.useRef<string | null>(null);

  const finish = React.useCallback(() => {
    if (session) session.status = 'done';
    dirtyRef.current = false;
    setDirty(false);
    setMinimized(false);
    setStatus('idle');
    setResetKey((k) => k + 1);
    navigate({ pathname: location.pathname, search: '' }, { replace: true });
  }, [navigate, location.pathname, session]);

  // Validar el enlace y alinear la ruta con lo que indica.
  React.useEffect(() => {
    if (!sharedSearch) {
      handledRef.current = null;
      return;
    }
    if (!parsed) {
      if (handledRef.current === location.search) return;
      handledRef.current = location.search;
      toast({ description: 'El enlace compartido está dañado o incompleto.' });
      finish();
      return;
    }
    if (parsed.tree !== treeId) {
      navigate(`/${parsed.tree}/${parsed.mode}${location.search}`, { replace: true });
      return;
    }
    if (session?.fresh) {
      session.fresh = false;
      if (parsed.mode !== modeId) {
        navigate(`/${parsed.tree}/${parsed.mode}${location.search}`, { replace: true });
      }
    }
  }, [sharedSearch, parsed, treeId, modeId, location.search, navigate, finish, session]);

  // Refrescar los estados derivados cuando cambia la sesión.
  React.useEffect(() => {
    if (!session) {
      setStatus('idle');
      setMinimized(false);
      setDirty(false);
      dirtyRef.current = false;
      return;
    }
    setStatus(session.status);
    setMinimized(false);
    setDirty(false);
    dirtyRef.current = false;
  }, [session]);

  // Aviso nativo al cerrar o actualizar con cambios sin guardar.
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const register = React.useCallback((adapter: PlaygroundShareAdapter, hydrated: HydratedModes) => {
    if (!session || session.registered || session.status !== 'pending') return;
    session.registered = true;
    for (const m of ['auto', 'manual'] as const) {
      session.states.set(m, hydrated[m]);
      session.baselines.set(m, fingerprint(hydrated[m]));
    }
    for (const m of hydrated.degraded ?? []) session.degraded.add(m);

    // Sin datos previos no hay nada que proteger: se guarda y se abandona el
    // modo compartido sin mostrar el aviso.
    if (!adapter.hasSavedData(session.link.mode)) {
      const ok = adapter.save(session.link.mode, hydrated[session.link.mode]);
      trackUi('shared_autosave', { playground: session.link.tree, mode: session.link.mode, ok });
      if (ok) {
        finish();
      } else {
        session.status = 'protected';
        setStatus('protected');
        toast({ description: 'No se pudo guardar el árbol compartido. Probá de nuevo.' });
      }
      return;
    }

    session.status = 'protected';
    setStatus('protected');
  }, [session, finish]);

  const fail = React.useCallback(() => {
    if (!session || session.status === 'done') return;
    session.status = 'done';
    toast({ description: 'No se pudo reconstruir el árbol de este enlace.' });
    finish();
  }, [session, finish]);

  const commit = React.useCallback((mode: Mode, state: unknown) => {
    if (!session || session.status !== 'protected') return;
    session.states.set(mode, state);
    const value = fingerprint(state);
    if (!session.baselines.has(mode)) session.baselines.set(mode, value);
    if (!dirtyRef.current && value !== session.baselines.get(mode)) {
      dirtyRef.current = true;
      setDirty(true);
      trackUi('shared_edit', { playground: session.link.tree, mode });
    }
  }, [session]);

  const notifyDegraded = React.useCallback((mode: Mode) => {
    if (!session || !session.degraded.has(mode) || session.notified.has(mode)) return;
    session.notified.add(mode);
    toast({
      description: 'El árbol del enlace no era válido para este modo; se reconstruyó con las mismas claves.',
    });
  }, [session]);

  const save = React.useCallback((adapter: PlaygroundShareAdapter, target: SaveTarget) => {
    if (!session || session.status !== 'protected') return false;
    const modes: Mode[] = target === 'both' ? ['auto', 'manual'] : [target];
    for (const mode of modes) {
      const state = session.states.get(mode);
      if (state === undefined || !adapter.save(mode, state)) {
        toast({ description: 'No se pudieron guardar los cambios. Probá de nuevo.' });
        return false;
      }
    }
    trackUi('shared_save', { playground: session.link.tree, target });
    finish();
    return true;
  }, [session, finish]);

  const value = React.useMemo<SharedSessionValue>(
    () => ({
      link: session?.link ?? null,
      active: session !== null,
      dirty,
      minimized,
      status,
      resetKey,
      minimize: () => {
        setMinimized(true);
        trackUi('shared_notice_minimize', { playground: session?.link.tree });
      },
      expand: () => {
        setMinimized(false);
        trackUi('shared_notice_expand', { playground: session?.link.tree });
      },
      readModes: () => session?.states ?? new Map<Mode, unknown>(),
      register,
      fail,
      notifyDegraded,
      commit,
      save,
    }),
    [session, dirty, minimized, status, resetKey, register, fail, notifyDegraded, commit, save],
  );

  return <SharedSessionContext.Provider value={value}>{children}</SharedSessionContext.Provider>;
}
