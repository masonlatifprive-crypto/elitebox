/**
 * LivingTree — the EliteBox signature mark: a DadGPT-style "AI waveform ×
 * neural tree" that floats, breathes and pulses above the hero headline.
 *
 * Motion contract (from the motion reference, exact):
 *  - whole-tree float   4.6s  y 0 → -15px → 0        (cubic-bezier .76,0,.24,1)
 *  - glow breathing     3.4s  scale .94→1.08, opacity .45→.85 (alternate)
 *  - spine pulse        2.8s  height 116→142px, opacity .54→1
 *  - branch pulse       2.7s  scaleX .72→1.08, opacity .34→1, staggered
 *  - node pulse         2.2s  scale .86→1.25, opacity .35→1
 *
 * Recolored from the white/red reference to the lunar EliteBox identity:
 * right-hand branches glow ice cyan, left-hand branches glow violet — the
 * logo gradient rendered as a living organism. Branches mirror the reference
 * silhouette: crown branches sweep upward, root branches sweep downward.
 *
 * Accessibility: purely decorative (aria-hidden); the full reduced-motion
 * fallback lives in index.css (`@media (prefers-reduced-motion: reduce)`),
 * rendering a static, fully-formed tree with no animation.
 */
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type Branch = {
  /** width (length) px */ w: number;
  /** vertical offset from center px */ y: number;
  /** rotation deg (sign tuned per side for crown-up / roots-down) */ r: number;
  /** pulse stagger delay s */ d: number;
  side: 'l' | 'r';
  /** grow a small secondary twig at ~52% length */ twig?: boolean;
};

/** Ten branches — widths/offsets/staggers from the motion reference (.b1–.b10),
 *  mirrored left/right with rotation signs set for upward crown + downward roots. */
const BRANCHES: Branch[] = [
  { w: 78, y: -58, r: -16, d: -0.2, side: 'r' },
  { w: 104, y: -35, r: 10, d: -0.8, side: 'l', twig: true },
  { w: 62, y: -12, r: -8, d: -1.4, side: 'r' },
  { w: 92, y: 16, r: -14, d: -0.55, side: 'l', twig: true },
  { w: 68, y: 42, r: 13, d: -1.1, side: 'r' },
  { w: 88, y: 59, r: -16, d: -0.35, side: 'l' },
  { w: 110, y: 36, r: 10, d: -1.25, side: 'r', twig: true },
  { w: 70, y: 10, r: -8, d: -0.7, side: 'l' },
  { w: 96, y: -18, r: -14, d: -1.6, side: 'r', twig: true },
  { w: 74, y: -44, r: 12, d: -0.95, side: 'l' },
];

/** Waveform rungs crossing the spine — the "AI waveform" half of the hybrid. */
const RUNGS = [
  { top: '24%', w: 13, d: -0.3 },
  { top: '35%', w: 22, d: -1.1 },
  { top: '47%', w: 15, d: -1.9 },
  { top: '58%', w: 24, d: -0.7 },
  { top: '69%', w: 12, d: -1.5 },
  { top: '80%', w: 18, d: -2.3 },
];

/** Free-floating motes around the tree (reference nodes n1–n4). */
const FREE_NODES = [
  { left: '48%', top: '14%', d: -0.5 },
  { left: '58%', top: '38%', d: -1.3 },
  { left: '38%', top: '60%', d: -1.8 },
  { left: '54%', top: '82%', d: -0.9 },
];

export default function LivingTree({ className }: { className?: string }) {
  return (
    <div className={cn('living-tree', className)} aria-hidden="true">
      <div className="lt-glow" />
      <span className="lt-spine" />
      {RUNGS.map((rung) => (
        <span
          key={rung.top}
          className="lt-rung"
          style={{ top: rung.top, width: rung.w, '--d': `${rung.d}s` } as CSSProperties}
        />
      ))}
      {FREE_NODES.map((n) => (
        <span
          key={`${n.left}-${n.top}`}
          className="lt-free-node"
          style={{ left: n.left, top: n.top, '--d': `${n.d}s` } as CSSProperties}
        />
      ))}
      {BRANCHES.map((b, i) => (
        <span
          key={i}
          className={cn('lt-branch', b.side)}
          style={
            {
              '--w': `${b.w}px`,
              '--y': `${b.y}px`,
              '--r': `${b.r}deg`,
              '--d': `${b.d}s`,
            } as CSSProperties
          }
        >
          {b.twig && <span className="lt-twig" />}
          <span className="lt-node" />
        </span>
      ))}
    </div>
  );
}
