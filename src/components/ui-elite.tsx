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
import { Link } from 'react-router';
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

/* ── Buttons ───────────────────────────────────────────────────────────── */

type CommonProps = {
  to?: string;
  /** External URL — renders a real <a target="_blank" rel="noopener noreferrer">. */
  href?: string;
  onClick?: () => void;
  /**
   * Disabled state: a real `disabled` attribute on <button> renders, and
   * `aria-disabled` + inert pointer/keyboard behavior on link renders. Muted
   * styling comes from btnBase's `disabled:` variants (buttons) or explicit
   * opacity/pointer classes (links). Omitting it changes nothing.
   */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

const btnBase =
  'focusable inline-flex items-center justify-center gap-8 rounded-full font-sans font-bold transition-[filter,background,box-shadow,color] duration-[180ms] select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none';

const btnSizes = 'px-24 py-12 text-caption';

function useButtonHandlers(to?: string, onClick?: () => void) {
  return { to, onClick };
}

export function ButtonPrimary({ to, onClick, disabled, className, children }: CommonProps) {
  const cls = cn(
    btnBase,
    btnSizes,
    'bg-chrome text-deep shadow-btn-glow hover:brightness-110 hover:shadow-btn-glow active:scale-[0.97]',
    className,
  );
  const inner = (
    <motion.span whileTap={{ scale: 0.97 }} transition={spring.snappy} className="contents">
      {children}
    </motion.span>
  );
  return to ? (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(cls, disabled && 'pointer-events-none opacity-50')}
    >
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

export function ButtonNeon({ to, onClick, disabled, className, children }: CommonProps) {
  const cls = cn(
    btnBase,
    btnSizes,
    'border-[1.5px] border-cyan text-cyan bg-transparent hover:bg-[rgba(124,217,236,.08)] hover:shadow-glow-neon active:scale-[0.97]',
    className,
  );
  return to ? (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(cls, disabled && 'pointer-events-none opacity-50')}
    >
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function ButtonGhost({ to, href, onClick, disabled, className, children }: CommonProps) {
  const cls = cn(
    btnBase,
    'px-16 py-8 text-caption font-semibold text-muted hover:text-ink hover:bg-white/[.06] active:scale-[0.97]',
    className,
  );
  if (href) {
    return disabled ? (
      <a aria-disabled="true" tabIndex={-1} className={cn(cls, 'pointer-events-none opacity-50')}>
        {children}
      </a>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return to ? (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(cls, disabled && 'pointer-events-none opacity-50')}
    >
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** Danger outline variant (addon remove, profile delete). */
export function ButtonDanger({ to, onClick, disabled, className, children }: CommonProps) {
  const cls = cn(
    btnBase,
    btnSizes,
    'border-[1.5px] border-error text-error bg-transparent hover:bg-[rgba(255,77,109,.08)] active:scale-[0.97]',
    className,
  );
  const props = useButtonHandlers(to, onClick);
  return props.to ? (
    <Link
      to={props.to}
      onClick={disabled ? undefined : props.onClick}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(cls, disabled && 'pointer-events-none opacity-50')}
    >
      {children}
    </Link>
  ) : (
    <button type="button" onClick={props.onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/* ── Health dot (§10.7) ────────────────────────────────────────────────── */

export function HealthDot({
  status,
  latencyMs,
  className,
}: {
  status: AddonHealth['status'];
  latencyMs?: number;
  className?: string;
}) {
  const { t } = useT();
  const color =
    status === 'ok' ? 'bg-ok shadow-[0_0_8px_rgba(124,217,236,.7)]'
    : status === 'degraded' ? 'bg-warn shadow-[0_0_8px_rgba(255,184,77,.7)]'
    : 'bg-error shadow-[0_0_8px_rgba(255,77,109,.7)]';
  const label =
    status === 'ok'
      ? `${t('app.ui.healthOk')}${latencyMs !== undefined ? ` · ${Math.round(latencyMs)}ms` : ''}`
      : status === 'degraded'
        ? `${t('app.ui.healthDegraded')}${latencyMs !== undefined ? ` · ${Math.round(latencyMs)}ms` : ''}`
        : t('app.ui.healthDown');
  return (
    <span className={cn('inline-flex items-center gap-6', className)} title={label}>
      <span className={cn('inline-block h-8 w-8 rounded-full', color)} />
      {latencyMs !== undefined && (
        <span className="font-mono text-[11px] text-muted">{Math.round(latencyMs)}ms</span>
      )}
    </span>
  );
}

/* ── Quality badges (§10.7) ────────────────────────────────────────────── */

export function Badge({ kind, className }: { kind: 'HD' | '4K' | 'LIVE'; className?: string }) {
  const { t } = useT();
  if (kind === 'LIVE') {
    return (
      <span
        className={cn(
          'glass-1 inline-flex items-center gap-6 rounded-md px-8 py-2 text-micro uppercase',
          className,
        )}
      >
        <span className="h-6 w-6 rounded-full bg-live animate-live-pulse" />
        <span className="text-ink">{t('app.ui.badgeLive')}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        'glass-1 inline-flex items-center rounded-md px-8 py-2 text-micro uppercase',
        kind === 'HD' ? 'text-cyan' : 'text-gradient-signature',
        className,
      )}
    >
      {kind}
    </span>
  );
}

/* ── Glass panel ───────────────────────────────────────────────────────── */

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { level?: 1 | 2 | 3 }>(
  function GlassPanel({ level = 2, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(level === 1 ? 'glass-1' : level === 2 ? 'glass-2' : 'glass-3', 'rounded-2xl', className)}
        {...props}
      />
    );
  },
);

/* ── Empty state (§10.10) ──────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  caption,
  action,
  className,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
  title: string;
  caption: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-16 py-64 text-center', className)}>
      <div className="glass-2 flex h-96 w-96 items-center justify-center rounded-full">
        <Icon size={40} strokeWidth={1.75} className="text-muted" />
      </div>
      <div className="flex flex-col gap-8 max-w-[40ch]">
        <h3 className="font-display text-title text-ink">{title}</h3>
        <p className="text-caption text-muted">{caption}</p>
      </div>
      {action}
    </div>
  );
}

/* ── Modal (§10.8) — glass-3, focus-trapped, Esc closes ────────────────── */

const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Esc + focus trap
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SEL) ?? []).filter(
        (el) => el.offsetParent !== null,
      );
    const first = focusables()[0];
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-deep/70 backdrop-blur-[8px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            data-modal-open
            tabIndex={-1}
            className={cn(
              'glass-3 relative z-10 w-full max-w-lg rounded-2xl p-24 max-h-[85dvh] overflow-y-auto',
              className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={spring.smooth}
          >
            <div className="flex items-start justify-between gap-16">
              {title && (
                <h2 id={titleId} className="font-display text-title text-ink">
                  {title}
                </h2>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('app.ui.closeDialog')}
                className="focusable ml-auto rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06] cursor-pointer"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className={title ? 'mt-16' : ''}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Eyebrow (§3) — micro, uppercase, wide tracking, cyan ──────────────── */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-micro uppercase tracking-[.3em] text-cyan', className)}>{children}</p>
  );
}

/* ── Toasts (§10.9) ────────────────────────────────────────────────────── */

interface ToastItem {
  id: number;
  msg: string;
  kind?: 'ok' | 'error';
}

let toastSeq = 0;
const toastListeners = new Set<() => void>();
let toastSnapshot: ToastItem[] = [];
const toastTimers = new Map<number, ReturnType<typeof setTimeout>>();

function emitToasts() {
  toastSnapshot = [...toastSnapshot];
  toastListeners.forEach((l) => l());
}

/** Fire a toast from anywhere: `toast('Added to library')`. */
export function toast(msg: string, kind: 'ok' | 'error' = 'ok'): void {
  const id = ++toastSeq;
  toastSnapshot = [...toastSnapshot, { id, msg, kind }];
  emitToasts();
  const timer = setTimeout(() => dismissToast(id), 3500);
  toastTimers.set(id, timer);
}

/** Error toast (§10.9): `toast.error('Import failed')` — --error styling. */
toast.error = (msg: string): void => {
  toast(msg, 'error');
};

export function dismissToast(id: number): void {
  const timer = toastTimers.get(id);
  if (timer) clearTimeout(timer);
  toastTimers.delete(id);
  toastSnapshot = toastSnapshot.filter((t) => t.id !== id);
  emitToasts();
}

function subscribeToasts(cb: () => void) {
  toastListeners.add(cb);
  return () => {
    toastListeners.delete(cb);
  };
}

export function ToastHost() {
  const { t } = useT();
  const toasts = useSyncExternalStore(subscribeToasts, () => toastSnapshot);
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-8 px-16 top-16 md:top-16 max-md:top-auto max-md:bottom-24">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout="position"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={spring.snappy}
            className={cn(
              'glass-2 pointer-events-auto flex items-center gap-12 rounded-lg px-16 py-12',
              item.kind === 'error' && 'border border-error/50',
            )}
            role={item.kind === 'error' ? 'alert' : 'status'}
          >
            {item.kind === 'error' ? (
              <OctagonX size={18} strokeWidth={1.75} className="text-error shrink-0" />
            ) : (
              <CheckCircle2 size={18} strokeWidth={1.75} className="text-cyan shrink-0" />
            )}
            <span className="text-caption text-ink">{item.msg}</span>
            <button
              type="button"
              aria-label={t('app.ui.dismissNotification')}
              onClick={() => dismissToast(item.id)}
              className="focusable rounded-full p-4 text-muted hover:text-ink cursor-pointer"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── misc hooks shared by pages ────────────────────────────────────────── */

/** useState that also reports whether it has been set (for skeleton gates). */
export function useDelayedFlag(ms: number): boolean {
  const [flag, setFlag] = useState(false);
  const fire = useCallback(() => setFlag(true), []);
  useEffect(() => {
    const t = setTimeout(fire, ms);
    return () => clearTimeout(t);
  }, [ms, fire]);
  return flag;
}
