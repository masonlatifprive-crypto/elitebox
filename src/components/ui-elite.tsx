import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const spring = {
  type: 'spring',
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, to, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
      variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
      variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
      variant === 'neon' && 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-400',
      className
    );

    if (to) {
      return (
        <Link to={to} className={classes} {...(props as any)}>
          {props.children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {props.children}
      </button>
    );
  }
);

export const ButtonPrimary = (props: ButtonProps) => <Button variant="primary" {...props} />;
export const ButtonGhost = (props: ButtonProps) => <Button variant="ghost" {...props} />;
export const ButtonNeon = (props: ButtonProps) => <Button variant="neon" {...props} />;

export const Modal = ({ children, isOpen, onClose }: { children: React.ReactNode; isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-lg w-full">
        {children}
      </div>
    </div>
  );
};
