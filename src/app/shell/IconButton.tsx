import * as React from 'react';
import { Button } from '@/common/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/common/components/ui/tooltip';

interface IconButtonProps extends Omit<React.ComponentProps<typeof Button>, 'children'> {
  label: string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ label, children, ...props }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button ref={ref} size="icon" aria-label={label} {...props}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
));
IconButton.displayName = 'IconButton';
