import * as React from 'react';
import { loadView, save } from '@/common/storage/storage';

export interface CanvasView {
  x: number;
  y: number;
  k: number;
  w: number;
  h: number;
}

// Restaura la vista del canvas y la guarda con debounce. Devuelve el ref con
// la última vista para que el consumidor pueda consultar zoom/tamaño.
export function useViewPersistence(storageKey: string, fallback: { x: number; y: number; k: number } | null = null) {
  const [initialView] = React.useState(() => loadView(storageKey) ?? fallback);
  const viewRef = React.useRef<CanvasView>({ x: 16, y: 16, k: 1, w: 0, h: 0 });
  const timerRef = React.useRef<number | null>(null);

  const handleViewChange = React.useCallback(
    (view: CanvasView) => {
      viewRef.current = view;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        save(storageKey, { x: view.x, y: view.y, k: view.k });
      }, 400);
    },
    [storageKey],
  );

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        const view = viewRef.current;
        save(storageKey, { x: view.x, y: view.y, k: view.k });
      }
    },
    [storageKey],
  );

  return { initialView, viewRef, handleViewChange };
}
