import * as React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '../common/components/ui/toast';
import { TooltipProvider } from '../common/components/ui/tooltip';
import { MODES, type Mode } from '../common/playground';
import { GLOBAL_KEYS } from '../common/storage/keys';
import { load, save } from '../common/storage/storage';
import { ChromeProvider } from './chrome';
import { getPlayground, PLAYGROUNDS } from './registry';

function HomeRedirect() {
  const last = load<string>(GLOBAL_KEYS.lastPlayground, 'btree');
  const playground = getPlayground(last) ?? PLAYGROUNDS[0];
  return <Navigate to={`/${playground.id}/auto`} replace />;
}

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    const id = location.pathname.split('/')[1];
    if (getPlayground(id)) save(GLOBAL_KEYS.lastPlayground, id);
  }, [location.pathname]);
  return null;
}

function NotFound() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">La ruta no corresponde a ningún playground.</p>
      <a className="text-sm underline underline-offset-4" href="/btree/auto">
        Volver a Árbol B
      </a>
    </main>
  );
}

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <ChromeProvider>
        <BrowserRouter>
          <RouteTracker />
          <React.Suspense fallback={<div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              {PLAYGROUNDS.flatMap((playground) =>
                MODES.map((mode: Mode) => {
                  const Component = playground.modes[mode].component;
                  return <Route key={`${playground.id}/${mode}`} path={`/${playground.id}/${mode}`} element={<Component />} />;
                }),
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
        <Toaster />
      </ChromeProvider>
    </TooltipProvider>
  );
}
