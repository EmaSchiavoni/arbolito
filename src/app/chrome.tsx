import * as React from 'react';
import { useTheme } from '@/common/hooks/use-theme';
import { GLOBAL_KEYS } from '@/common/storage/keys';
import { load, save } from '@/common/storage/storage';
import { ChromeContext, type ChromeValue } from '@/app/chrome-context';

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const [hidden, setHidden] = React.useState<boolean>(() => load<boolean>(GLOBAL_KEYS.headerHidden, false));

  React.useEffect(() => {
    save(GLOBAL_KEYS.headerHidden, hidden);
  }, [hidden]);

  const value = React.useMemo<ChromeValue>(
    () => ({
      hidden,
      showHeader: () => setHidden(false),
      hideHeader: () => setHidden(true),
      dark,
      toggleTheme: toggle,
    }),
    [hidden, dark, toggle],
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}
