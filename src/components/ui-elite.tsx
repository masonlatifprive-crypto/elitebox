import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const spring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
};

export const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
  to?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  { className, variant = 'primary', size = 'md', asChild, to, ...props },
  ref
) => {
  const classes = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
    variant === 'neon' && 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-400',
    size === 'sm' && 'h-9 px-3',
    size === 'md' && 'h-10 px-4 py-2',
    size === 'lg' && 'h-11 px-8',
    size === 'icon' && 'h-10 w-10',
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {props.children}
      </Link>
    );
  }

  return (
    <button className={classes} ref={ref} {...props} />
  );
});

export const ButtonPrimary = (props: ButtonProps) => <Button variant=\"primary\" {...props} />;
export const ButtonNeon = (props: ButtonProps) => <Button variant=\"neon\" {...props} />;
export const ButtonGhost = (props: ButtonProps) => <Button variant=\"ghost\" {...props} />;

export const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('text-xs font-bold uppercase tracking-widest text-primary', className)}>
    {children}
  </span>
);

export const GlassPanel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-xl border border-white/10 bg-white/5 backdrop-blur-md', className)}>
    {children}
  </div>
);

Button.displayName = 'Button';
