import * as React from 'react';

const HISTORY_LIMIT = 6;

// Pila de deshacer/rehacer para editores manuales. Cada snapshot se guarda
// clonado y el tope descarta el más viejo (FIFO). Vive solo en memoria.
export function useHistory<T>(limit = HISTORY_LIMIT) {
  const [undoStack, setUndoStack] = React.useState<T[]>([]);
  const [redoStack, setRedoStack] = React.useState<T[]>([]);

  function push(snapshot: T) {
    setUndoStack((s) => [...s, structuredClone(snapshot)].slice(-limit));
    setRedoStack([]);
  }

  function undo(current: T): T | null {
    if (undoStack.length === 0) return null;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, structuredClone(current)]);
    return structuredClone(prev);
  }

  function redo(current: T): T | null {
    if (redoStack.length === 0) return null;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, structuredClone(current)].slice(-limit));
    return structuredClone(next);
  }

  return {
    undoStack,
    redoStack,
    push,
    undo,
    redo,
    clearRedo: () => setRedoStack([]),
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
