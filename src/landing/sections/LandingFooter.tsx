import { Link } from 'react-router-dom';
import { PLAYGROUNDS } from '@/app/registry';
import { setNavSource, trackLandingCta, trackOutbound } from '@/common/analytics';
import { Logo } from '@/common/components/Logo';
import { REPO_URL } from '@/common/repo';
import { GithubMark } from '@/common/components/GithubMark';

export function LandingFooter() {
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
