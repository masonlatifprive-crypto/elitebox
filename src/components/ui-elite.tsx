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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'neon' | 'danger';
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
    variant === 'neon' && 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]',
    variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    size === 'sm' && 'h-9 px-3 text-xs',
    size === 'md' && 'h-10 px-4 py-2',
    size === 'lg' && 'h-11 px-8',
    size === 'icon' && 'h-10 w-10',
    className
  );

  if (to) {
    return <Link to={to} className={classes} {...(props as any)}>{props.children}</Link>;
  }

  return <button className={classes} ref={ref} {...props} />;
});

export const ButtonPrimary = (props: ButtonProps) => <Button variant='primary' {...props} />;
export const ButtonGhost = (props: ButtonProps) => <Button variant='ghost' {...props} />;
export const ButtonNeon = (props: ButtonProps) => <Button variant='neon' {...props} />;
export const ButtonDanger = (props: ButtonProps) => <Button variant='danger' {...props} />;

export const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'outline' | 'neon' }) => (
  <span className={cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    variant === 'default' && 'border-transparent bg-primary text-primary-foreground',
    variant === 'outline' && 'text-foreground border border-input',
    variant === 'neon' && 'bg-primary/20 text-primary border border-primary/50',
    className
  )}>
    {children}
  </span>
);

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}>{children}</div>
);

export const GlassPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl', className)}>{children}</div>
);

export const Eyebrow = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('text-primary text-sm font-bold tracking-widest uppercase mb-4', className)}>{children}</div>
);

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title?: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80'>
      <div className='bg-background border rounded-lg shadow-lg w-full max-w-lg overflow-hidden'>
        {title && <div className='p-4 border-b flex justify-between items-center'><h3 className='text-lg font-semibold'>{title}</h3><button onClick={onClose}>&times;</button></div>}
        <div className='p-4'>{children}</div>
      </div>
    </div>
  );
};

export const HealthDot = ({ status }: { status: 'healthy' | 'warning' | 'error' }) => (
  <span className={cn('h-2 w-2 rounded-full inline-block mr-2', status === 'healthy' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500')} />
);

export const EmptyState = ({ title, description, icon: Icon }: { title: string, description?: string, icon?: any }) => (
  <div className='flex flex-col items-center justify-center p-12 text-center'>
    {Icon && <Icon className='w-12 h-12 text-muted-foreground mb-4' />}
    <h3 className='text-lg font-medium'>{title}</h3>
    {description && <p className='text-sm text-muted-foreground mt-2'>{description}</p>}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} />
);
