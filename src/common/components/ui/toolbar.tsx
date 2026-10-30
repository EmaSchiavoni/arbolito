import * as React from 'react';
import * as ToolbarPrimitive from '@radix-ui/react-toolbar';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { cn } from '@/common/lib/utils';

const Toolbar = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Root>
>(({ className, orientation = 'horizontal', ...props }, ref) => (
  <ToolbarPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn('flex items-center gap-1', orientation === 'vertical' && 'flex-col', className)}
    {...props}
  />
));
Toolbar.displayName = ToolbarPrimitive.Root.displayName;

const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Button> & VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToolbarPrimitive.Button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
ToolbarButton.displayName = ToolbarPrimitive.Button.displayName;

const ToolbarSeparator = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.Separator
    ref={ref}
    className={cn(
      'shrink-0 bg-border data-[orientation=vertical]:h-6 data-[orientation=vertical]:w-px data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-6',
      className,
    )}
    {...props}
  />
));
ToolbarSeparator.displayName = ToolbarPrimitive.Separator.displayName;

export { Toolbar, ToolbarButton, ToolbarSeparator };
