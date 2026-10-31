import { Tooltip, TooltipContent, TooltipTrigger } from '@/common/components/ui/tooltip';
import { ToolbarButton } from '@/common/components/ui/toolbar';
import { cn } from '@/common/lib/utils';
import type { CanvasTool } from '@/common/tools/types';

interface Props {
  tool: CanvasTool;
  active: boolean;
  onSelect: () => void;
  className?: string;
}

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
