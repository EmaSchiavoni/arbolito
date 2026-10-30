import * as React from 'react';

interface ManualShortcutsArgs {
  onEscape: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Esc cancela el linking y Ctrl/Cmd+Z deshace. Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y
// rehacen. No interfiere con el undo/redo nativo de los inputs.
export function useManualShortcuts({ onEscape, onUndo, onRedo, canUndo, canRedo }: ManualShortcutsArgs) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onEscape();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape]);

  React.useEffect(() => {
    function onUndoKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const lower = e.key.toLowerCase();
      if (lower === 'z' && !e.shiftKey) {
        if (!canUndo) return;
        e.preventDefault();
        onUndo();
      } else if ((lower === 'z' && e.shiftKey) || lower === 'y') {
        if (!canRedo) return;
        e.preventDefault();
        onRedo();
      }
    }
    window.addEventListener('keydown', onUndoKey);
    return () => window.removeEventListener('keydown', onUndoKey);
  });
}
