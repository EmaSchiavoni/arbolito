import type { RefObject } from 'react';

interface CanvasZoomIndicatorProps {
  percent: number;
  draft: string | null;
  flash: boolean;
  cancelBlurRef: RefObject<boolean>;
  onDraftChange: (value: string) => void;
  onCommit: (raw: string) => void;
}

export function CanvasZoomIndicator({
  percent,
  draft,
  flash,
  cancelBlurRef,
  onDraftChange,
  onCommit,
}: CanvasZoomIndicatorProps) {
  return (
    <>
      <span
        title="Zoom actual en % (Enter para aplicar, Esc para cancelar)"
        className="absolute bottom-2 right-2 z-10 hidden items-center gap-0.5 rounded-full border bg-card/95 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur sm:flex"
      >
        <input
          value={draft ?? String(percent)}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              cancelBlurRef.current = true;
              (e.target as HTMLInputElement).blur();
            }
          }}
          inputMode="numeric"
          aria-label="Nivel de zoom en porcentaje"
          className="w-9 select-text bg-transparent text-center tabular-nums focus:outline-none"
        />
        <span>%</span>
      </span>
      {flash && (
        <div className="fixed right-3 top-[60px] z-40 rounded-full border bg-card/95 px-2.5 py-1 text-xs tabular-nums text-muted-foreground shadow-lg backdrop-blur sm:hidden">
          {percent} %
        </div>
      )}
    </>
  );
}
