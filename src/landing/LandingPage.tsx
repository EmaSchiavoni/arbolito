import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Terminal } from 'lucide-react';
import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import { setNavSource, trackLandingCta, trackOutbound } from '@/common/analytics';
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
import { InteractiveGrid } from '@/landing/InteractiveGrid';
import { REPO_ISSUES_URL, REPO_NAME, REPO_URL } from '@/common/repo';
import { TechIcon, type TechIconName } from '@/landing/TechIcons';
import { AvlArt, BTreeArt, FlowRibbon, GithubMark, NaryArt, RotationArt } from '@/landing/TreeArt';
import { Reveal } from './components/Reveal';
import { AboutSection } from './sections/AboutSection';
import { HeroSection } from './sections/HeroSection';
import { LandingFooter } from './sections/LandingFooter';
import { LandingHeader } from './sections/LandingHeader';
import { StructuresSection } from './sections/StructuresSection';
import './landing.css';

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

export default function LandingPage() {
  const lastId = load<string>(GLOBAL_KEYS.lastPlayground, PLAYGROUNDS[0].id);
  const last = getPlayground(lastId) ?? PLAYGROUNDS[0];

  return (
    <div id="top" className="landing-root relative isolate min-h-dvh overflow-x-clip bg-background text-foreground">
      <InteractiveGrid />
      <LandingHeader last={last} />
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <StructuresSection />
        <PlaygroundsSection />
        <OpenSourceSection />
        <ClosingSection last={last} />
      </main>
      <LandingFooter />
    </div>
  );
}
