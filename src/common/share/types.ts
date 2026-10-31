// Tipos del intercambio de árboles por enlace. El formato visible de la URL
// vive en `codec.ts`; cada playground implementa un `PlaygroundShareAdapter`
// que traduce su estado interno a/desde `SharedTreeData`.

import type { Mode } from '@/common/playground';
import type { KeyType } from '@/common/types';

export interface SharedTreeData {
  keyType: KeyType;
  /** Solo los árboles que lo necesitan (Árbol B). */
  order?: number;
  nodes: unknown;
}

export interface SharedLink extends SharedTreeData {
  tree: string;
  mode: Mode;
}

export interface HydratedModes {
  auto: unknown;
  manual: unknown;
  /** Modos que hubo que reconstruir porque el origen no era convertible. */
  degraded?: Mode[];
}

export interface PlaygroundShareAdapter {
  serialize: (mode: Mode, state: unknown) => SharedTreeData | null;
  hydrate: (mode: Mode, data: SharedTreeData) => HydratedModes | null;
  hasSavedData: (mode: Mode) => boolean;
  save: (mode: Mode, state: unknown) => boolean;
  isEmpty: (mode: Mode, state: unknown) => boolean;
}

export type SaveTarget = 'auto' | 'manual' | 'both';

export type SharedSessionStatus = 'idle' | 'pending' | 'protected' | 'done';
