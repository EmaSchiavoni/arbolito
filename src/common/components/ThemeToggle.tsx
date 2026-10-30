import { Moon, Sun } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/common/components/ui/tooltip';

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" onClick={onToggle} aria-label="Cambiar tema">
          {dark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Cambiar tema</TooltipContent>
    </Tooltip>
  );
}
