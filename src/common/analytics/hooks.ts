import * as React from 'react';
import type { Mode } from '../playground';
import { track, trackOnce, type AnalyticsData } from './core';

// La primera interacción real marca la sesión como "enganchada". Sirve para
// separar personas de bots/prefetch: Googlebot ejecuta JS y dispara pageviews,
// pero no toca la pantalla.
let engaged = false;

export function useSessionEngaged(): void {
  React.useEffect(() => {
    if (engaged) return;
    const types = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    const send: EventListener = () => {
      if (engaged) return;
      engaged = true;
      for (const type of types) window.removeEventListener(type, send);
      trackOnce('session-engaged', 'session_engaged', {
        path: window.location.pathname,
        ms: Math.round(performance.now()),
        viewport: window.innerWidth < 640 ? 'mobile' : 'desktop',
      });
    };
    for (const type of types) window.addEventListener(type, send, { passive: true });
    return () => {
      for (const type of types) window.removeEventListener(type, send);
    };
  }, []);
}

/** Devuelve un emisor de `tool_use` ya contextualizado. */
export function useToolTracker(playground: string, mode: Mode) {
  return React.useCallback(
    (tool: string, data?: AnalyticsData) => {
      track('tool_use', { playground, mode, tool, ...data });
    },
    [playground, mode],
  );
}
