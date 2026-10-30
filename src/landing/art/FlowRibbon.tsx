import { cn } from '@/common/lib/utils';

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
