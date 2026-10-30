import { ArrowUpRight, Check, Terminal } from 'lucide-react';
import { trackOutbound } from '@/common/analytics';
import { REPO_ISSUES_URL, REPO_NAME, REPO_URL } from '@/common/repo';
import { Reveal } from '@/landing/components/Reveal';
import { TechIcon, type TechIconName } from '@/landing/TechIcons';
import { GithubMark } from '@/common/components/GithubMark';
import { FlowRibbon } from '@/landing/art/FlowRibbon';

const STACK: Array<{ name: TechIconName; label: string }> = [
  { name: 'react', label: 'React' },
  { name: 'typescript', label: 'TypeScript' },
  { name: 'vite', label: 'Vite' },
  { name: 'tailwind', label: 'Tailwind' },
  { name: 'shadcn', label: 'shadcn' },
];

const LINKS = [
  'El código puede leerse, ejecutarse y modificarse.',
  'Los modelos de datos están separados de la interfaz.',
  'No requiere backend: el estado se almacena en el navegador.',
];

export function OpenSourceSection() {
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
                {LINKS.map((item) => (
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
                {STACK.map((tech) => (
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
