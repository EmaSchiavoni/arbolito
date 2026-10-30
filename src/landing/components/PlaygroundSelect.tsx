import { Check, ChevronDown } from 'lucide-react';
import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/common/components/ui/dropdown-menu';

export function PlaygroundSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const selected = getPlayground(value) ?? PLAYGROUNDS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Elegir playground"
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card/75 px-4 py-3 text-left shadow-sm outline-none backdrop-blur transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-ring"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              Playground
            </span>
            <span className="block truncate text-base font-semibold">{selected.title}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[18rem]">
        <DropdownMenuLabel>Disponibles ahora · {PLAYGROUNDS.length}</DropdownMenuLabel>
        {PLAYGROUNDS.map((playground) => (
          <DropdownMenuItem
            key={playground.id}
            onSelect={() => onChange(playground.id)}
            className="items-start gap-3 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{playground.title}</span>
              <span className="block text-xs leading-relaxed text-muted-foreground">{playground.description}</span>
            </span>
            {playground.id === value && <Check className="mt-1 size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
