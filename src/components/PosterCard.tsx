/**
 * Poster card (design.md §10.4): 2:3 art (16:9 for live channels), pointer-
 * tracked 3D tilt (max 8°, perspective 900px) with glare highlight, Focus
 * glow, corner badges (HD / LIVE), resume progress bar, gradient scrim with
 * title + meta. Click → /app/detail/:type/:id.
 */
import { memo, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Badge, spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import type { MetaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const TILT_MAX = 8;

interface PosterCardProps {
  item: MetaItem;
  /** 0–1 resume progress; renders the cyan bar at the bottom edge */
  progress?: number;
  className?: string;
}

const PosterCard = memo(function PosterCard({ item, progress, className }: PosterCardProps) {
  const { t } = useT();
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const sRotateX = useSpring(rotateX, { stiffness: 260, damping: 30 });
  const sRotateY = useSpring(rotateY, { stiffness: 260, damping: 30 });
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18) 0%, transparent 55%)`;

  const wide = item.type === 'channel';

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * TILT_MAX);
    rotateX.set(-(py - 0.5) * 2 * TILT_MAX);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  const meta = [
    item.upcoming ? (item.releaseLabel ?? t('app.poster.comingSoon')) : item.year,
    item.type === 'channel'
      ? t('app.poster.channel')
      : item.type === 'series'
        ? t('app.poster.series')
        : t('app.poster.film'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.div
      className={cn('shrink-0', wide ? 'w-[320px] xl:w-[380px]' : 'w-128 md:w-160 xl:w-[200px]', className)}
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.05 }}
      whileFocus={reduceMotion ? undefined : { y: -6, scale: 1.05 }}
      transition={spring.smooth}
      style={{ perspective: 900 }}
    >
      <Link
        ref={ref}
        to={`/app/detail/${item.type}/${item.id}`}
        className={cn(
          'focusable group relative block overflow-hidden rounded-lg ring-1 ring-white/[.08] bg-navy',
          wide ? 'aspect-video' : 'aspect-[2/3]',
          'hover:shadow-focus-glow focus-visible:shadow-focus-glow',
        )}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <motion.div
          className="absolute inset-0"
          style={{ rotateX: sRotateX, rotateY: sRotateY, transformStyle: 'preserve-3d' }}
        >
          <img
            src={item.poster}
            alt={t('app.poster.posterAlt', {
              name: `${item.name}${item.year ? ` (${item.year})` : ''}`,
            })}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
          />
          {/* glare highlight following cursor */}
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms]"
            style={{ background: glare }}
          />
          {/* bottom gradient scrim */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[rgba(3,6,18,.92)] via-[rgba(3,6,18,.45)] to-transparent" />
        </motion.div>

        {/* corner badges */}
        <div className="absolute left-8 top-8 flex gap-6">
          {item.upcoming ? (
            <span className="rounded-full bg-deep/70 px-10 py-4 text-micro uppercase tracking-wider text-cyan ring-1 ring-cyan/50 backdrop-blur-sm">
              {t('app.poster.soon')}
            </span>
          ) : item.live ? (
            <Badge kind="LIVE" />
          ) : (
            <Badge kind="HD" />
          )}
        </div>

        {/* title + meta */}
        <div className="absolute inset-x-10 bottom-10 flex flex-col gap-2">
          <span className="text-caption text-ink leading-tight line-clamp-2">{item.name}</span>
          <span className="text-micro uppercase text-muted">{meta}</span>
        </div>

        {/* resume progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-3 bg-white/[.08]">
            <div
              className="h-full bg-signature"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
        )}
      </Link>
    </motion.div>
  );
});

export default PosterCard;
