import * as React from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '../common/components/ui/toast';
import { TooltipProvider } from '../common/components/ui/tooltip';
import { MODES, type Mode } from '../common/playground';
import { takeNavSource, track, useSessionEngaged } from '../common/analytics';
import { GLOBAL_KEYS } from '../common/storage/keys';
import { save } from '../common/storage/storage';
import LandingPage from '../landing/LandingPage';
import { ChromeProvider } from './chrome';
import { getPlayground, PLAYGROUNDS } from './registry';

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
  const isLanding = location.pathname === '/';

  return (
    <div className={isLanding ? 'min-h-dvh' : 'flex h-dvh min-h-0 flex-col'}>
      <React.Suspense
        fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Cargando…</div>}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
          <RouteTracker />
          <AppFrame />
        </BrowserRouter>
        <Toaster />
      </ChromeProvider>
    </TooltipProvider>
  );
}
