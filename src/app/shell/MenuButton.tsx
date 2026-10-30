import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { DropdownMenuTrigger } from '@/common/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/common/components/ui/tooltip';

export function MenuButton({ variant, className }: { variant: 'ghost' | 'outline'; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className={className} aria-label="Más opciones">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent>Más opciones</TooltipContent>
    </Tooltip>
  );
}
