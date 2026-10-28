import { cn } from '../common/lib/utils';

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function FlowRibbon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 720"
      preserveAspectRatio="none"
      className={cn('overflow-visible text-zinc-400 dark:text-zinc-600', className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M-40 520 C 250 400 330 700 610 548 S 980 250 1240 350"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.5"
        className="flow-line"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M-40 170 C 250 60 430 320 680 220 S 1030 45 1240 150"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
        className="flow-line"
        vectorEffect="non-scaling-stroke"
      />
      <circle className="motion-dot" r="3.5" fill="currentColor" opacity="0.8">
        <animateMotion dur="14s" repeatCount="indefinite" path="M-40 520 C 250 400 330 700 610 548 S 980 250 1240 350" />
      </circle>
      <circle className="motion-dot" r="2.5" fill="currentColor" opacity="0.6">
        <animateMotion dur="19s" repeatCount="indefinite" path="M-40 170 C 250 60 430 320 680 220 S 1030 45 1240 150" />
      </circle>
    </svg>
  );
}

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
