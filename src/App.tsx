import * as React from 'react';
import { Toaster } from './components/ui/toast';
import { TooltipProvider } from './components/ui/tooltip';
import { useTheme } from './lib/use-theme';
import { PlayAuto } from './routes/PlayAuto';
import { PlayManual } from './routes/PlayManual';
import { KEYS, load, save } from './lib/storage';

export default function App() {
  const { dark, toggle } = useTheme();
  const [tab, setTab] = React.useState<string>(() => localStorage.getItem('arboles-b:tab') ?? 'auto');
  const [headerHidden, setHeaderHidden] = React.useState<boolean>(() => load<boolean>(KEYS.headerHidden, false));

  React.useEffect(() => {
    try {
      localStorage.setItem('arboles-b:tab', tab);
    } catch {
      // noop
    }
  }, [tab]);

  React.useEffect(() => {
    save(KEYS.headerHidden, headerHidden);
  }, [headerHidden]);

  const inAuto = tab === 'auto';

  const chrome = {
    hidden: headerHidden,
    onShowHeader: () => setHeaderHidden(false),
    onHideHeader: () => setHeaderHidden(true),
    tab,
    onToggleTab: () => setTab(inAuto ? 'manual' : 'auto'),
    dark,
    onToggleTheme: toggle,
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <main className="min-h-0 flex-1">
          <h1 className="sr-only">Playground de Árboles B: generá, explorá y validá árboles B</h1>
          {inAuto ? <PlayAuto key="auto" {...chrome} /> : <PlayManual key="manual" {...chrome} />}
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
