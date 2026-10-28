import * as React from 'react';

export interface ChromeValue {
  hidden: boolean;
  showHeader: () => void;
  hideHeader: () => void;
  dark: boolean;
  toggleTheme: () => void;
}

export const ChromeContext = React.createContext<ChromeValue | null>(null);
