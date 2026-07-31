/**
 * SpotlightCard — mouse-tracking lunar highlight: a 600px radial glow that
 * follows the pointer across the card surface and fades in/out on hover.
 * The border also lifts 10%→20% on hover (micro-hierarchy). Pure CSS vars +
 * one pointer listener; disabled for touch and reduced motion.
 */
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export default function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn('spotlight-card group/spot relative', className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(600px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(220,230,248,.10), transparent 42%)',
        }}
      />
      {children}
    </div>
  );
}
