import * as React from 'react';

// El aviso minimizado flota debajo del header. Su alto cambia con el ancho
// (la fila de configuración se envuelve) y desaparece en modo inmersivo, así
// que se mide y se publica en una variable CSS para no tapar nada.
export function useHeaderHeight(hidden: boolean) {
  const headerRef = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const header = headerRef.current;
    if (!header) {
      root.style.setProperty('--chrome-top', '4.5rem');
      return () => root.style.removeProperty('--chrome-top');
    }
    const update = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      root.style.setProperty('--chrome-top', `${height + 12}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--chrome-top');
    };
  }, [hidden]);

  return headerRef;
}
