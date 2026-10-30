import { Pause, Play } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Slider } from '@/common/components/ui/slider';

interface AnimationControlsProps {
  speed: number;
  playing: boolean;
  onSpeedChange: (speed: number) => void;
  onTogglePlay: () => void;
}

function formatSpeed(speed: number): string {
  return `${Number(speed.toFixed(2))}x`;
}

export function AnimationControls({ speed, playing, onSpeedChange, onTogglePlay }: AnimationControlsProps) {
  return (
    <div className="fixed bottom-[4.75rem] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur max-[665px]:bottom-32">
      <span className="text-[11px] text-muted-foreground">Animación</span>
      <Slider
        min={1}
        max={7}
        step={0.25}
        value={[speed]}
        onValueChange={([value]) => onSpeedChange(value)}
        aria-label="Velocidad de la animación"
        className="w-24"
      />
      <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">{formatSpeed(speed)}</span>
      <Button
        size="sm"
        variant="ghost"
        className="px-1.5"
        onClick={onTogglePlay}
        aria-label={playing ? 'Pausar animación' : 'Reanudar animación'}
        title={playing ? 'Pausar animación' : 'Reanudar animación'}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
    </div>
  );
}
