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
    variant === 'neon' && 'bg-[#00f3ff] text-black hover:shadow-[0_0_20px_#00f3ff]',
    size === 'sm' && 'h-9 px-3 text-xs',
    size === 'md' && 'h-10 px-4 py-2',
    size === 'lg' && 'h-11 px-8',
    size === 'icon' && 'h-10 w-10',
    className
  );

  if (to) return <Link to={to} className={classes} {...(props as any)} />;
  return <button className={classes} ref={ref} {...props} />;
});

export const ButtonNeon = Button;
export const ButtonGhost = (props: ButtonProps) => <Button variant="ghost" {...props} />;
export const ButtonPrimary = (props: ButtonProps) => <Button variant="primary" {...props} />;

export const GlassPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-black/40 backdrop-blur-md border border-white/10 rounded-xl', className)}>
    {children}
  </div>
);

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-bold uppercase tracking-widest text-[#00f3ff] mb-2 block">
    {children}
  </span>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Card = ({ children, className }: any) => (
  <div className={cn('bg-[#111] border border-white/5 rounded-xl overflow-hidden', className)}>
    {children}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-white/5 rounded-md', className)} />
);

export const HealthDot = ({ online }: { online: boolean }) => (
  <div className={cn('w-2 h-2 rounded-full', online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500')} />
);

export const EmptyState = ({ title, description, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    {Icon && <Icon className="w-12 h-12 text-white/20 mb-4" />}
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-white/40 max-w-xs">{description}</p>
  </div>
);
