import * as React from 'react';
import { Pause, Play, RotateCcw, Route } from 'lucide-react';
import { Button } from '../../../common/components/ui/button';
import { Label } from '../../../common/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../common/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '../../../common/components/ui/radio-group';
import { Slider } from '../../../common/components/ui/slider';
import { ToolbarButton } from '../../../common/components/ui/toolbar';
import type { AvlNode } from '../model/avl';
import { TRAVERSAL_LABELS, traverseAvl, type TraversalKind } from '../model/traversal';

const KINDS: TraversalKind[] = ['pre', 'in', 'post', 'level'];
const DEFAULT_SPEED = 4;

type Status = 'idle' | 'running' | 'paused' | 'done';

export interface TraversalHighlight {
  nodes: Set<string>;
  edges: Set<string>;
}

interface TraversalPopoverProps {
  root: AvlNode | null;
  onHighlightChange: (state: TraversalHighlight) => void;
}

export function TraversalPopover({ root, onHighlightChange }: TraversalPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<TraversalKind>('pre');
  const [speed, setSpeed] = React.useState(DEFAULT_SPEED);
  const [status, setStatus] = React.useState<Status>('idle');
  const [index, setIndex] = React.useState(0);

  const events = React.useMemo(() => traverseAvl(root, kind), [root, kind]);
  const total = events.length;
  const running = status === 'running';

  const visited = React.useMemo(
    () =>
      new Set(
        events
          .slice(0, index)
          .filter((event) => event.t === 'visit')
          .map((event) => event.nodeId),
      ),
    [events, index],
  );
  const edges = React.useMemo(
    () =>
      new Set(
        events
          .slice(0, index)
          .filter((event) => event.t === 'enter')
          .map((event) => `${event.from}:${event.to}`),
      ),
    [events, index],
  );
  const output = React.useMemo(
    () =>
      events
        .slice(0, index)
        .filter((event) => event.t === 'visit')
        .map((event) => String(event.key))
        .join(' → '),
    [events, index],
  );

  React.useEffect(() => {
    onHighlightChange({ nodes: visited, edges });
  }, [visited, edges, onHighlightChange]);

  React.useEffect(
    () => () => {
      onHighlightChange({ nodes: new Set(), edges: new Set() });
    },
    [onHighlightChange],
  );

  React.useEffect(() => {
    if (status !== 'running' || total === 0 || index >= total) return;
    const timer = window.setTimeout(() => {
      const next = index + 1;
      setIndex(next);
      if (next >= total) setStatus('done');
    }, 1000 / speed);
    return () => window.clearTimeout(timer);
  }, [status, index, total, speed]);

  function reset() {
    setStatus('idle');
    setIndex(0);
    onHighlightChange({ nodes: new Set(), edges: new Set() });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setKind('pre');
      setSpeed(DEFAULT_SPEED);
    }
  }

  function handleKind(next: TraversalKind) {
    setKind(next);
    setStatus('idle');
    setIndex(0);
  }

  function handlePlay() {
    if (status === 'running') {
      setStatus('paused');
      return;
    }
    if (status === 'paused') {
      setStatus('running');
      return;
    }
    if (total === 0) return;
    setIndex(0);
    setStatus('running');
  }

  const playLabel = running ? 'Pausar' : status === 'paused' ? 'Reanudar' : 'Reproducir';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ToolbarButton size="sm" variant="ghost" disabled={!root} title="Recorrer el árbol">
          <Route />
          Recorrer
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[min(20rem,calc(100vw-1rem))] space-y-3">
        <div>
          <p className="text-xs font-medium">Recorrido</p>
          <RadioGroup
            value={kind}
            onValueChange={(v) => handleKind(v as TraversalKind)}
            disabled={running}
            className="mt-1.5 grid-cols-2 gap-1.5"
            aria-label="Tipo de recorrido"
          >
            {KINDS.map((k) => (
              <div key={k} className="flex items-center gap-1.5">
                <RadioGroupItem value={k} id={`traversal-${k}`} disabled={running} />
                <Label htmlFor={`traversal-${k}`} className="text-xs font-normal">
                  {TRAVERSAL_LABELS[k]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="traversal-speed" className="text-xs">
              Velocidad
            </Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">{speed}x</span>
          </div>
          <Slider
            id="traversal-speed"
            min={1}
            max={10}
            step={1}
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            aria-label="Velocidad del recorrido"
            className="mt-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePlay} disabled={total === 0} className="flex-1">
            {running ? <Pause /> : <Play />}
            {playLabel}
          </Button>
          <Button size="sm" variant="outline" onClick={reset} disabled={status === 'idle'}>
            <RotateCcw />
            Reiniciar
          </Button>
        </div>

        <div className="min-h-[4rem] max-h-24 overflow-auto rounded-lg border bg-transparent p-2 text-xs tabular-nums text-muted-foreground">
          {output || 'Sin resultados.'}
        </div>
      </PopoverContent>
    </Popover>
  );
}
