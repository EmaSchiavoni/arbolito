import { createScopedStorage } from '@/common/storage/storage';

export const btreeStorage = createScopedStorage('btree');

export const BTREE_KEYS = {
  autoP: btreeStorage.key('auto-p'),
  autoTree: btreeStorage.key('auto-tree'),
  autoHistory: btreeStorage.key('auto-history'),
  autoPolicy: btreeStorage.key('auto-policy'),
  autoView: btreeStorage.key('auto-view'),
  manual: btreeStorage.key('manual-draft'),
  manualView: btreeStorage.key('manual-view'),
} as const;
