import { cn } from '@/common/lib/utils';

export function RotationArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 224" className={cn('overflow-visible', className)} fill="none" aria-hidden="true">
      <text x="16" y="18" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        rotación
      </text>
      <text x="324" y="18" textAnchor="end" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        simple
      </text>

      <path
        d="M70 70 L42 120"
        stroke="currentColor"
        strokeWidth={1.25}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '120ms' }}
      />
      <path
        d="M70 70 L98 120"
        stroke="currentColor"
        strokeWidth={1.25}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '180ms' }}
      />

      <path
        d="M258 70 L230 120"
        stroke="currentColor"
        strokeWidth={1.25}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '220ms' }}
      />
      <path
        d="M258 70 L286 120"
        stroke="currentColor"
        strokeWidth={1.25}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '280ms' }}
      />

      <path
        d="M124 74 C158 34 188 34 220 74"
        stroke="currentColor"
        strokeWidth={1.4}
        className="flow-line text-zinc-500 dark:text-zinc-400"
      />
      <path d="M214 68 L224 76 L218 64 Z" fill="currentColor" className="text-zinc-500 dark:text-zinc-400" />
      <circle r="2.3" fill="currentColor" className="motion-dot text-zinc-600 dark:text-zinc-300">
        <animateMotion dur="3.2s" repeatCount="indefinite" path="M124 74 C158 34 188 34 220 74" />
      </circle>

      <g className="orbit-slow">
        <circle
          cx="258"
          cy="70"
          r="27"
          stroke="currentColor"
          strokeWidth={0.85}
          strokeDasharray="3 5"
          className="text-zinc-400 dark:text-zinc-600"
        />
      </g>

      {(
        [
          [70, 54, 10, 260, false],
          [42, 136, 5, 430, false],
          [98, 136, 15, 500, false],
          [258, 54, 15, 340, true],
          [230, 136, 10, 560, false],
          [286, 136, 20, 630, false],
        ] satisfies Array<[number, number, number, number, boolean]>
      ).map(([x, y, value, delay, accent]) => (
        <g
          key={`${x}-${y}`}
          className={cn('tree-node', accent ? 'text-zinc-50 dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-50')}
          style={{ animationDelay: `${delay}ms` }}
        >
          <circle
            cx={x}
            cy={y}
            r={15}
            className={accent ? 'fill-foreground' : 'fill-background'}
            stroke="currentColor"
            strokeWidth={1.4}
          />
          <text x={x} y={y + 3.5} textAnchor="middle" fill="currentColor" className="font-display text-[9px] font-semibold">
            {value}
          </text>
        </g>
      ))}

      <text x="70" y="190" textAnchor="middle" fill="currentColor" className="text-zinc-400 text-[8px] uppercase tracking-[0.18em] dark:text-zinc-600 font-display">
        antes
      </text>
      <text x="258" y="190" textAnchor="middle" fill="currentColor" className="text-zinc-400 text-[8px] uppercase tracking-[0.18em] dark:text-zinc-600 font-display">
        después
      </text>
    </svg>
  );
}
