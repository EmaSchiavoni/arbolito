import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/common/components/ui/button-variants';
import { cn } from '@/common/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
