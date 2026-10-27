import * as React from 'react';
import { GLOBAL_KEYS } from '../storage/keys';
import { load, save } from '../storage/storage';

export function useTheme() {
  const [dark, setDark] = React.useState<boolean>(() => {
    const stored = load<string | null>(GLOBAL_KEYS.theme, null);
    if (stored) return stored === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    save(GLOBAL_KEYS.theme, dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
