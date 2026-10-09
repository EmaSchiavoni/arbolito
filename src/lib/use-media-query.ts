import * as React from 'react';

export function useMediaQuery(query: string): boolean {
  return React.useSyncExternalStore(
    React.useCallback(
      (onChange) => {
        const mq = window.matchMedia(query);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  );
}
