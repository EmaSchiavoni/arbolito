import * as React from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '../common/components/ui/toast';
import { TooltipProvider } from '../common/components/ui/tooltip';
import { MODES, type Mode } from '../common/playground';
import { takeNavSource, track, useSessionEngaged } from '../common/analytics';
import { GLOBAL_KEYS } from '../common/storage/keys';
import { save } from '../common/storage/storage';
import { SharedSessionProvider, useSharedSession } from '../common/share';
import LandingPage from '../landing/LandingPage';
import { ChromeProvider } from './chrome';
import { getPlayground, PLAYGROUNDS } from './registry';
import { usePageMeta } from './seo';

const DocsIndex = React.lazy(() => import('../docs/DocsIndex').then((m) => ({ default: m.DocsIndex })));
const DocsPage = React.lazy(() => import('../docs/DocsPage').then((m) => ({ default: m.DocsPage })));

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    const [id, mode] = location.pathname.split('/').filter(Boolean);
    const playground = getPlayground(id);
    const source = takeNavSource();
    if (playground) {
      save(GLOBAL_KEYS.lastPlayground, playground.id);
      track('playground_open', {
        playground: playground.id,
        mode: mode === 'manual' ? 'manual' : 'auto',
        source,
      });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);
  return null;
}

function NotFound() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">La ruta no corresponde a ningún playground.</p>
      <Link className="text-sm underline underline-offset-4" to="/">
        Volver al inicio
      </Link>
    </main>
  );
}

function AppFrame() {
  const location = useLocation();
  const { resetKey, active } = useSharedSession();
  const isLanding = location.pathname === '/';
  // La landing y la documentación usan scroll normal; los playgrounds ocupan
  // toda la ventana.
  const isScrollable =
    isLanding || location.pathname === '/docs' || location.pathname.startsWith('/docs/');
  // Al entrar a un enlace compartido desde la SPA hay que remontar la ruta
  // para que el playground inicialice su estado desde la sesión hidratada.
  const routesKey = `${resetKey}:${active ? location.search : ''}`;
  usePageMeta();

  return (
    <div className={isScrollable ? 'min-h-dvh' : 'flex h-dvh min-h-0 flex-col'}>
      <React.Suspense
        fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Cargando…</div>}
      >
        <Routes key={routesKey}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsIndex />} />
          <Route path="/docs/:slug" element={<DocsPage />} />
          {PLAYGROUNDS.flatMap((playground) =>
            MODES.map((mode: Mode) => {
              const Component = playground.modes[mode].component;
              return <Route key={`${playground.id}/${mode}`} path={`/${playground.id}/${mode}`} element={<Component />} />;
            }),
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}

export default function App() {
  useSessionEngaged();

  return (
    <TooltipProvider delayDuration={300}>
      <ChromeProvider>
        <BrowserRouter>
          <SharedSessionProvider>
            <RouteTracker />
            <AppFrame />
          </SharedSessionProvider>
        </BrowserRouter>
        <Toaster />
      </ChromeProvider>
    </TooltipProvider>
  );
}
