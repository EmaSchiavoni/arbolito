import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ToolbarButton } from './ui/toolbar';
import { cn } from '../lib/utils';
import type { CanvasTool } from '../tools/types';

interface Props {
  tool: CanvasTool;
  active: boolean;
  onSelect: () => void;
  className?: string;
}

// Botón genérico de herramienta: ícono, tooltip al hover y estado seleccionado
// reutilizable por cualquier tool del canvas.
export function ToolButton({ tool, active, onSelect, className }: Props) {
  const Icon = tool.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarButton
          type="button"
          size="icon"
          variant="ghost"
          aria-pressed={active}
          aria-label={tool.label}
          data-state={active ? 'on' : 'off'}
          onClick={onSelect}
          className={cn(
            'size-8 data-[state=on]:bg-zinc-900 data-[state=on]:text-zinc-50 dark:data-[state=on]:bg-zinc-50 dark:data-[state=on]:text-zinc-900',
            className,
          )}
        >
          <Icon />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipContent side="top">{tool.label}</TooltipContent>
    </Tooltip>
  );
}
