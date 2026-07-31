/**
 * App Home — /app (app-home.md).
 * Hero carousel (auto-rotate 7s, crossfade + parallax drift, 3D-tilt featured
 * card) + living shelves: Continue Watching, Trending Now, Elitebox
 * Exclusives, My Library, Smart Collections. All real data: continue-watching
 * and library from the profile store, catalogs from the addon engine.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BookmarkCheck,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  Play,
  Shuffle,
} from 'lucide-react';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import Shelf from '@/components/Shelf';
import ForYouShelf from '@/components/ForYouShelf';
import { ButtonGhost, ButtonNeon, ButtonPrimary, spring, toast } from '@/components/ui-elite';
import { COLLECTIONS, useCatalogItems } from '@/pages/app/Discover';
import { selectProgress, useLibrary } from '@/lib/store';
import type { ContinueWatchingEntry } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const EXCLUSIVE_IDS = ['cosmos-laundromat', 'charge', 'wing-it', 'sprite-fright'];

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function metaFor(items: MetaItem[], id: string): MetaItem | undefined {
  return items.find((m) => m.id === id);
}

/* ── S1 — Hero carousel ────────────────────────────────────────────────── */

function HeroCarousel({ items }: { items: MetaItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);
  const continueWatching = useLibrary((s) => s.continueWatching);
  const watchlist = useLibrary((s) => s.watchlist);
  const toggleWatchlist = useLibrary((s) => s.toggleWatchlist);
  const catalog = useCatalogItems().items;

  const count = items.length;
  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  // 7s auto-rotate; pauses on hover/focus/interaction; off under reduced motion.
  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => window.clearInterval(t);
  }, [reduceMotion, paused, count]);

  // Swipe left/right on touch (velocity 300).
  const onDragEnd = (_: unknown, info: { velocity: { x: number }; offset: { x: number } }) => {
    if (Math.abs(info.velocity.x) > 300 || Math.abs(info.offset.x) > 80) {
      go(info.offset.x < 0 ? 1 : -1);
      setPaused(true);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
      setPaused(true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
      setPaused(true);
    }
  };

  if (count === 0) return null;
  const item = items[index];
  const entry = continueWatching.find((e) => e.id === item.id);
  const resume = entry && entry.durationSec > 0 ? entry.progressSec / entry.durationSec : undefined;
  const saved = watchlist.includes(item.id);

  const surprise = () => {
    const pool = catalog.filter((m) => m.type !== 'channel');
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/app/detail/${pick.type}/${pick.id}`);
  };

  const crossfade = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <section
      ref={stageRef}
      aria-roledescription="carousel"
      aria-label="Featured titles"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group/hero focusable relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl outline-none md:h-[72vh]"
    >
      {/* backdrop crossfade + parallax drift */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={item.id}
          className="absolute inset-0"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40, scale: 1.05 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={crossfade}
          drag={reduceMotion ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={onDragEnd}
        >
          <img
            src={item.backdrop ?? item.poster}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
        </motion.div>
      </AnimatePresence>
      {/* darkened left 55% → transparent right + bottom fade to deep */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(3,6,18,.92)] via-[rgba(3,6,18,.55)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(3,6,18,.95)] to-transparent" />

      {/* content, bottom-left anchored */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-16 p-24 pb-48 md:p-48 md:pb-64 max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div key={item.id} className="flex flex-col gap-12">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-micro uppercase tracking-[0.3em] text-cyan"
            >
              Trending #{index + 1}
            </motion.p>
            <h1 className="font-display text-display-xl">
              {item.name.split(' ').map((w, i) => (
                <motion.span
                  key={`${item.id}-${i}`}
                  className="text-chrome inline-block will-change-transform"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ ...spring.cinematic, delay: 0.05 + i * 0.03 }}
                >
                  {w}
                  {i < item.name.split(' ').length - 1 ? ' ' : ''}
                </motion.span>
              ))}
            </h1>
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: 0.16 }}
              className="flex flex-wrap items-center gap-8 text-caption text-muted"
            >
              {item.year && <span>{item.year}</span>}
              {item.runtime && <span>· {item.runtime} min</span>}
              {item.rating && <span className="inline-flex items-center gap-3">· <Star size={11} strokeWidth={1.75} fill="currentColor" className="text-warn" /> {item.rating.toFixed(1)}</span>}
              <span className="flex gap-6">
                {item.genres.slice(0, 3).map((g) => (
                  <span key={g} className="glass-1 rounded-full px-10 py-2 text-micro uppercase text-muted">
                    {g}
                  </span>
                ))}
              </span>
            </motion.div>
            <motion.p
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: 0.24 }}
              className="text-base text-muted leading-relaxed line-clamp-2"
            >
              {item.description}
            </motion.p>
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: 0.32 }}
              className="flex flex-wrap items-center gap-12"
            >
              <ButtonPrimary to={`/app/player/${item.type}/${item.id}`}>
                <Play size={16} strokeWidth={1.75} fill="currentColor" />
                {resume ? `Resume ${fmtClock(entry!.progressSec)}` : 'Play'}
              </ButtonPrimary>
              <ButtonNeon to={`/app/detail/${item.type}/${item.id}`}>Details</ButtonNeon>
              <button
                type="button"
                aria-pressed={saved}
                title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                onClick={() => {
                  toggleWatchlist(item.id);
                  toast(saved ? `Removed “${item.name}” from Watchlist` : `Added “${item.name}” to Watchlist`);
                }}
                className={cn(
                  'focusable inline-flex cursor-pointer items-center gap-8 rounded-full px-16 py-12 text-caption font-semibold transition-colors',
                  saved ? 'text-cyan' : 'text-muted hover:text-ink hover:bg-white/[.06]',
                )}
              >
                {saved ? <BookmarkCheck size={18} strokeWidth={1.75} /> : <BookmarkPlus size={18} strokeWidth={1.75} />}
                <span className="hidden sm:inline">{saved ? 'In Watchlist' : '+ Watchlist'}</span>
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* featured poster card (signature 3D tilt, xl+) */}
      <div className="absolute bottom-64 right-48 hidden xl:block">
        <motion.div
          animate={reduceMotion ? undefined : { y: [-6, 6] }}
          transition={reduceMotion ? undefined : { repeat: Infinity, repeatType: 'mirror', duration: 3, ease: 'easeInOut' }}
          className="drop-shadow-[0_0_20px_rgba(139,124,232,.35)]"
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={spring.cinematic}
            >
              <PosterCard item={item} className="xl:w-[220px]" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* chevrons (desktop hover reveal) */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous featured title"
            onClick={() => {
              go(-1);
              setPaused(true);
            }}
            className="focusable glass-2 absolute left-16 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full p-8 text-ink opacity-0 transition-opacity duration-150 hover:shadow-glow-neon group-hover/hero:opacity-100 md:block"
          >
            <ChevronLeft size={20} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next featured title"
            onClick={() => {
              go(1);
              setPaused(true);
            }}
            className="focusable glass-2 absolute right-16 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full p-8 text-ink opacity-0 transition-opacity duration-150 hover:shadow-glow-neon group-hover/hero:opacity-100 md:block"
          >
            <ChevronRight size={20} strokeWidth={1.75} />
          </button>
        </>
      )}

      {/* dots + Surprise Me */}
      <div className="absolute bottom-16 right-24 flex items-center gap-12 md:right-48">
        <ButtonGhost onClick={surprise} className="glass-1">
          <Shuffle size={16} strokeWidth={1.75} /> Surprise me
        </ButtonGhost>
        {count > 1 && (
          <div className="flex items-center gap-8" role="tablist" aria-label="Featured slides">
            {items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${m.name}`}
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                }}
                className="focusable relative flex h-16 cursor-pointer items-center"
              >
                {i === index ? (
                  <motion.span
                    layoutId="hero-dot-pill"
                    transition={spring.snappy}
                    className="block h-6 w-24 rounded-full bg-cyan shadow-glow-neon"
                  />
                ) : (
                  <span className="block h-6 w-6 rounded-full bg-white/30 hover:bg-white/60" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── S2 — Continue Watching ────────────────────────────────────────────── */

function ContinueWatchingCard({
  entry,
  item,
  onRemove,
}: {
  entry: ContinueWatchingEntry;
  item: MetaItem;
  onRemove: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const progress = entry.durationSec > 0 ? entry.progressSec / entry.durationSec : 0;
  const remainMin = Math.max(1, Math.round((entry.durationSec - entry.progressSec) / 60));

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  return (
    <motion.div
      layout="position"
      exit={{ opacity: 0, width: 0, marginRight: -16 }}
      transition={spring.smooth}
      className="w-[280px] shrink-0 snap-start md:w-[320px]"
    >
      <div className="group/cw relative overflow-hidden rounded-lg ring-1 ring-white/[.08] bg-navy">
        <Link
          to={`/app/player/${entry.type}/${entry.id}`}
          aria-label={`Resume ${item.name} — ${remainMin} min left`}
          className="focusable block aspect-video"
        >
          <img
            src={item.backdrop ?? item.poster}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/cw:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.92)] via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/cw:opacity-100">
            <span className="glass-3 flex h-48 w-48 items-center justify-center rounded-full">
              <Play size={20} strokeWidth={1.75} fill="currentColor" className="text-cyan" />
            </span>
          </div>
          <div className="absolute bottom-24 left-12 right-12 flex items-end justify-between gap-8">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="truncate text-caption text-ink">{item.name}</span>
              <span className="glass-1 inline-flex w-fit items-center gap-4 rounded-md px-8 py-2 text-micro uppercase text-cyan">
                <Clock3 size={12} strokeWidth={1.75} /> {remainMin} min left
              </span>
            </div>
          </div>
          {/* resume progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-3 bg-white/[.08]">
            <motion.div
              className="h-full bg-signature"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, progress * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </Link>

        {/* context menu */}
        <div ref={menuRef} className="absolute right-8 top-8">
          <button
            type="button"
            aria-label={`Options for ${item.name}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="focusable glass-1 cursor-pointer rounded-full p-6 text-muted hover:text-ink"
          >
            <MoreHorizontal size={16} strokeWidth={1.75} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={spring.snappy}
                className="glass-2 absolute right-0 top-full z-40 mt-6 flex min-w-[170px] flex-col gap-2 rounded-xl p-6"
              >
                <Link
                  to={`/app/player/${entry.type}/${entry.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="focusable rounded-lg px-12 py-8 text-left text-caption font-semibold text-ink hover:bg-white/[.06]"
                >
                  Resume
                </Link>
                <Link
                  to={`/app/detail/${entry.type}/${entry.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="focusable rounded-lg px-12 py-8 text-left text-caption font-semibold text-ink hover:bg-white/[.06]"
                >
                  View details
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(entry.id);
                  }}
                  className="focusable cursor-pointer rounded-lg px-12 py-8 text-left text-caption font-semibold text-error hover:bg-white/[.06]"
                >
                  Remove from row
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ContinueWatchingSection({ items }: { items: MetaItem[] }) {
  const continueWatching = useLibrary((s) => s.continueWatching);
  const clearProgress = useLibrary((s) => s.clearProgress);

  const rows = continueWatching
    .map((e) => ({ entry: e, item: metaFor(items, e.id) }))
    .filter((r): r is { entry: ContinueWatchingEntry; item: MetaItem } => Boolean(r.item))
    .slice(0, 12);

  if (rows.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={spring.smooth}
      className="flex flex-col gap-16"
    >
      <h2 className="font-display text-title text-ink">Continue Watching</h2>
      <div className="shelf-fade-x no-scrollbar -mx-16 flex gap-16 overflow-x-auto overscroll-x-contain px-16 py-8 snap-x snap-mandatory md:-mx-24 md:px-24 xl:-mx-48 xl:px-48">
        <AnimatePresence mode="popLayout">
          {rows.map(({ entry, item }) => (
            <ContinueWatchingCard
              key={entry.id}
              entry={entry}
              item={item}
              onRemove={(id) => {
                clearProgress(id);
                toast('Removed from Continue Watching');
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/* ── S3 — Trending Now (chrome outline rank numerals) ──────────────────── */

function TrendingSection({ items }: { items: MetaItem[] }) {
  const trending = useMemo(
    () =>
      items
        .filter((m) => m.type === 'movie')
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 10),
    [items],
  );
  if (trending.length === 0) return null;
  return (
    <section className="flex flex-col gap-16">
      <div className="flex items-baseline justify-between gap-16">
        <h2 className="font-display text-title text-ink">Trending Now</h2>
        <Link
          to="/app/discover?sort=trending"
          className="focusable rounded-full px-8 py-4 text-caption font-semibold text-muted hover:text-cyan transition-colors"
        >
          See all <ArrowRight size={14} strokeWidth={1.75} className="inline" />
        </Link>
      </div>
      <div className="shelf-fade-x no-scrollbar -mx-16 flex gap-16 overflow-x-auto overscroll-x-contain px-16 py-8 snap-x snap-mandatory md:-mx-24 md:px-24 xl:-mx-48 xl:px-48">
        {trending.map((item, i) => (
          <motion.div
            key={item.id}
            className="relative snap-start pl-40"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring.smooth, delay: Math.min(i, 8) * 0.05 }}
          >
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.05 + 0.2 }}
              className="font-display pointer-events-none absolute bottom-8 left-0 z-0 select-none text-[88px] font-extrabold leading-none"
              style={{ WebkitTextStroke: '1.5px rgba(192,192,192,.75)', color: 'transparent' }}
            >
              {i + 1}
            </motion.span>
            <div className="relative z-10">
              <PosterCard item={item} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── S3.5 — Upcoming & Originals (wide cinematic cards, coming soon) ───── */

function UpcomingSection({ items }: { items: MetaItem[] }) {
  const upcoming = useMemo(() => items.filter((m) => m.upcoming), [items]);
  if (upcoming.length === 0) return null;
  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-wrap items-baseline justify-between gap-16">
        <h2 className="font-display text-title text-ink">Upcoming &amp; Originals</h2>
        <span className="text-micro uppercase text-muted">Elitebox Originals · in preparation</span>
      </div>
      <div className="grid gap-16 md:grid-cols-2">
        {upcoming.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring.smooth, delay: Math.min(i, 4) * 0.08 }}
          >
            <Link
              to={`/app/detail/${item.type}/${item.id}`}
              aria-label={`${item.name} — ${item.releaseLabel ?? 'Coming soon'} · Elitebox Original`}
              className="focusable group/up relative block aspect-video overflow-hidden rounded-xl ring-1 ring-white/[.1] bg-navy hover:shadow-focus-glow focus-visible:shadow-focus-glow"
            >
              <img
                src={item.backdrop ?? item.poster}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 group-hover/up:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.92)] via-[rgba(3,6,18,.22)] to-transparent" />
              <span className="absolute left-12 top-12 inline-flex items-center gap-6 rounded-full bg-deep/70 px-12 py-6 text-micro uppercase tracking-wider text-cyan ring-1 ring-cyan/50 backdrop-blur-sm">
                <Sparkles size={12} strokeWidth={1.75} />
                {item.releaseLabel ?? 'Coming soon'}
              </span>
              <div className="absolute bottom-14 left-16 right-16 flex flex-col gap-4">
                <span className="font-display text-title text-chrome">{item.name}</span>
                <span className="text-micro uppercase text-muted">
                  Elitebox Original · {item.genres.slice(0, 2).join(' · ')}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── S4 — Elitebox Exclusives (16:9 backdrop cards) ────────────────────── */

function ExclusivesSection({ items }: { items: MetaItem[] }) {
  const exclusives = EXCLUSIVE_IDS.map((id) => metaFor(items, id)).filter(
    (m): m is MetaItem => Boolean(m),
  );
  if (exclusives.length === 0) return null;
  return (
    <section className="flex flex-col gap-16">
      <h2 className="font-display text-title text-ink">Elitebox Exclusives</h2>
      <div className="shelf-fade-x no-scrollbar -mx-16 flex gap-16 overflow-x-auto overscroll-x-contain px-16 py-8 snap-x snap-mandatory md:-mx-24 md:px-24 xl:-mx-48 xl:px-48">
        {exclusives.map((item, i) => (
          <motion.div
            key={item.id}
            className="w-[320px] shrink-0 snap-start"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring.smooth, delay: Math.min(i, 6) * 0.06 }}
          >
            <Link
              to={`/app/detail/${item.type}/${item.id}`}
              aria-label={`${item.name} — Elitebox Exclusive`}
              className="focusable group/ex relative block aspect-video overflow-hidden rounded-lg ring-1 ring-white/[.08] bg-navy hover:shadow-focus-glow focus-visible:shadow-focus-glow"
            >
              <img
                src={item.backdrop ?? item.poster}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/ex:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.9)] via-transparent to-transparent" />
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...spring.snappy, delay: Math.min(i, 6) * 0.06 + 0.15 }}
                className="glass-1 absolute left-8 top-8 rounded-md px-8 py-2 text-micro uppercase text-gradient-signature"
              >
                Exclusive
              </motion.span>
              <div className="absolute bottom-10 left-12 right-12 flex flex-col gap-2">
                <span className="text-caption text-ink">{item.name}</span>
                <span className="text-micro uppercase text-muted">
                  {item.year} · {item.genres.slice(0, 2).join(' · ')}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── S6 — Smart Collections ────────────────────────────────────────────── */

function CollectionsSection({ items }: { items: MetaItem[] }) {
  const collections = COLLECTIONS.map((c) => ({ def: c, matches: items.filter(c.match) })).filter(
    (c) => c.matches.length >= 3,
  );
  if (collections.length === 0) return null;
  return (
    <section className="flex flex-col gap-16">
      <h2 className="font-display text-title text-ink">Made for you</h2>
      <div className="shelf-fade-x no-scrollbar -mx-16 flex gap-16 overflow-x-auto overscroll-x-contain px-16 py-8 snap-x snap-mandatory md:-mx-24 md:px-24 xl:-mx-48 xl:px-48">
        {collections.map(({ def, matches }, i) => (
          <motion.div
            key={def.id}
            className="w-[320px] shrink-0 snap-start"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring.smooth, delay: Math.min(i, 6) * 0.07 }}
          >
            <Link
              to={`/app/discover?collection=${def.id}`}
              aria-label={`${def.name} — ${matches.length} titles · ${def.caption}`}
              className="focusable glass-2 group/col relative block aspect-video overflow-hidden rounded-lg hover:shadow-focus-glow focus-visible:shadow-focus-glow"
            >
              {/* 3 mini-poster collage, fans out on hover */}
              <div className="absolute inset-0 flex items-center justify-center">
                {matches.slice(0, 3).map((m, j) => (
                  <img
                    key={m.id}
                    src={m.poster}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className={cn(
                      'h-4/5 rounded-md object-cover shadow-panel ring-1 ring-white/[.1] transition-transform duration-300',
                      j === 0 && '-rotate-[4deg] group-hover/col:-rotate-[8deg] group-hover/col:-translate-x-16',
                      j === 1 && 'z-10 -mx-24 h-[88%]',
                      j === 2 && 'rotate-[4deg] group-hover/col:rotate-[8deg] group-hover/col:translate-x-16',
                    )}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.95)] via-[rgba(3,6,18,.35)] to-transparent" />
              <div className="absolute bottom-10 left-12 right-12 flex flex-col gap-2">
                <span className="font-display text-title text-ink">{def.name}</span>
                <span className="text-micro uppercase text-cyan">
                  {matches.length} titles · {def.caption}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function AppHome() {
  const { items, loading } = useCatalogItems();
  const watchlist = useLibrary((s) => s.watchlist);
  const favorites = useLibrary((s) => s.favorites);

  const heroItems = useMemo(
    () =>
      items
        .filter((m) => m.type === 'movie' && m.backdrop)
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        .slice(0, 5),
    [items],
  );

  const libraryItems = useMemo(() => {
    const ids = [...favorites, ...watchlist.filter((id) => !favorites.includes(id))];
    return ids.map((id) => metaFor(items, id)).filter((m): m is MetaItem => Boolean(m));
  }, [items, watchlist, favorites]);

  const progressFor = useCallback(
    (id: string) => selectProgress(useLibrary.getState(), id),
    [],
  );

  return (
    <div className="flex flex-col gap-48 pb-48 pt-16">
      {/* hero renders from the bundled showcase cache even while loading */}
      {loading && heroItems.length === 0 ? (
        <div className="glass-1 relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl md:h-[72vh]" aria-hidden>
          <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-white/[.06] to-transparent [animation-duration:1.4s]" />
        </div>
      ) : (
        <HeroCarousel items={heroItems} />
      )}

      <ContinueWatchingSection items={items} />
      <ForYouShelf items={items} lookup={(id) => metaFor(items, id)} />
      <TrendingSection items={items} />
      <ExclusivesSection items={items} />

      {/* S5 — My Library (hidden entirely when empty) */}
      {libraryItems.length > 0 && (
        <Shelf
          title={`My Library · ${libraryItems.length}`}
          items={libraryItems}
          seeAllTo="/app/library"
          progressFor={progressFor}
        />
      )}

      <CollectionsSection items={items} />

      {/* S7 — app footer strip */}
      <footer className="mt-32 border-t border-[rgba(124,217,236,.15)] pt-24">
        <div className="flex flex-wrap items-center gap-16">
          <span className="font-mono text-micro uppercase text-muted">Elitebox v1.0.0</span>
          <span className="inline-flex items-center gap-6 text-micro uppercase text-muted">
            <span className="inline-block h-6 w-6 rounded-full bg-ok shadow-[0_0_8px_rgba(124,217,236,.7)]" />
            Showcase addon · healthy
          </span>
          <ButtonGhost to="/app/settings" className="ml-auto">
            Settings
          </ButtonGhost>
        </div>
      </footer>
    </div>
  );
}
