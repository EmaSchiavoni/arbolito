import * as React from 'react';
import { cn } from '@/common/lib/utils';

export function HeroCard({
  label,
  badge,
  art,
  className,
  depthX,
  depthY,
  floatDelay,
}: {
  label: string;
  badge: string;
  art: React.ReactNode;
  className?: string;
  depthX: number;
  depthY: number;
  floatDelay: number;
}) {
  return (
    <div
      className={cn('hero-card absolute hidden lg:block', className)}
      style={
        {
          '--dx': `${depthX}px`,
          '--dy': `${depthY}px`,
        } as React.CSSProperties
      }
    >
      <div className="hero-float" style={{ animationDelay: `${floatDelay}s` }}>
        <div className="landing-card rounded-2xl border border-border/80 bg-background/75 p-3 shadow-[0_30px_90px_-48px_rgba(0,0,0,0.65)] backdrop-blur-md dark:bg-background/65">
          <div className="mb-2 flex items-center justify-between gap-4 font-display text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
            <span>{label}</span>
            <span>{badge}</span>
          </div>
          <div className="is-visible">{art}</div>
        </div>
      </div>
    </div>
  );
}
