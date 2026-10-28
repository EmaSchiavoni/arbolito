import * as React from 'react';
import { useChrome } from '../app/use-chrome';

interface PaintedCell {
  alpha: number;
  shade: number;
  start: number;
}

interface Blob {
  kind: 'mask' | 'tint';
  left: string;
  top: string;
  width: string;
  height: string;
  duration: string;
  delay: string;
  opacity: number;
  dx: string;
  dy: string;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createBlobs(): Blob[] {
  return Array.from({ length: 7 }, (_, index) => ({
    kind: index % 3 === 0 ? 'tint' : 'mask',
    left: `${randomBetween(-10, 90).toFixed(1)}%`,
    top: `${randomBetween(-15, 90).toFixed(1)}%`,
    width: `${randomBetween(36, 78).toFixed(1)}vmax`,
    height: `${randomBetween(30, 62).toFixed(1)}vmax`,
    duration: `${randomBetween(90, 170).toFixed(0)}s`,
    delay: `${randomBetween(-160, -10).toFixed(0)}s`,
    opacity: randomBetween(0.42, 0.86),
    dx: `${randomBetween(-9, 9).toFixed(1)}vw`,
    dy: `${randomBetween(-7, 7).toFixed(1)}vh`,
  }));
}

export function InteractiveGrid() {
  const { dark } = useChrome();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const blobs = React.useMemo(() => createBlobs(), []);
  const [cell, setCell] = React.useState(() => (window.innerWidth < 640 ? 32 : 44));

  React.useEffect(() => {
    const update = () => setCell(window.innerWidth < 640 ? 32 : 44);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const cells = new Map<string, PaintedCell>();
    const hold = 260;
    const fade = 1350;
    let raf = 0;
    let lastCol = -1;
    let lastRow = -1;
    let lastMove = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let ratio = 1;

    const shadeRange = dark ? [125, 245] : [20, 110];
    const alphaRange = dark ? [0.05, 0.15] : [0.09, 0.24];

    const resize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, viewportWidth > 2000 ? 1 : 2);
      canvas.width = Math.floor(viewportWidth * ratio);
      canvas.height = Math.floor(viewportHeight * ratio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cells.clear();
      lastCol = -1;
      lastRow = -1;
      paintFrame();
    };

    const paintFrame = () => {
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      const now = performance.now();
      for (const [key, value] of cells) {
        const elapsed = now - value.start;
        let alpha = value.alpha;
        if (elapsed > hold) {
          alpha = value.alpha * (1 - (elapsed - hold) / fade);
        }
        if (alpha <= 0.004) {
          cells.delete(key);
          continue;
        }
        const [col, row] = key.split(':').map(Number);
        context.fillStyle = `rgba(${value.shade}, ${value.shade}, ${value.shade}, ${alpha.toFixed(3)})`;
        context.fillRect(col * cell, row * cell, cell, cell);
      }
    };

    const tick = () => {
      raf = 0;
      paintFrame();
      if (cells.size > 0) raf = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const paint = (col: number, row: number) => {
      if (col < 0 || row < 0) return;
      const shade = Math.round(randomBetween(shadeRange[0], shadeRange[1]));
      const alpha = randomBetween(alphaRange[0], alphaRange[1]);
      cells.set(`${col}:${row}`, { alpha, shade, start: performance.now() });
    };

    const onPointerMove = (event: PointerEvent) => {
      const now = performance.now();
      const col = Math.floor(event.clientX / cell);
      const row = Math.floor(event.clientY / cell);

      if (now - lastMove > 140 || lastCol < 0) {
        paint(col, row);
        lastCol = col;
        lastRow = row;
        lastMove = now;
        start();
        return;
      }

      if (col === lastCol && row === lastRow) return;

      const steps = Math.max(Math.abs(col - lastCol), Math.abs(row - lastRow));
      for (let step = 1; step <= steps; step += 1) {
        const nextCol = Math.round(lastCol + ((col - lastCol) * step) / steps);
        const nextRow = Math.round(lastRow + ((row - lastRow) * step) / steps);
        paint(nextCol, nextRow);
      }
      lastCol = col;
      lastRow = row;
      lastMove = now;
      start();
    };

    const onPointerDown = (event: PointerEvent) => {
      paint(Math.floor(event.clientX / cell), Math.floor(event.clientY / cell));
      start();
    };

    const onPointerLeave = () => {
      lastCol = -1;
      lastRow = -1;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [cell, dark]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="landing-grid absolute inset-0 transition-opacity duration-500"
        style={{ backgroundSize: `${cell}px ${cell}px` }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0">
        {blobs.map((blob, index) => (
          <div
            key={index}
            className={`landing-blob ${blob.kind === 'mask' ? 'landing-blob--mask' : 'landing-blob--tint'}`}
            style={
              {
                left: blob.left,
                top: blob.top,
                width: blob.width,
                height: blob.height,
                opacity: blob.opacity,
                '--duration': blob.duration,
                '--delay': blob.delay,
                '--dx': blob.dx,
                '--dy': blob.dy,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="landing-vignette absolute inset-0" />
    </div>
  );
}
