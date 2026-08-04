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
    className
  );

  if (to) {
    return <Link to={to} className={classes} {...(props as any)} />;
  }

  return <button className={classes} ref={ref} {...props} />;
});

export const Modal = ({ children, isOpen, onClose, title }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Card = ({ children, className }: any) => (
  <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>{children}</div>
);

export const Badge = ({ children, className, variant = 'default' }: any) => (
  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", 
    variant === 'default' ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground",
    className
  )}>{children}</span>
);

export const Input = forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", className)} {...props} />
));

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);
