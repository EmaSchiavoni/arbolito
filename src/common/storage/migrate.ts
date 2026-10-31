import { GLOBAL_KEYS, LEGACY_KEYS, MIGRATION_KEY } from '@/common/storage/keys';
import { load, save, scopedKey } from '@/common/storage/storage';

// Migra el estado de la versión anterior (una sola app de Árbol B) al nuevo
// esquema con namespaces. Es idempotente y conserva las claves viejas.
export function migrateStorage(): void {
  try {
    const raw = (key: string) => localStorage.getItem(key);
    const move = (from: string, to: string) => {
      const value = raw(from);
      if (value !== null && raw(to) === null) localStorage.setItem(to, value);
    };

    // Versiones anteriores duplicaban el namespace al combinar `key()` con
    // `load()`. Se copian esas claves a su nombre correcto antes de migrar.
    const repairDoubled = (playgroundId: string, names: string[]) => {
      for (const name of names) {
        const single = scopedKey(playgroundId, name);
        move(scopedKey(playgroundId, single), single);
      }
    };
    repairDoubled('btree', [
      'auto-p',
      'auto-tree',
      'auto-history',
      'auto-policy',
      'auto-view',
      'manual-draft',
      'manual-view',
    ]);
    repairDoubled('avl', [
      'auto-tree',
      'auto-history',
      'auto-view',
      'auto-speed',
      'auto-settings',
      'manual-draft',
      'manual-view',
    ]);

    if (load<boolean>(MIGRATION_KEY, false)) return;

    move(LEGACY_KEYS.theme, GLOBAL_KEYS.theme);
    move(LEGACY_KEYS.headerHidden, GLOBAL_KEYS.headerHidden);
    move(LEGACY_KEYS.autoP, scopedKey('btree', 'auto-p'));
    move(LEGACY_KEYS.autoTree, scopedKey('btree', 'auto-tree'));
    move(LEGACY_KEYS.autoHistory, scopedKey('btree', 'auto-history'));
    move(LEGACY_KEYS.autoPolicy, scopedKey('btree', 'auto-policy'));
    move(LEGACY_KEYS.autoView, scopedKey('btree', 'auto-view'));
    move(LEGACY_KEYS.manual, scopedKey('btree', 'manual-draft'));
    move(LEGACY_KEYS.manualView, scopedKey('btree', 'manual-view'));

    if (raw(GLOBAL_KEYS.lastPlayground) === null) save(GLOBAL_KEYS.lastPlayground, 'btree');
    save(MIGRATION_KEY, true);
  } catch {
  }
}
