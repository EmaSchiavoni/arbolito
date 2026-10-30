import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { setNavSource } from '@/common/analytics';
import { Button } from '@/common/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/common/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/common/components/ui/tooltip';
import type { Mode, PlaygroundDefinition } from '@/common/playground';
import { PLAYGROUNDS } from '@/app/registry';

export function PlaygroundMenu({ playground, mode }: { playground: PlaygroundDefinition; mode: Mode }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full" aria-label="Cambiar de playground">
              <span>{playground.title}</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Cambiar de playground</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Playgrounds</DropdownMenuLabel>
        {PLAYGROUNDS.map((p) => (
          <DropdownMenuItem key={p.id} asChild>
            <Link
              to={`/${p.id}/${mode}`}
              onClick={() => setNavSource('header')}
              className={p.id === playground.id ? 'font-medium' : undefined}
            >
              <span className="min-w-0 flex-1">
                <span className="block">{p.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.description}</span>
              </span>
              {p.id === playground.id && <span className="text-xs text-muted-foreground">actual</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
