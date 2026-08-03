/**
 * PosterCard (design.md §10.2): standard portrait tile (2:3) with
 * hover-glow, progress bar for resumed items, and TV focus scale.
 */
import { memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { spring } from '@/components/ui-elite';

interface PosterCardProps {
  item: MetaItem;
  /** 0 to 1 */
  progress?: number;
  /** priority loading for above-the-fold posters */
  priority?: boolean;
}

const PosterCard = memo(({ item, progress, priority }: PosterCardProps) => {
  const { t } = useT();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileFocus={{ scale: 1.05 }}
      transition={spring}
      className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-lg focus-within:ring-2 focus-within:ring-primary focus:outline-none"
      onMouseMove={onMouseMove}
    >
      <Link
        to={item.type === 'movie' ? `/app/movie/${item.id}` : `/app/tv/${item.id}`}
        className="absolute inset-0 z-10"
        aria-label={item.title}
      />

      <motion.div
        className="pointer-events-none absolute -inset-px z-30 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--primary-rgb), 0.15),
              transparent 80%
            )
          `,
        }}
      />

      <img
        src={item.poster_path}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 translate-y-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Play className="h-4 w-4 fill-current" />
          </div>
          <p className="font-medium text-white truncate shadow-sm">{item.title}</p>
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-40 h-1 bg-white/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]"
          />
        </div>
      )}
    </motion.div>
  );
});

PosterCard.displayName = 'PosterCard';

export default PosterCard;
