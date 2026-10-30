import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { setNavSource } from '@/common/analytics';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/common/components/ui/sheet';
import type { Mode, PlaygroundDefinition } from '@/common/playground';
import { PLAYGROUNDS } from '@/app/registry';
import { IconButton } from './IconButton';

interface PlaygroundsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playground: PlaygroundDefinition;
  mode: Mode;
}

export function PlaygroundsSheet({ open, onOpenChange, playground, mode }: PlaygroundsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="top"
        overlay={false}
        showClose={false}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="rounded-none border-b p-0 shadow-sm"
      >
        <SheetDescription className="sr-only">Cambiar de playground</SheetDescription>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <SheetTitle className="text-sm font-medium">Playgrounds</SheetTitle>
          <IconButton variant="ghost" onClick={() => onOpenChange(false)} label="Ocultar playgrounds">
            <ChevronUp />
          </IconButton>
        </div>
        <div className="space-y-1 px-3 pb-3">
          {PLAYGROUNDS.map((p) => (
            <Link
              key={p.id}
              to={`/${p.id}/${mode}`}
              onClick={() => {
                setNavSource('header');
                onOpenChange(false);
              }}
              className="flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="mt-0.5 font-mono text-xs font-bold">{p.short}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{p.title}</span>
                <span className="block text-xs text-muted-foreground">{p.description}</span>
              </span>
              {p.id === playground.id && <span className="text-xs text-muted-foreground">actual</span>}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
