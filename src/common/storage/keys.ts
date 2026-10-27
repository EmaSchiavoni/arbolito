export const GLOBAL_KEYS = {
  theme: 'arboles:theme',
  headerHidden: 'arboles:header-hidden',
  lastPlayground: 'arboles:last-playground',
} as const;

// Claves de la versión anterior (una sola app de Árbol B). Solo se usan para
// migrar los datos existentes; no se borran.
export const LEGACY_KEYS = {
  theme: 'arboles-b:tema',
  headerHidden: 'arboles-b:header-hidden',
  autoP: 'arboles-b:auto-p',
  autoTree: 'arboles-b:auto-tree',
  autoHistory: 'arboles-b:auto-history',
  autoPolicy: 'arboles-b:auto-policy',
  autoView: 'arboles-b:auto-view',
  manual: 'arboles-b:manual-draft',
  manualView: 'arboles-b:manual-view',
  tab: 'arboles-b:tab',
} as const;

export const MIGRATION_KEY = 'arboles:v2:migrated';
