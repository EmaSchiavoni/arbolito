import * as React from 'react';

export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = React.useRef<T | null>(null);
  const [visible, setVisible] = React.useState(() => typeof IntersectionObserver === 'undefined');

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function useParallaxScene<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      node.style.setProperty('--mx', '0');
      node.style.setProperty('--my', '0');
      node.style.setProperty('--p', '0px');
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let pointerRaf = 0;
    let scrollRaf = 0;

    const renderPointer = () => {
      pointerRaf = 0;
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      if (Math.abs(targetX - x) < 0.001) x = targetX;
      if (Math.abs(targetY - y) < 0.001) y = targetY;
      node.style.setProperty('--mx', x.toFixed(4));
      node.style.setProperty('--my', y.toFixed(4));
      if (Math.abs(targetX - x) > 0.001 || Math.abs(targetY - y) > 0.001) {
        pointerRaf = window.requestAnimationFrame(renderPointer);
      }
    };

    const startPointer = () => {
      if (!pointerRaf) pointerRaf = window.requestAnimationFrame(renderPointer);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;
      startPointer();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      startPointer();
    };

    const renderScroll = () => {
      scrollRaf = 0;
      const offset = -window.scrollY;
      node.style.setProperty('--p', `${(offset * 0.07).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (!scrollRaf) scrollRaf = window.requestAnimationFrame(renderScroll);
    };

    renderScroll();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.cancelAnimationFrame(pointerRaf);
      window.cancelAnimationFrame(scrollRaf);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return ref;
}

export function useSectionParallax<T extends HTMLElement>(strength = 1) {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const progress = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
      const clamped = Math.max(-1, Math.min(1, progress));
      node.style.setProperty('--p', `${(clamped * 70 * strength).toFixed(2)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [strength]);

  return ref;
}
