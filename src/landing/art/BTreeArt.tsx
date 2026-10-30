import { cn } from '@/common/lib/utils';

interface BTreeNodeProps {
  x: number;
  y: number;
  keys: Array<number | string>;
  width?: number;
  height?: number;
  delay?: number;
  highlight?: number;
}

function BTreeNode({ x, y, keys, width = 80, height = 30, delay = 0, highlight }: BTreeNodeProps) {
  const cellWidth = width / keys.length;
  return (
    <g className="tree-node text-zinc-900 dark:text-zinc-50" style={{ animationDelay: `${delay}ms` }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={7}
        className="fill-background"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {highlight !== undefined && (
        <rect
          x={x + cellWidth * highlight + 2}
          y={y + 3}
          width={cellWidth - 4}
          height={height - 6}
          rx={4}
          fill="currentColor"
          fillOpacity={0.08}
          className="soft-pulse"
        />
      )}
      {keys.map((key, index) => (
        <g key={`${key}-${index}`}>
          {index > 0 && (
            <line
              x1={x + cellWidth * index}
              y1={y}
              x2={x + cellWidth * index}
              y2={y + height}
              className="stroke-border"
              strokeWidth={1}
            />
          )}
          <text
            x={x + cellWidth * (index + 0.5)}
            y={y + height / 2 + 3.5}
            textAnchor="middle"
            fill="currentColor"
            className="font-display text-[10px] font-semibold"
          >
            {key}
          </text>
        </g>
      ))}
    </g>
  );
}

export function BTreeArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 214" className={cn('overflow-visible', className)} fill="none" aria-hidden="true">
      <text x="18" y="20" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        p = 3
      </text>
      <text x="330" y="20" textAnchor="end" fill="currentColor" className="text-zinc-400 text-[8px] dark:text-zinc-600 font-display">
        h = 2
      </text>

      <path
        d="M134 60 L58 104"
        stroke="currentColor"
        strokeWidth={1.35}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '120ms' }}
      />
      <path
        d="M180 60 L180 104"
        stroke="currentColor"
        strokeWidth={1.35}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '180ms' }}
      />
      <path
        d="M226 60 L302 104"
        stroke="currentColor"
        strokeWidth={1.35}
        pathLength={1}
        className="tree-edge text-zinc-400 dark:text-zinc-600"
        style={{ animationDelay: '240ms' }}
      />

      <path
        d="M180 62 C180 78 180 88 180 100"
        stroke="currentColor"
        strokeWidth={1.4}
        className="flow-line text-zinc-500 dark:text-zinc-400"
      />
      <path d="M176 99 L180 108 L184 99 Z" fill="currentColor" className="text-zinc-500 dark:text-zinc-400" />
      <circle r="2.2" fill="currentColor" className="motion-dot text-zinc-600 dark:text-zinc-300">
        <animateMotion dur="3.4s" repeatCount="indefinite" path="M180 62 C180 78 180 88 180 104" />
      </circle>

      <BTreeNode x={132} y={28} keys={[14, 29]} width={96} height={32} delay={220} />
      <BTreeNode x={18} y={108} keys={[3, 7]} delay={420} />
      <BTreeNode x={140} y={108} keys={[18, 22]} delay={500} highlight={1} />
      <BTreeNode x={262} y={108} keys={[33, 40]} delay={580} />

      <line
        x1="18"
        y1="188"
        x2="342"
        y2="188"
        stroke="currentColor"
        strokeWidth={0.75}
        strokeDasharray="3 5"
        className="text-zinc-300 dark:text-zinc-800"
      />
    </svg>
  );
}
