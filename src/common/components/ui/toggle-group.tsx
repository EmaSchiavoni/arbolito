import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-zinc-900 data-[state=on]:text-zinc-50 dark:data-[state=on]:bg-zinc-50 dark:data-[state=on]:text-zinc-900',
  {
    variants: {
      size: {
        default: 'px-3 py-1',
        sm: 'px-2.5 py-1',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn('flex items-center justify-center gap-1', className)} {...props} />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleGroupItemVariants>
>(({ className, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item ref={ref} className={cn(toggleGroupItemVariants({ size }), className)} {...props} />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
