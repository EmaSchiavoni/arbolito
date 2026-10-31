import * as React from 'react';
import { Toolbar } from '@/common/components/ui/toolbar';
import { cn } from '@/common/lib/utils';

export function BottomToolbar({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Publica cuánto espacio ocupa la barra desde el borde inferior, incluida la
  // separación para otros flotantes (el botón de "Centrar el árbol"), para que
  // queden justo encima aun cuando la barra envuelve en varias filas o cambia
  // su separación en mobile.
  React.useLayoutEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el) return;
    const gap = 16;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - el.getBoundingClientRect().top) + gap;
      root.style.setProperty('--bottom-toolbar-offset', `${offset}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty('--bottom-toolbar-offset');
    };
  }, []);

  return (
    <Toolbar
      ref={ref}
      orientation="horizontal"
      aria-label={label}
      className={cn(
        'fixed bottom-3 left-1/2 z-40 w-max max-w-[calc(100vw-1rem)] -translate-x-1/2',
        'mb-[env(safe-area-inset-bottom)] flex flex-wrap items-center justify-center gap-2',
        'rounded-full border bg-card/95 px-2 py-2 shadow-lg backdrop-blur',
        'max-[665px]:bottom-0 max-[665px]:left-0 max-[665px]:right-0 max-[665px]:mb-0 max-[665px]:w-full max-[665px]:max-w-none max-[665px]:translate-x-0',
        'max-[665px]:rounded-none max-[665px]:border-x-0 max-[665px]:border-b-0 max-[665px]:px-3 max-[665px]:pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {children}
    </Toolbar>
  );
}
