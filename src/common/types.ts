
export type Key = number | string;

export type KeyType = 'number' | 'string';

export function cmpKey(a: Key, b: Key): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const x = String(a);
  const y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

// Normaliza una clave entrante al modo del árbol (defensivo: la UI no
// debería enviar claves de otro modo).
export function toKey(keyType: KeyType, key: Key): Key {
  return keyType === 'string' ? String(key) : key;
}

export function isValidKey(keyType: KeyType, key: Key): boolean {
  if (keyType === 'string') return typeof key === 'string' && key.length > 0;
  return typeof key === 'number' && Number.isFinite(key) && Number.isInteger(key);
}
