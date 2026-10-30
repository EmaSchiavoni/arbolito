import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import { setNavSource } from '@/common/analytics';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { cn } from '@/common/lib/utils';
import type { Mode } from '@/common/playground';
import { MODES } from '@/common/playground';
import { PlaygroundPreview } from '@/landing/components/PlaygroundPreview';
import { PlaygroundSelect } from '@/landing/components/PlaygroundSelect';
import { Reveal } from '@/landing/components/Reveal';

export function PlaygroundsSection() {
  const [selectedId, setSelectedId] = React.useState(PLAYGROUNDS[0].id);
  const selected = getPlayground(selectedId) ?? PLAYGROUNDS[0];

  return (
    <section id="playgrounds" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:py-28">
      <Reveal>
        <h2 className="max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.05em] sm:text-6xl">
          Playgrounds disponibles
          <br />
          <span className="font-thin">para practicar y visualizar árboles.</span>
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
        <Reveal className="space-y-4">
          <PlaygroundSelect value={selected.id} onChange={setSelectedId} />

          <div className="landing-card rounded-3xl border border-border/80 bg-card/55 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {selected.short} · playground
              </span>
              <span className="font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {MODES.length} modos
              </span>
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">{selected.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.description}</p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {MODES.map((mode: Mode) => {
                const definition = selected.modes[mode];
                const Icon = definition.icon;
                return (
                  <Link
                    key={mode}
                    to={`/${selected.id}/${mode}`}
                    onClick={() => setNavSource('landing')}
                    className={cn(
                      buttonVariants({ variant: mode === 'auto' ? 'default' : 'outline', size: 'lg' }),
                      'justify-between px-4',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {definition.label}
                    </span>
                    <ArrowUpRight className="size-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={140} className="relative">
          <div className="landing-card relative h-full overflow-hidden rounded-[2rem] border border-border/80 bg-card/40 p-5 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.65)] backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.025] to-transparent" />
            <div className="relative h-full">
              <PlaygroundPreview key={selected.id} playground={selected} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
