import * as React from 'react';
import { ChevronRight, ListCollapse } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/common/components/ui/dialog';
import { ScrollArea } from '@/common/components/ui/scroll-area';

export interface HistoryItem {
  id: number;
  text: string;
  steps?: string[];
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
}

export function HistoryDialog({ open, onOpenChange, history }: HistoryDialogProps) {
  const [openSteps, setOpenSteps] = React.useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70dvh] w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historial</DialogTitle>
        </DialogHeader>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay operaciones.</p>
        ) : (
          <ScrollArea className="max-h-[50dvh] pr-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {history.map((h) => (
                <li key={h.id} className="rounded-2xl border px-2 py-1">
                  <div className="flex items-center gap-1">
                    <span className="min-w-0 flex-1">· {h.text}</span>
                    {h.steps && h.steps.length > 0 && (
                      <button
                        type="button"
                        title={openSteps === h.id ? 'Ocultar pasos' : 'Ver pasos'}
                        onClick={() => setOpenSteps((o) => (o === h.id ? null : h.id))}
                        className="flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <ListCollapse className="size-3" />
                        pasos
                      </button>
                    )}
                  </div>
                  {openSteps === h.id && h.steps && h.steps.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {h.steps.map((s, i) => (
                        <span key={i} className="contents">
                          {i > 0 && <ChevronRight className="size-3 shrink-0 text-zinc-400 dark:text-zinc-500" />}
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] dark:bg-zinc-800">{s}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
