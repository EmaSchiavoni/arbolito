// Tipos del intercambio de árboles por enlace. El formato visible de la URL
// vive en `codec.ts`; cada playground implementa un `PlaygroundShareAdapter`
// que traduce su estado interno a/desde `SharedTreeData`.

import type { Mode } from '../playground';
import type { KeyType } from '../types';

/** Datos neutros de un árbol compartido, comunes a todos los playgrounds. */
export interface SharedTreeData {
  keyType: KeyType;
  /** Solo los árboles que lo necesitan (Árbol B). */
  order?: number;
  /** Estructura serializada por el adaptador del playground. */
  nodes: unknown;
}

/** Enlace ya decodificado. `mode` indica cómo interpretar `nodes`. */
export interface SharedLink extends SharedTreeData {
  tree: string;
  mode: Mode;
}

/** Estados iniciales de ambos modos, derivados del mismo enlace. */
export interface HydratedModes {
  auto: unknown;
  manual: unknown;
  /** Modos que hubo que reconstruir porque el origen no era convertible. */
  degraded?: Mode[];
}

export interface PlaygroundShareAdapter {
  /** Serializa el estado actual del modo; `null` si no hay nada que compartir. */
  serialize: (mode: Mode, state: unknown) => SharedTreeData | null;
  /** Deriva una copia independiente para cada modo a partir del enlace. */
  hydrate: (mode: Mode, data: SharedTreeData) => HydratedModes | null;
  /** ¿Hay información guardada del modo que se perdería al sobreescribirla? */
  hasSavedData: (mode: Mode) => boolean;
  /** Persiste el estado del modo como su copia guardada. */
  save: (mode: Mode, state: unknown) => boolean;
  /** ¿El estado no contiene ningún dato que valga la pena compartir? */
  isEmpty: (state: unknown) => boolean;
}

/** Elección explícita del diálogo de guardado. */
export type SaveTarget = 'auto' | 'manual' | 'both';
