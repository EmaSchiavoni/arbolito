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
  const prefix = `arboles:v2:${playgroundId}:`;
  // Acepta tanto un nombre lógico ("auto-tree") como una clave ya completa.
  // Así `storage.key(...)` se puede pasar a `load`/`save` sin duplicar el
  // namespace por accidente.
  const full = (name: string) => (name.startsWith(prefix) ? name : `${prefix}${name}`);
  return {
    key: (name) => `${prefix}${name}`,
    load: (name, fallback) => load(full(name), fallback),
    save: (name, value) => save(full(name), value),
  };
}

export interface StoredView {
  x: number;
  y: number;
  k: number;
}

export function loadView(key: string): StoredView | null {
  const v = load<StoredView | null>(key, null);
  if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.k)) return null;
  return { x: v.x, y: v.y, k: Math.min(3, Math.max(0.25, v.k)) };
}
