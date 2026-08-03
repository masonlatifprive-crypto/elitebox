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
  damping: 20
};


export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'neon';
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
export const ButtonPrimary = Button;

export const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg)
};

export const Modal = ({ children, isOpen, onClose }: any) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-background p-6 rounded-lg shadow-xl relative'>
        <button onClick={onClose} className='absolute top-2 right-2 text-muted-foreground hover:text-foreground'>✕</button>
        {children}
      </div>
    </div>
  );
};
