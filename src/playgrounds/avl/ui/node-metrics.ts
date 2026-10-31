
export const AVL_W = 120;
export const AVL_H = 56;

export const MANUAL_SLOT_W = 30;
export const MANUAL_KEY_W = 96;
export const MANUAL_NODE_W = MANUAL_SLOT_W * 2 + MANUAL_KEY_W;
export const MANUAL_NODE_H = 48;

export function manualSlotX(x: number, slot: number): number {
  return x + (slot === 0 ? MANUAL_SLOT_W / 2 : MANUAL_NODE_W - MANUAL_SLOT_W / 2);
}
