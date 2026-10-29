// Hook de integración de un playground con la sesión compartida.
import * as React from 'react';
import type { Mode } from '../playground';
import { useSharedSession } from './session-context';
import type { PlaygroundShareAdapter } from './types';

interface UseSharedModeStateOptions {
  tree: string;
  mode: Mode;
  adapter: PlaygroundShareAdapter;
}

export interface SharedModeState<T> {
  active: boolean;
  initial: T | null;
  commit: (state: T) => void;
}

// Devuelve el estado inicial hidratado (o null si no hay sesión compartida) y
// un `commit` que mantiene la copia en memoria para cambiar de modo o guardar.
export function useSharedModeState<T>({ tree, mode, adapter }: UseSharedModeStateOptions): SharedModeState<T> {
  const session = useSharedSession();
  const link = session.link;
  const active = !!link && link.tree === tree;
  const needsHydration = active && !session.readModes().has(mode);

  const hydrated = React.useMemo(
    () => (needsHydration && link ? adapter.hydrate(link.mode, link) : undefined),
    [needsHydration, link, adapter],
  );

  const initial = React.useMemo(() => {
    if (!active) return null;
    const value = session.readModes().get(mode);
    if (value !== undefined) return value as T;
    if (hydrated && hydrated[mode] !== undefined) return hydrated[mode] as T;
    return null;
  }, [active, session, hydrated, mode]);

  React.useEffect(() => {
    if (hydrated === undefined) return;
    if (hydrated === null) {
      session.fail();
      return;
    }
    session.register(adapter, hydrated);
  }, [hydrated, adapter, session]);

  React.useEffect(() => {
    if (active) session.notifyDegraded(mode);
  }, [active, mode, session]);

  const commit = React.useCallback((state: T) => session.commit(mode, state), [session, mode]);

  return { active, initial, commit };
}
