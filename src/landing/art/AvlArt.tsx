import { cn } from '@/common/lib/utils';

interface AvlNodeProps {
  x: number;
  y: number;
  value: number;
  delay: number;
  accent?: boolean;
}

function AvlNode({ x, y, value, delay, accent }: AvlNodeProps) {
  return (
    <g
      className={cn('tree-node', accent ? 'text-zinc-50 dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-50')}
      style={{ animationDelay: `${delay}ms` }}
    >
      <circle
        cx={x}
        cy={y}
        r={16}
        className={accent ? 'fill-foreground' : 'fill-background'}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <text x={x} y={y + 3.5} textAnchor="middle" fill="currentColor" className="font-display text-[10px] font-semibold">
        {value}
      </text>
    </g>
  );
}

export function AvlArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 224" className={cn('overflow-visible', className)} fill="none" aria-hidden="true">
      <text x="16" y="18" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        AVL
      </text>
      <text x="304" y="18" textAnchor="end" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        h = 3
      </text>

      {[
        ['M160 60 L78 84', '100ms'],
        ['M160 60 L242 84', '150ms'],
        ['M78 120 L34 154', '220ms'],
        ['M78 120 L122 154', '270ms'],
        ['M242 120 L198 154', '320ms'],
        ['M242 120 L286 154', '370ms'],
      ].map(([path, delay]) => (
        <path
          key={path}
          d={path}
          stroke="currentColor"
          strokeWidth={1.35}
          pathLength={1}
          className="tree-edge text-zinc-400 dark:text-zinc-600"
          style={{ animationDelay: delay }}
        />
      ))}

      <path
        d="M160 62 C202 76 242 88 242 106 C242 128 220 142 202 152"
        stroke="currentColor"
        strokeWidth={1.3}
        className="flow-line text-zinc-500 dark:text-zinc-400"
      />
      <path d="M200 146 L204 156 L209 148 Z" fill="currentColor" className="text-zinc-500 dark:text-zinc-400" />
      <circle r="2.2" fill="currentColor" className="motion-dot text-zinc-600 dark:text-zinc-300">
        <animateMotion
          dur="4.1s"
          repeatCount="indefinite"
          path="M160 62 C202 76 242 88 242 106 C242 128 220 142 202 152"
        />
      </circle>

      <g className="orbit-slow">
        <circle
          cx="286"
          cy="178"
          r="25"
          stroke="currentColor"
          strokeWidth={0.9}
          strokeDasharray="3 5"
          className="text-zinc-400 dark:text-zinc-600"
        />
        <circle cx="286" cy="153" r="2.4" fill="currentColor" className="text-zinc-700 dark:text-zinc-300" />
      </g>

      <AvlNode x={160} y={44} value={8} delay={250} accent />
      <AvlNode x={78} y={102} value={4} delay={420} />
      <AvlNode x={242} y={102} value={12} delay={480} />
      <AvlNode x={34} y={172} value={2} delay={620} />
      <AvlNode x={122} y={172} value={6} delay={680} />
      <AvlNode x={198} y={172} value={10} delay={740} />
      <AvlNode x={286} y={172} value={14} delay={800} />

      <text
        x="160"
        y="212"
        textAnchor="middle"
        fill="currentColor"
        className="text-zinc-400 text-[8px] uppercase tracking-[0.22em] dark:text-zinc-600 font-display"
      >
        factor de balance -1 · 0 · 1
      </text>
    </svg>
  );
}
