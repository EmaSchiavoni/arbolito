
export const AUTO_PTR_W = 14;
export const AUTO_KEY_W = 40;
export const AUTO_H = 48;

export function autoTableWidth(p: number): number {
  return p * AUTO_PTR_W + (p - 1) * AUTO_KEY_W;
}

export function autoSlotX(x: number, slot: number): number {
  return x + slot * (AUTO_PTR_W + AUTO_KEY_W) + AUTO_PTR_W / 2;
}

export const MANUAL_SLOT_W = 30;
export const MANUAL_KEY_W = 64;

export function manualNodeWidth(p: number): number {
  return Math.max(150, p * MANUAL_SLOT_W + (p - 1) * MANUAL_KEY_W);
}

// Coordenada x absoluta del centro de la columna del slot (para la flecha).
export function manualSlotX(x: number, p: number, slot: number): number {
  const w = manualNodeWidth(p);
  const keyW = (w - p * MANUAL_SLOT_W) / (p - 1);
  return x + slot * (MANUAL_SLOT_W + keyW) + MANUAL_SLOT_W / 2;
}
