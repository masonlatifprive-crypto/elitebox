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
    variant === 'neon' && 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    size === 'sm' && 'h-9 px-3 text-xs',
    size === 'md' && 'h-10 px-4 py-2',
    size === 'lg' && 'h-11 px-8',
    size === 'icon' && 'h-10 w-10',
    className
  );
  if (to) return <Link to={to} className={classes} {...(props as any)} />;
  return <button className={classes} ref={ref} {...props} />;
});

export const ButtonPrimary = (props: ButtonProps) => <Button variant="primary" {...props} />;
export const ButtonGhost = (props: ButtonProps) => <Button variant="ghost" {...props} />;
export const ButtonNeon = (props: ButtonProps) => <Button variant="neon" {...props} />;

export const GlassPanel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl overflow-hidden', className)}>
    {children}
  </div>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Card = ({ children, className }: any) => (
  <div className={cn('bg-[#111] border border-white/5 rounded-xl overflow-hidden', className)}>{children}</div>
);

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4 uppercase tracking-wider">
    {children}
  </span>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-white/5 rounded-md', className)} />
);
