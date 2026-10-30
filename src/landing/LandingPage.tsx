import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  PencilRuler,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import { useChrome } from '@/app/use-chrome';
import { setNavSource, trackLandingCta, trackOutbound, trackUi } from '@/common/analytics';
import { Logo } from '@/common/components/Logo';
import { ThemeToggle } from '@/common/components/ThemeToggle';
import { buttonVariants } from '@/common/components/ui/button-variants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/common/components/ui/dropdown-menu';
import { cn } from '@/common/lib/utils';
import type { Mode, PlaygroundDefinition } from '@/common/playground';
import { MODES } from '@/common/playground';
import { GLOBAL_KEYS } from '@/common/storage/keys';
import { load } from '@/common/storage/storage';
import { useParallaxScene, useReveal, useSectionParallax } from '@/landing/hooks';
import { InteractiveGrid } from '@/landing/InteractiveGrid';
import { REPO_ISSUES_URL, REPO_NAME, REPO_URL } from '@/common/repo';
import { TechIcon, type TechIconName } from '@/landing/TechIcons';
import { AvlArt, BTreeArt, FlowRibbon, GithubMark, NaryArt, RotationArt } from '@/landing/TreeArt';
import './landing.css';

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

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn('landing-reveal', visible && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function TiltCard({
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

function LandingHeader({ last }: { last: PlaygroundDefinition }) {
  const { dark, toggleTheme } = useChrome();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:px-4">
        <Link
          to="/"
          aria-label="Arbolito, inicio"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="shrink-0"
        >
          <Logo />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <a
            href="#proyecto"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Proyecto
          </a>
          <a
            href="#tipos"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Árboles
          </a>
          <a
            href="#playgrounds"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Playgrounds
          </a>
          <a
            href="#open-source"
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Open source
          </a>
          <Link
            to="/docs"
            onClick={() => trackLandingCta('docs', 'header')}
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Documentación
          </Link>
          <a
            href="https://schiavoni.dev/?utm_source=arbolito&utm_medium=header"
            target="_blank"
            rel="me noreferrer"
            onClick={() => trackOutbound('schiavoni.dev', 'header')}
            className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Autor
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle
            dark={dark}
            onToggle={() => {
              trackUi('theme', { value: dark ? 'light' : 'dark' });
              toggleTheme();
            }}
          />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Ver el repositorio en GitHub"
            onClick={() => trackOutbound('github', 'header')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'px-3')}
          >
            <GithubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link
            to={`/${last.id}/auto`}
            onClick={() => setNavSource('landing')}
            className={cn(buttonVariants({ size: 'sm' }), 'px-3')}
          >
            <span className="hidden sm:inline">Abrir</span>
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroCard({
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

function Hero() {
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

function AboutSection() {
  const sectionRef = useSectionParallax<HTMLElement>();

  const features = [
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
        {features.map((feature, index) => {
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

function GardenSection() {
  const cards = [
    {
      label: 'Árbol B',
      tag: null,
      text: 'Nodos con varias claves y punteros, divisiones al superar el orden p y todas las hojas al mismo nivel.',
      art: <BTreeArt className="h-44 w-full" />,
    },
    {
      label: 'Árbol AVL',
      tag: null,
      text: 'Árbol binario de búsqueda balanceado. Cada nodo muestra altura y factor de balance; las rotaciones restablecen el equilibrio.',
      art: <AvlArt className="h-44 w-full" />,
    },
    {
      label: 'N-ario',
      tag: 'previsto',
      text: 'Estructura con más de dos hijos por nodo. La arquitectura permite incorporarla como un nuevo playground.',
      art: <NaryArt className="h-44 w-full" />,
    },
    {
      label: 'Rotaciones',
      tag: 'concepto',
      text: 'Rotaciones simples y dobles que reordenan subárboles y restablecen el factor de balance tras una inserción o eliminación.',
      art: <RotationArt className="h-44 w-full" />,
    },
  ];

  return (
    <section id="tipos" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:py-28">
      <Reveal>
        <h2 className="max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.05em] sm:text-6xl">
          Estructuras y conceptos
          <br />
          <span className="font-thin">del playground.</span>
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <TiltCard key={card.label} delay={index * 80}>
            <div className="landing-card group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:bg-card/80">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-foreground/[0.035] to-transparent" />
              <div className="relative flex items-center justify-between gap-3 font-display text-[9px] uppercase tracking-[0.22em]">
                <span className="text-muted-foreground">{card.label}</span>
                {card.tag && <span className="text-muted-foreground">[{card.tag}]</span>}
              </div>
              <div className="relative mt-2">{card.art}</div>
              <p className="relative mt-auto pt-3 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function PlaygroundSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const selected = getPlayground(value) ?? PLAYGROUNDS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Elegir playground"
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card/75 px-4 py-3 text-left shadow-sm outline-none backdrop-blur transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-ring"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              Playground
            </span>
            <span className="block truncate text-base font-semibold">{selected.title}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[18rem]">
        <DropdownMenuLabel>Disponibles ahora · {PLAYGROUNDS.length}</DropdownMenuLabel>
        {PLAYGROUNDS.map((playground) => (
          <DropdownMenuItem
            key={playground.id}
            onSelect={() => onChange(playground.id)}
            className="items-start gap-3 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{playground.title}</span>
              <span className="block text-xs leading-relaxed text-muted-foreground">{playground.description}</span>
            </span>
            {playground.id === value && <Check className="mt-1 size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PlaygroundPreview({ playground }: { playground: PlaygroundDefinition }) {
  const isBTree = playground.id === 'btree';
  const isAvl = playground.id === 'avl';
  const meta = isBTree ? '[p configurable]' : isAvl ? '[auto-balanceado]' : '[muchas ramas]';

  return (
    <div className="flex h-full min-h-[340px] flex-col">
      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-[9px] uppercase tracking-[0.26em] text-muted-foreground">vista previa</span>
        <span
          className={cn(
            'font-display text-[8px] uppercase tracking-[0.18em] text-muted-foreground',
            isBTree && 'rounded-full border border-border/80 px-2.5 py-1',
          )}
        >
          {meta}
        </span>
      </div>
      <div className="landing-card relative mt-4 flex-1 overflow-hidden rounded-2xl border border-border/80 bg-background/60">
        <div className="absolute inset-0 bg-canvas-grid opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background/80" />
        <div className="absolute inset-0 grid place-items-center p-4">
          {isBTree ? (
            <BTreeArt className="w-full max-w-md" />
          ) : isAvl ? (
            <AvlArt className="w-full max-w-md" />
          ) : (
            <NaryArt className="w-full max-w-md" />
          )}
        </div>
        <span className="landing-scan pointer-events-none absolute inset-0" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['historial paso a paso', 'validar', 'deshacer / rehacer'].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border/80 bg-background/50 px-2.5 py-1 font-display text-[8px] uppercase tracking-[0.14em] text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlaygroundsSection() {
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

function OpenSourceSection() {
  const stack: Array<{ name: TechIconName; label: string }> = [
    { name: 'react', label: 'React' },
    { name: 'typescript', label: 'TypeScript' },
    { name: 'vite', label: 'Vite' },
    { name: 'tailwind', label: 'Tailwind' },
    { name: 'shadcn', label: 'shadcn' },
  ];

  return (
    <section id="open-source" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:py-28">
      <Reveal>
        <div className="landing-card collab-panel relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-foreground text-background">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
            <FlowRibbon className="h-full w-full" />
          </div>
          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.08fr_0.92fr] lg:p-12">
            <div>
              <span className="grid size-11 place-items-center rounded-full border border-background/20 bg-background/5">
                <GithubMark className="size-5" />
              </span>

              <h2 className="mt-7 max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                <span className="font-thin">Código abierto</span>
                <br />
                <span className="font-black">y colaboración.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-background/65 sm:text-base">
                El código fuente de Arbolito se distribuye de forma abierta. El repositorio permite consultar la
                implementación de los modelos, ejecutar el proyecto localmente y proponer cambios. Las contribuciones
                sobre nuevas estructuras, correcciones o mejoras de accesibilidad son bienvenidas.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-background/75">
                {[
                  'El código puede leerse, ejecutarse y modificarse.',
                  'Los modelos de datos están separados de la interfaz.',
                  'No requiere backend: el estado se almacena en el navegador.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackOutbound('github', 'open_source')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-background px-5 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
                >
                  <GithubMark className="size-4" />
                  Ver repositorio
                  <ArrowUpRight className="size-4" />
                </a>
                <a
                  href={REPO_ISSUES_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackOutbound('github_issues', 'open_source')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-background/25 px-5 text-sm font-medium text-background transition-colors hover:bg-background/10"
                >
                  Abrir un issue
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="landing-card rounded-2xl border border-background/15 bg-background/[0.04] p-4">
                <div className="flex items-center gap-2 border-b border-background/10 pb-3">
                  <span className="size-2 rounded-full bg-background/25" />
                  <span className="size-2 rounded-full bg-background/20" />
                  <span className="size-2 rounded-full bg-background/15" />
                  <span className="ml-auto flex items-center gap-1.5 font-display text-[8px] uppercase tracking-[0.2em] text-background/45">
                    <Terminal className="size-3" />
                    terminal
                  </span>
                </div>
                <pre className="mt-4 overflow-x-auto font-display text-[11px] leading-relaxed text-background/80">
                  <code className="whitespace-pre-wrap break-all">{`git clone ${REPO_URL}.git
cd ${REPO_NAME}
npm install
npm run dev`}</code>
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stack.map((tech) => (
                  <span
                    key={tech.name}
                    className="flex items-center justify-center gap-1.5 rounded-none border border-border/[0.066] bg-background/[0.04] px-2 py-2 font-display text-[9px] uppercase tracking-[0.14em] text-background/65"
                  >
                    <TechIcon name={tech.name} className="size-3" />
                    {tech.label}
                  </span>
                ))}
              </div>

              <div className="landing-card mt-auto rounded-2xl border border-background/15 bg-background/[0.04] p-4">
                <p className="font-display text-[9px] uppercase tracking-[0.22em] text-background/45">
                  Reportes y propuestas
                </p>
                <p className="mt-2 text-sm leading-relaxed text-background/75">
                  Los errores y las ideas se registran en el repositorio. También se aceptan pull requests con cambios
                  acotados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ClosingSection({ last }: { last: PlaygroundDefinition }) {
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

function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-border/70 bg-background/70 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div>
          <Logo />
          <h2 className="mt-6 max-w-xl font-sans text-xl">
            Árboles B y AVL: estructuras que se visualizan, se practican y se validan.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Simulador y visualizador de estructuras de datos para practicar y visualizar{' '}
            <strong className="font-medium text-foreground">árboles B</strong> y{' '}
            <strong className="font-medium text-foreground">árboles AVL</strong> en el navegador: inserción, eliminación,
            búsqueda, divisiones, préstamos, fusiones, rotaciones, balanceo y validación de reglas.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ejercicios de árboles binarios de búsqueda, estructuras n-arias y algoritmos de balanceo, sin backend ni
            registro.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Autor:{' '}
            <a
              href="https://schiavoni.dev/?utm_source=arbolito&utm_medium=footer"
              target="_blank"
              rel="me noreferrer"
              onClick={() => trackOutbound('schiavoni.dev', 'footer')}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Emanuel Schiavoni
            </a>
            {' · '}
            <a
              href="https://schiavoni.dev/?utm_source=arbolito&utm_medium=footer"
              target="_blank"
              rel="me noreferrer"
              onClick={() => trackOutbound('schiavoni.dev', 'footer')}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              SCHIAVONI.DEV
            </a>
          </p>
        </div>
        <nav aria-label="Playgrounds para practicar y visualizar árboles y colaboración" className="lg:justify-self-end">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Playgrounds para practicar y visualizar
          </p>
          <ul className="mt-5 flex flex-col gap-5 text-lg">
            {PLAYGROUNDS.map((playground) => (
              <li key={playground.id}>
                <Link
                  to={`/${playground.id}/auto`}
                  onClick={() => setNavSource('footer')}
                  className="group block text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  <span className="block">Practicar con {playground.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground/80">
                    {playground.description}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/docs"
                onClick={() => trackLandingCta('docs', 'footer')}
                className="inline-flex items-center gap-2 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Documentación para desarrolladores
              </Link>
            </li>
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackOutbound('github', 'footer')}
                className="inline-flex items-center gap-2 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                <GithubMark className="size-4" />
                Contribuir al proyecto en GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const lastId = load<string>(GLOBAL_KEYS.lastPlayground, PLAYGROUNDS[0].id);
  const last = getPlayground(lastId) ?? PLAYGROUNDS[0];

  return (
    <div id="top" className="landing-root relative isolate min-h-dvh overflow-x-clip bg-background text-foreground">
      <InteractiveGrid />
      <LandingHeader last={last} />
      <main className="relative z-10">
        <Hero />
        <AboutSection />
        <GardenSection />
        <PlaygroundsSection />
        <OpenSourceSection />
        <ClosingSection last={last} />
      </main>
      <LandingFooter />
    </div>
  );
}
