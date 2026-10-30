import * as React from 'react';
import { cn } from '@/common/lib/utils';
import { Reveal } from './Reveal';

export function TiltCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    event.currentTarget.style.setProperty('--tx', x.toFixed(3));
    event.currentTarget.style.setProperty('--ty', y.toFixed(3));
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--tx', '0');
    event.currentTarget.style.setProperty('--ty', '0');
  };

  return (
    <div className={cn('tilt-card', className)} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <Reveal delay={delay} className="h-full">
        {children}
      </Reveal>
    </div>
  );
}
