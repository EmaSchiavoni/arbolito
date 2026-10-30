// Claves de localStorage del Árbol AVL, en un solo lugar. Se usan tanto en
// los playgrounds como en el adaptador de enlaces compartidos.
import { createScopedStorage } from '@/common/storage/storage';

export const avlStorage = createScopedStorage('avl');

export const AVL_KEYS = {
  autoTree: avlStorage.key('auto-tree'),
  autoHistory: avlStorage.key('auto-history'),
  autoView: avlStorage.key('auto-view'),
  autoSpeed: avlStorage.key('auto-speed'),
  autoSettings: avlStorage.key('auto-settings'),
  manual: avlStorage.key('manual-draft'),
  manualView: avlStorage.key('manual-view'),
} as const;
