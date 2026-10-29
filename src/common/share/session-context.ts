// Contexto de la sesión compartida. Vive separado del provider para que el
// archivo del componente solo exporte componentes (Fast Refresh).
import * as React from 'react';
import type { Mode } from '../playground';
import type {
  HydratedModes,
  PlaygroundShareAdapter,
  SaveTarget,
  SharedLink,
  SharedSessionStatus,
} from './types';

export interface SharedSessionValue {
  link: SharedLink | null;
  active: boolean;
  dirty: boolean;
  minimized: boolean;
  status: SharedSessionStatus;
  resetKey: number;
  minimize: () => void;
  expand: () => void;
  readModes: () => Map<Mode, unknown>;
  register: (adapter: PlaygroundShareAdapter, hydrated: HydratedModes) => void;
  fail: () => void;
  notifyDegraded: (mode: Mode) => void;
  commit: (mode: Mode, state: unknown) => void;
  save: (adapter: PlaygroundShareAdapter, target: SaveTarget) => boolean;
}

export const SharedSessionContext = React.createContext<SharedSessionValue | null>(null);

export function useSharedSession(): SharedSessionValue {
  const value = React.useContext(SharedSessionContext);
  if (!value) throw new Error('useSharedSession debe usarse dentro de SharedSessionProvider');
  return value;
}
