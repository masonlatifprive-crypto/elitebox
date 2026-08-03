/**
 * Shelf (design.md §10.5): horizontal snap rail with edge fade masks, glass
 * chevron scroll buttons on hover (desktop), staggered entrance, TV spatial
 * focus enlargement handled by the \'focusable\' contract (tvnav.ts).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import type { MetaItem } from '@/lib/types';
import { spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface ShelfProps {
  title?: string;
  items: MetaItem[];
  seeAllTo?: string;
  progressFor?: (id: string) => number | undefined;
  autoScroll?: boolean;
  className?: string;
}

export default function Shelf({ title, items, seeAllTo, progressFor, autoScroll, className }: ShelfProps) {
  const { t } = useT();
  const railRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir: 'left' | 'right') => {
    if (!railRef.current) return;
    const amount = railRef.current.clientWidth * 0.8;
    railRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const check = () => {
      setShowLeft(el.scrollLeft > 10);
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };
    el.addEventListener('scroll', check);
    check();
    return () => el.removeEventListener('scroll', check);
  }, [items]);

  return (
    <section className={cn("space-y-4 py-4", className)}>
      {(title || seeAllTo) && (
        <div className="flex items-center justify-between px-8">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {seeAllTo && (
            <Link to={seeAllTo} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('common.seeAll')}
            </Link>
          )}
        </div>
      )}

      <div className="group relative">
        <AnimatePresence>
          {showLeft && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="bg-background/80 backdrop-blur-md p-2 rounded-full border shadow-xl">
                <ChevronLeft className="w-6 h-6" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <div
          ref={railRef}
          className="flex gap-4 overflow-x-auto px-8 no-scrollbar scroll-smooth"
        >
          {items.map((item) => (
            <div key={item.id} className="flex-none w-[200px] md:w-[240px]">
              <PosterCard item={item} progress={progressFor?.(item.id)} />
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showRight && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="bg-background/80 backdrop-blur-md p-2 rounded-full border shadow-xl">
                <ChevronRight className="w-6 h-6" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
