import * as React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { trackLandingCta, trackOutbound } from '@/common/analytics';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { cn } from '@/common/lib/utils';
import { REPO_URL } from '@/common/repo';
import { HeroCard } from '@/landing/components/HeroCard';
import { useParallaxScene } from '@/landing/hooks';
import { AvlArt, BTreeArt, FlowRibbon, GithubMark } from '@/landing/TreeArt';

const LETTERS = [
  { char: 'a', weight: 200 },
  { char: 'r', weight: 350 },
  { char: 'b', weight: 600 },
  { char: 'o', weight: 850 },
  { char: 'l', weight: 250 },
  { char: 'i', weight: 650 },
  { char: 't', weight: 200 },
  { char: 'o', weight: 900 },
];

export function HeroSection() {
  const sceneRef = useParallaxScene<HTMLElement>();

  return (
    <section
      ref={sceneRef}
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-3 pt-24 sm:px-4 sm:pt-28"
    >
      <div className="hero-scene pointer-events-none absolute inset-0">
        <FlowRibbon className="parallax-y absolute inset-x-0 top-[16%] h-[68%] w-full opacity-70" />
        <HeroCard
          label="B-tree"
          badge="p = 4"
          art={<BTreeArt className="h-[150px] w-[240px]" />}
          className="left-[3%] top-[15%] xl:left-[5%]"
          depthX={24}
          depthY={16}
          floatDelay={-2}
        />
        <HeroCard
          label="AVL"
          badge="[auto-balanceado]"
          art={<AvlArt className="h-[160px] w-[250px]" />}
          className="right-[3%] top-[11%] xl:right-[5%]"
          depthX={-28}
          depthY={18}
          floatDelay={-5}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="hero-stagger relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center pb-12 text-center">
        <h1
          aria-label="arbolito, visualizador y playground para practicar y visualizar árboles B y AVL"
          className="font-display text-[clamp(3.35rem,15.5vw,13rem)] font-black leading-[0.78] tracking-[-0.09em]"
        >
          <span aria-hidden="true" className="inline-flex items-baseline">
            {LETTERS.map((letter, index) => (
              <span
                key={`${letter.char}-${index}`}
                className="hero-letter"
                style={
                  {
                    '--weight': letter.weight,
                    animationDelay: `${90 + index * 65}ms`,
                  } as React.CSSProperties
                }
              >
                {letter.char}
              </span>
            ))}
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg">
          Simulador y visualizador interactivo para practicar y visualizar árboles B y AVL. Las operaciones de inserción,
          eliminación y búsqueda se ejecutan paso a paso, y las estructuras armadas manualmente pueden validarse contra
          las reglas.
        </p>

        <div className="mt-7 flex w-full flex-col items-center justify-center gap-2 sm:mt-9 sm:w-auto sm:flex-row">
          <a
            href="#playgrounds"
            onClick={() => trackLandingCta('playgrounds', 'hero')}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full px-6 sm:w-auto')}
          >
            Ver playgrounds
            <ArrowRight />
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackOutbound('github', 'hero')}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full px-6 sm:w-auto')}
          >
            <GithubMark className="size-4" />
            Ver repositorio
            <ArrowUpRight />
          </a>
        </div>

        <div className="landing-card mt-8 grid w-full max-w-2xl grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border/80 bg-background/60 backdrop-blur sm:mt-11">
          {['SIN COSTO', 'SIN REGISTRO', 'CÓDIGO ABIERTO'].map((item) => (
            <div
              key={item}
              className="flex min-h-[70px] items-center justify-center px-3 py-4 text-center sm:px-6 sm:py-5"
            >
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] sm:text-sm">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 hidden flex-col items-center gap-2 sm:flex">
          <span className="font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">scroll</span>
          <span className="scroll-line h-10 w-px" />
        </div>

        <div className="mt-8 w-full max-w-sm lg:hidden">
          <div className="landing-card rounded-2xl border border-border/80 bg-background/70 p-3 text-left shadow-lg backdrop-blur is-visible">
            <div className="mb-2 flex items-center justify-between font-display text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              <span>vista rápida</span>
              <span>AVL</span>
            </div>
            <AvlArt className="h-40 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
