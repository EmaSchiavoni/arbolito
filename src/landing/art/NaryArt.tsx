import { cn } from '@/common/lib/utils';

export function NaryArt({ className }: { className?: string }) {
  const levelOne = [32, 96, 160, 224, 288];
  return (
    <svg viewBox="0 0 320 196" className={cn('overflow-visible', className)} fill="none" aria-hidden="true">
      <text x="16" y="18" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        n-ario
      </text>
      <text x="304" y="18" textAnchor="end" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        5 ramas
      </text>

      {levelOne.map((x, index) => (
        <path
          key={`root-${x}`}
          d={`M160 56 L${x} 92`}
          stroke="currentColor"
          strokeWidth={1.2}
          pathLength={1}
          className="tree-edge text-zinc-300 dark:text-zinc-700"
          style={{ animationDelay: `${100 + index * 60}ms` }}
        />
      ))}

      {levelOne.map((x, index) =>
        [x - 16, x + 16].map((leaf, leafIndex) => (
          <path
            key={`leaf-${x}-${leaf}`}
            d={`M${x} 120 L${leaf} 162`}
            stroke="currentColor"
            strokeWidth={1}
            pathLength={1}
            className="tree-edge text-zinc-300 dark:text-zinc-700"
            style={{ animationDelay: `${360 + index * 45 + leafIndex * 25}ms` }}
          />
        )),
      )}

      <path
        d="M160 58 L160 104 L176 160"
        stroke="currentColor"
        strokeWidth={1.35}
        className="flow-line text-zinc-500 dark:text-zinc-400"
      />
      <circle r="2" fill="currentColor" className="motion-dot text-zinc-600 dark:text-zinc-300">
        <animateMotion dur="4.8s" repeatCount="indefinite" path="M160 58 L160 104 L176 160" />
      </circle>

      <g className="orbit-slow">
        <circle
          cx="160"
          cy="34"
          r="26"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeDasharray="2 6"
          className="text-zinc-400 dark:text-zinc-600"
        />
      </g>

      <g className="tree-node text-zinc-50 dark:text-zinc-900" style={{ animationDelay: '220ms' }}>
        <circle cx="160" cy="34" r="20" className="fill-foreground" />
        <text x="160" y="38" textAnchor="middle" fill="currentColor" className="font-display text-[11px] font-bold">
          n
        </text>
      </g>

      {levelOne.map((x, index) => (
        <g
          key={`node-${x}`}
          className="tree-node text-zinc-900 dark:text-zinc-50"
          style={{ animationDelay: `${420 + index * 65}ms` }}
        >
          <circle cx={x} cy="106" r="10" className="fill-background" stroke="currentColor" strokeWidth={1.4} />
        </g>
      ))}

      {levelOne.map((x, index) =>
        [x - 16, x + 16].map((leaf, leafIndex) => (
          <g
            key={`leaf-node-${x}-${leaf}`}
            className="tree-node text-zinc-900 dark:text-zinc-50"
            style={{ animationDelay: `${660 + index * 40 + leafIndex * 30}ms` }}
          >
            <circle cx={leaf} cy={176} r={6.5} className="fill-background" stroke="currentColor" strokeWidth={1.2} />
          </g>
        )),
      )}
    </svg>
  );
}
