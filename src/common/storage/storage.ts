export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible: la app sigue funcionando en memoria.
  }
}

// Cada playground guarda su estado bajo su propio namespace, para que dos
// playgrounds puedan usar el mismo nombre lógico ("auto-tree") sin pisarse.
export function scopedKey(playgroundId: string, name: string): string {
  return `arboles:v2:${playgroundId}:${name}`;
}

export interface ScopedStorage {
  key: (name: string) => string;
  load: <T>(name: string, fallback: T) => T;
  save: (name: string, value: unknown) => void;
}

export function createScopedStorage(playgroundId: string): ScopedStorage {
  return {
    key: (name) => scopedKey(playgroundId, name),
    load: (name, fallback) => load(scopedKey(playgroundId, name), fallback),
    save: (name, value) => save(scopedKey(playgroundId, name), value),
  };
}

export interface StoredView {
  x: number;
  y: number;
  k: number;
}

// Vista saneada o null si no hay nada guardado válido.
export function loadView(key: string): StoredView | null {
  const v = load<StoredView | null>(key, null);
  if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.k)) return null;
  return { x: v.x, y: v.y, k: Math.min(3, Math.max(0.25, v.k)) };
}
