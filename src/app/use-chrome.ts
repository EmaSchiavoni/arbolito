import * as React from 'react';
import { ChromeContext, type ChromeValue } from './chrome-context';

export function useChrome(): ChromeValue {
  const value = React.useContext(ChromeContext);
  if (!value) throw new Error('useChrome debe usarse dentro de ChromeProvider');
  return value;
}
