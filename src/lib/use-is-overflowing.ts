import * as React from 'react';

// Detecta si el contenido de un elemento desborda horizontalmente. Observa
// cambios de tamaño y de contenido, y expone un ref callback para montarlo.
export function useIsOverflowing<T extends HTMLElement = HTMLDivElement>() {
  const [element, setElement] = React.useState<T | null>(null);
  const [overflowing, setOverflowing] = React.useState(false);

  React.useEffect(() => {
    if (!element) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setOverflowing(element.scrollWidth > element.clientWidth + 1);
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(check);
    };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    resize.observe(element);
    mutations.observe(element, { childList: true, characterData: true, subtree: true });
    schedule();
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [element]);

  return { ref: setElement, overflowing };
}
