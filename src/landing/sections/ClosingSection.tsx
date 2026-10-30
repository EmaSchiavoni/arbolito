import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { setNavSource, trackLandingCta } from '@/common/analytics';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { cn } from '@/common/lib/utils';
import type { PlaygroundDefinition } from '@/common/playground';
import { Reveal } from '@/landing/components/Reveal';
import { AvlArt } from '@/landing/art/AvlArt';
import { RotationArt } from '@/landing/art/RotationArt';

export function ClosingSection({ last }: { last: PlaygroundDefinition }) {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:pb-32">
      <Reveal>
        <div className="landing-card relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-card/50 px-5 py-16 text-center backdrop-blur-sm sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-canvas-grid opacity-50" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 hidden w-[380px] opacity-[0.07] sm:block">
            <RotationArt className="w-full" />
          </div>
          <div className="pointer-events-none absolute -left-20 -top-24 hidden w-[320px] opacity-[0.06] lg:block">
            <AvlArt className="w-full" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <h2 className="max-w-4xl font-display text-5xl leading-[0.98] tracking-[-0.06em] sm:text-7xl">
              <span className="font-thin">Acceso directo</span>
              <br />
              <span className="font-black">a los playgrounds.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Las estructuras pueden construirse manualmente, validarse y compararse con el resultado del algoritmo
              automático.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link
                to={`/${last.id}/auto`}
                onClick={() => setNavSource('landing')}
                className={cn(buttonVariants({ size: 'lg' }), 'w-full px-6 sm:w-auto')}
              >
                Abrir {last.title}
                <ArrowRight />
              </Link>

              <a
                href="#playgrounds"
                onClick={() => trackLandingCta('playgrounds', 'closing')}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full px-6 sm:w-auto')}
              >
                Ver todos los playgrounds
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
