import { Check, PencilRuler, Sparkles, Zap } from 'lucide-react';
import { PLAYGROUNDS } from '@/app/registry';
import { MODES } from '@/common/playground';
import { Reveal } from '@/landing/components/Reveal';
import { useSectionParallax } from '@/landing/hooks';
import { NaryArt } from '@/landing/art/NaryArt';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Operaciones automáticas',
    text: 'La inserción, la eliminación y la búsqueda se resuelven paso a paso. Se pueden visualizar divisiones, préstamos, fusiones y rotaciones.',
  },
  {
    icon: PencilRuler,
    title: 'Editor manual',
    text: 'Los nodos, las claves y los punteros se editan directamente y se visualizan en el canvas. La validación comprueba orden, duplicados, alturas y factores de balance.',
  },
  {
    icon: Zap,
    title: 'Ejecución local',
    text: 'La aplicación no requiere backend ni cuentas. Los árboles se guardan en el navegador y no se envían a ningún servidor; solo se registran métricas de uso anónimas, sin cookies.',
  },
];

export function AboutSection() {
  const sectionRef = useSectionParallax<HTMLElement>();

  return (
    <section id="proyecto" ref={sectionRef} className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-[1.06fr_0.94fr]">
        <Reveal>
          <h2 className="max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.05em] sm:text-6xl">
            <span className="font-thin">Visualizador interactivo</span>
            <br />
            <span className="font-black">de árboles B y AVL.</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Arbolito es un visualizador y playground de estructuras de datos orientado a practicar, visualizar y resolver
            ejercicios con árboles B y AVL. Las operaciones se ejecutan paso a paso y el estado de cada estructura se
            conserva en el navegador. El editor manual permite construir nodos y punteros, y la validación comprueba las
            reglas de cada tipo de árbol.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Código abierto', 'Ejecución local', 'Sin registro'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-none border border-border/80 bg-background/60 px-3 py-1 font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
              >
                <Check className="size-3" />
                {item}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140} className="relative">
          <div className="parallax-y">
            <div className="landing-card relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/55 p-5 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.65)] backdrop-blur-sm">
              <div className="absolute inset-0 bg-canvas-grid opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-transparent to-background/80" />
              <div className="relative flex items-center justify-end font-display text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                <span>n-ario</span>
              </div>
              <NaryArt className="relative mt-4 h-64 w-full sm:h-72" />
              <div className="relative mt-3 grid grid-cols-2 gap-2">
                <div className="landing-card rounded-xl border border-border/70 bg-background/60 px-3 py-2">
                  <p className="font-display text-[8px] uppercase tracking-[0.2em] text-muted-foreground">playgrounds</p>
                  <p className="mt-1 text-sm font-medium">{PLAYGROUNDS.length} disponibles</p>
                </div>
                <div className="landing-card rounded-xl border border-border/70 bg-background/60 px-3 py-2">
                  <p className="font-display text-[8px] uppercase tracking-[0.2em] text-muted-foreground">modos</p>
                  <p className="mt-1 text-sm font-medium">{MODES.length} por playground</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-3 sm:mt-16 sm:grid-cols-3">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Reveal key={feature.title} delay={index * 90}>
              <div className="landing-card group relative h-full rounded-2xl border border-border/80 bg-card/45 p-5 backdrop-blur-sm transition-colors hover:bg-card/80">
                <div className="pointer-events-none absolute right-[10px] top-[10px] flex size-10 items-center justify-center rounded-xl border-0 bg-transparent transition-transform group-hover:-translate-y-0.5">
                  <Icon className="size-4 [stroke-width:0.33px] [transform:scale(4)]" />
                </div>
                <h3 className="mt-5 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
