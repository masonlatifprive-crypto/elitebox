/**
 * Shelf (design.md §10.5): horizontal snap rail with edge fade masks, glass
 * chevron scroll buttons on hover (desktop), staggered entrance, TV spatial
 * focus enlargement handled by the `focusable` contract (tvnav.ts).
 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import type { MetaItem } from '@/lib/types';
import { spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface ShelfProps {
  /** omit when the surrounding section renders its own header */
  title?: string;
  items: MetaItem[];
  seeAllTo?: string;
  /** per-item resume progress lookup (0–1) */
  progressFor?: (id: string) => number | undefined;
  /** slow auto-drift (0.5px/frame) after 4s idle; pauses on interaction */
  autoScroll?: boolean;
  className?: string;
}

export default function Shelf({ title, items, seeAllTo, progressFor, autoScroll, className }: ShelfProps) {
  const { t } = useT();
  const railRef = useRef<HTMLDivElement>(null);

  // Idle auto-scroll (home.md S2): 0.5px/frame after 4s idle, pause on
  // hover/focus/touch, wrap around at the end.
  useEffect(() => {
    const rail = railRef.current;
    if (!autoScroll || !rail) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let idleTimer = 0;
    let paused = true;
    const tick = () => {
      if (!paused) {
        rail.scrollLeft += 0.5;
        if (rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1) rail.scrollLeft = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      paused = true;
      window.clearTimeout(idleTimer);
    };
    const arm = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        paused = false;
      }, 4000);
    };
    const interact = () => {
      pause();
      arm();
    };
    arm();
    raf = requestAnimationFrame(tick);
    const interactEvents = ['pointerdown', 'focusin', 'touchstart', 'wheel'] as const;
    interactEvents.forEach((ev) => rail.addEventListener(ev, interact, { passive: true }));
    rail.addEventListener('pointerenter', pause);
    rail.addEventListener('pointerleave', arm);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      interactEvents.forEach((ev) => rail.removeEventListener(ev, interact));
      rail.removeEventListener('pointerenter', pause);
      rail.removeEventListener('pointerleave', arm);
    };
  }, [autoScroll]);

  const scrollByCards = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(':scope > *');
    const step = card ? (card.offsetWidth + 16) * 3 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section className={cn('group/shelf relative flex flex-col gap-16', className)}>
      {(title || seeAllTo) && (
      <div className="flex items-baseline justify-between gap-16 px-16 md:px-24">
        {title && <h2 className="font-display text-title text-ink">{title}</h2>}
        {seeAllTo && (
          <Link
            to={seeAllTo}
            className="focusable rounded-full px-8 py-4 text-caption font-semibold text-muted hover:text-cyan transition-colors"
          >
            {t('app.shelf.seeAll')} <ArrowRight size={14} strokeWidth={1.75} className="inline" />
          </Link>
        )}
      </div>
      )}

      <div className="relative">
        <div
          ref={railRef}
          className="shelf-fade-x no-scrollbar flex gap-16 overflow-x-auto overscroll-x-contain scroll-smooth px-24 py-8 snap-x snap-mandatory"
        >
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className="snap-start"
              initial={{ opacity: 0, y: 40, rotateY: 6 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...spring.smooth, delay: Math.min(i, 8) * 0.05 }}
            >
              <PosterCard item={item} progress={progressFor?.(item.id)} />
            </motion.div>
          ))}
        </div>

        {/* chevron scroll buttons (desktop hover) */}
        <button
          type="button"
          aria-label={t('app.shelf.scrollLeft', { name: title ?? t('app.shelf.shelfFallback') })}
          onClick={() => scrollByCards(-1)}
          className="focusable glass-2 absolute left-8 top-1/2 hidden -translate-y-1/2 rounded-full p-8 text-ink opacity-0 transition-opacity duration-150 hover:shadow-glow-neon group-hover/shelf:opacity-100 md:block cursor-pointer"
        >
          <ChevronLeft size={20} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label={t('app.shelf.scrollRight', { name: title ?? t('app.shelf.shelfFallback') })}
          onClick={() => scrollByCards(1)}
          className="focusable glass-2 absolute right-8 top-1/2 hidden -translate-y-1/2 rounded-full p-8 text-ink opacity-0 transition-opacity duration-150 hover:shadow-glow-neon group-hover/shelf:opacity-100 md:block cursor-pointer"
        >
          <ChevronRight size={20} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}
