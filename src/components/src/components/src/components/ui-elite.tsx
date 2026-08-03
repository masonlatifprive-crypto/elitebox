/**
 * Elitebox shared UI primitives (design.md §10.6–§10.10).
 * Every button is wired: renders as <Link>/<button> and always does something.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, OctagonX, X } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import type { AddonHealth } from '@/lib/types';

/* ── spring presets (design.md §7) ─────────────────────────────────────── */
export const spring = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  smooth: { type: 'spring', stiffness: 260, damping: 30 },
  cinematic: { type: 'spring', stiffness: 120, damping: 22 },
} as const;

type CommonProps = {
  to?: string;
  /** External URL — renders a real <a target="_blank" rel="noopener noreferrer">. */
  href?: string;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, CommonProps>(
  (
    {
      to,
      href,
      onClick,
      children,
      className,
      disabled,
      active,
      variant = 'secondary',
      size = 'md',
      loading,
      icon,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      subtle: 'bg-primary/10 text-primary hover:bg-primary/20',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10',
    };

    const content = (
      <>
        {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </>
    );

    if (to) {
      return (
        <Link
          to={to}
          className={cn(baseStyles, variants[variant], sizes[size], active && 'ring-2 ring-primary', className)}
          {...(props as any)}
        >
          {content}
        </Link>
      );
    }

    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          {...(props as any)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as any}
        disabled={disabled || loading}
        onClick={onClick}
        className={cn(baseStyles, variants[variant], sizes[size], active && 'ring-2 ring-primary', className)}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
