import React, { forwardRef, useState, useEffect } from 'react';
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
    variant === 'neon' && 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30',
    size === 'sm' && 'h-8 px-3 text-xs',
    size === 'md' && 'h-10 px-4 py-2',
    size === 'lg' && 'h-12 px-8 text-lg',
    size === 'icon' && 'h-10 w-10',
    className
  );

  if (to) {
    return <Link to={to} className={classes} {...(props as any)} />;
  }

  return <button ref={ref} className={classes} {...props} />;
});

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Card = ({ children, className }: any) => (
  <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow", className)}>
    {children}
  </div>
);

export const Skeleton = ({ className }: any) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

export const Badge = ({ children, variant = 'primary', className }: any) => (
  <span className={cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    variant === 'primary' && "bg-primary text-primary-foreground",
    variant === 'outline' && "border border-border text-foreground",
    className
  )}>
    {children}
  </span>
);

export const Input = forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));

export const Eyebrow = ({ children, className }: any) => (
  <span className={cn("text-sm font-bold uppercase tracking-wider text-primary", className)}>
    {children}
  </span>
);
