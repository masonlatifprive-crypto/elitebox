import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
  to?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, to, ...props }, ref) => {
    if (to) {
      return (
        <Link
          to={to}
          className={cn(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
            variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
            variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            size === 'md' && 'h-10 px-4 py-2',
            size === 'sm' && 'h-9 rounded-md px-3',
            size === 'icon' && 'h-10 w-10',
            className
          )}
          {...(props as any)}
        />
      );
    }
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          size === 'md' && 'h-10 px-4 py-2',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const toast = (msg: string) => {
  console.log('Toast:', msg);
  // Simple fallback toast if full implementation is missing
  if (typeof window !== 'undefined') {
    alert(msg);
  }
};

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>{children}</div>
);
