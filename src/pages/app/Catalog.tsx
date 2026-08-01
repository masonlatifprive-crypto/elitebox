/**
 * Movies & Series — /app/movies and /app/series (movies-series.md).
 * One template, two personalities. The `kind` prop selects the type filter:
 * <Catalog kind="movie" /> or <Catalog kind="series" />.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookmarkCheck, BookmarkPlus, LayoutGrid, List, Play, Rows3, Star } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import { ButtonGhost, ButtonPrimary, EmptyState, spring, toast } from '@/components/ui-elite';
import type { SortOption } from '@/pages/app/Discover';
import { FilterChip, SORT_OPTIONS, SkeletonGrid, SortControl, useCatalogItems } from '@/pages/app/Discover';
import { scopedKey, useLibrary } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const CONFIG = {
  movie: {
    eyebrowKey: 'app.rail.movies',
    headlineKey: 'app.catalog.headlineMovies',
    featured: ['sintel', 'tears-of-steel', 'charge'],
    other: { kind: 'series' as const, labelKey: 'app.catalog.switchToSeries', to: '/app/series', ctaKey: 'app.catalog.allSeries' },
    emptyTitleKey: 'app.catalog.emptyMovies',
    emptyLink: { to: '/app/series', labelKey: 'app.catalog.browseSeries' },
  },
  series: {
    eyebrowKey: 'app.rail.series',
    headlineKey: 'app.catalog.headlineSeries',
    featured: ['caminandes-series', 'caminandes-2', 'caminandes-3'],
    other: { kind: 'movie' as const, labelKey: 'app.catalog.switchToMovies', to: '/app/movies', ctaKey: 'app.catalog.allMovies' },
    emptyTitleKey: 'app.catalog.emptySeries',
    emptyLink: { to: '/app/movies', labelKey: 'app.catalog.browseMovies' },
  },
} as const;

const CATALOG_SORTS: SortOption[] = [
  SORT_OPTIONS[0], // trending
  SORT_OPTIONS[2], // A–Z
  SORT_OPTIONS[3], // year ↓
  {
    id: 'duration',
    labelKey: 'app.sort.duration',
    cmp: (a, b) => (a.runtime ?? 999) - (b.runtime ?? 999),
  },
];

const PAGE = 24;

/* ── S1 — type hero strip (36vh, 10s crossfade + Ken Burns) ────────────── */

function HeroStrip({ kind, featured }: { kind: 'movie' | 'series'; featured: MetaItem[] }) {
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const cfg = CONFIG[kind];

  useEffect(() => {
    if (reduceMotion || featured.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % featured.length), 10_000);
    return () => window.clearInterval(t);
  }, [reduceMotion, featured.length]);

  if (featured.length === 0) return null;
  const item = featured[index];

  return (
    <section
      aria-label={t('app.catalog.featuredAria', { kind: t(cfg.eyebrowKey).toLowerCase() })}
      className="relative h-[36vh] min-h-[280px] overflow-hidden rounded-2xl"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={item.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
        >
          <motion.img
            src={item.backdrop ?? item.poster}
            alt=""
            draggable={false}
            className="h-full w-full object-cover brightness-[.6]"
            initial={{ scale: 1 }}
            animate={reduceMotion ? undefined : { scale: 1.04 }}
            transition={{ duration: 12, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--deep)] via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-8 p-24 md:p-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring.smooth}
            className="flex flex-col gap-8"
          >
            <p className="text-micro uppercase tracking-[0.3em] text-cyan">{t(cfg.eyebrowKey)}</p>
            <h1 className="font-display text-display-xl text-ink">{t(cfg.headlineKey)}</h1>
            <p className="text-caption text-muted">
              {t('app.catalog.featuring')} <span className="text-ink">{item.name}</span>
              {item.year ? ` · ${item.year}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-12">
              <ButtonPrimary to={`/app/player/${item.type}/${item.id}`} className="px-16 py-8">
                <Play size={14} strokeWidth={1.75} fill="currentColor" /> {t('app.catalog.playFeatured')}
              </ButtonPrimary>
              <ButtonGhost to={`/app/detail/${item.type}/${item.id}`}>{t('app.catalog.details')}</ButtonGhost>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* rotation dots */}
      {featured.length > 1 && (
        <div className="absolute bottom-16 right-24 flex items-center gap-8">
          {featured.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={t('app.catalog.featureAria', { name: m.name })}
              onClick={() => setIndex(i)}
              className="focusable flex h-16 cursor-pointer items-center"
            >
              {i === index ? (
                <motion.span layoutId={`catalog-dot-${kind}`} transition={spring.snappy} className="block h-6 w-24 rounded-full bg-cyan shadow-glow-neon" />
              ) : (
                <span className="block h-6 w-6 rounded-full bg-white/30 hover:bg-white/60" />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── series card wrapper: episode chip + hover episode peek ────────────── */

function SeriesCard({ item }: { item: MetaItem }) {
  const { t } = useT();
  const episodes = item.videos ?? [];
  return (
    <div className="group/sc relative">
      <PosterCard item={item} className="w-full md:w-full xl:w-full" />
      {episodes.length > 0 && (
        <>
          <span className="glass-1 pointer-events-none absolute right-8 top-8 z-10 rounded-md px-8 py-2 text-micro uppercase text-ink">
            {t('app.catalog.episodeCount', { count: episodes.length })}
          </span>
          <div className="glass-2 pointer-events-none absolute inset-x-8 bottom-56 z-10 rounded-lg px-10 py-6 opacity-0 transition-opacity duration-[180ms] group-hover/sc:opacity-100">
            <p className="text-micro uppercase text-cyan">
              S01 · {t('app.catalog.episodesLower', { count: episodes.length })}
            </p>
            <p className="truncate text-caption text-ink">{t('app.catalog.startsWith', { title: episodes[0].title })}</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ── list-mode row ─────────────────────────────────────────────────────── */

function ListRow({ item, index }: { item: MetaItem; index: number }) {
  const { t } = useT();
  const watchlist = useLibrary((s) => s.watchlist);
  const toggleWatchlist = useLibrary((s) => s.toggleWatchlist);
  const saved = watchlist.includes(item.id);
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...spring.smooth, delay: Math.min(index, 10) * 0.04 }}
      className="glass-1 group/row flex items-center gap-16 rounded-xl p-12 transition-colors duration-[180ms] hover:bg-white/[.06]"
    >
      <Link
        to={`/app/detail/${item.type}/${item.id}`}
        className="focusable relative block w-96 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/[.08] sm:w-[160px]"
        aria-label={item.name}
      >
        <img src={item.backdrop ?? item.poster} alt="" loading="lazy" className="aspect-video h-full w-full object-cover" />
        {item.type === 'series' && item.videos && (
          <span className="glass-1 absolute left-6 top-6 rounded-md px-6 py-2 text-micro uppercase text-ink">
            {t('app.catalog.episodesLower', { count: item.videos.length })}
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Link to={`/app/detail/${item.type}/${item.id}`} className="focusable rounded-sm font-display text-title text-ink hover:text-cyan">
          {item.name}
        </Link>
        <p className="text-caption text-muted">
          {item.year}
          {item.runtime ? ` · ${item.runtime} min` : ''}
          {item.rating ? (
            <span className="inline-flex items-center gap-3">· <Star size={11} strokeWidth={1.75} fill="currentColor" className="text-warn" /> {item.rating.toFixed(1)}</span>
          ) : null}
        </p>
        <p className="hidden truncate text-caption text-muted sm:block">{item.description}</p>
      </div>
      {/* quick actions (hover reveal desktop, always visible touch) */}
      <div className="flex shrink-0 items-center gap-8 sm:opacity-0 sm:transition-opacity sm:duration-[180ms] sm:group-hover/row:opacity-100">
        <Link
          to={`/app/player/${item.type}/${item.id}`}
          aria-label={t('app.catalog.playAria', { name: item.name })}
          className="focusable glass-2 rounded-full p-10 text-cyan hover:shadow-glow-neon"
        >
          <Play size={16} strokeWidth={1.75} fill="currentColor" />
        </Link>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved
            ? t('app.catalog.removeWatchlistAria', { name: item.name })
            : t('app.catalog.addWatchlistAria', { name: item.name })}
          onClick={() => {
            toggleWatchlist(item.id);
            toast(saved
              ? t('app.home.toastRemovedWatchlist', { name: item.name })
              : t('app.home.toastAddedWatchlist', { name: item.name }));
          }}
          className={cn('focusable glass-2 cursor-pointer rounded-full p-10', saved ? 'text-cyan' : 'text-muted hover:text-ink')}
        >
          {saved ? <BookmarkCheck size={16} strokeWidth={1.75} /> : <BookmarkPlus size={16} strokeWidth={1.75} />}
        </button>
        <ButtonGhost to={`/app/detail/${item.type}/${item.id}`} className="hidden md:inline-flex">
          {t('app.catalog.details')}
        </ButtonGhost>
      </div>
    </motion.div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function Catalog({ kind }: { kind: 'movie' | 'series' }) {
  const { t } = useT();
  const cfg = CONFIG[kind];
  const { items, loading } = useCatalogItems();
  const [genre, setGenre] = useState('all');
  const [sortId, setSortId] = useState('trending');
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // View toggle remembered per profile.
  const viewKey = scopedKey('catalog-view');
  const [view, setView] = useState<'grid' | 'list'>(() =>
    typeof window !== 'undefined' && localStorage.getItem(viewKey) === 'list' ? 'list' : 'grid',
  );
  const switchView = (v: 'grid' | 'list') => {
    setView(v);
    try {
      localStorage.setItem(viewKey, v);
    } catch {
      /* storage unavailable */
    }
  };

  const typed = useMemo(() => items.filter((m) => m.type === kind), [items, kind]);

  const featured = useMemo(
    () => cfg.featured.map((id) => items.find((m) => m.id === id)).filter((m): m is MetaItem => Boolean(m)),
    [items, cfg],
  );

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const m of typed) for (const g of m.genres) set.add(g);
    return Array.from(set).sort();
  }, [typed]);

  const filtered = useMemo(() => {
    let out = genre === 'all' ? typed : typed.filter((m) => m.genres.includes(genre));
    const opt = CATALOG_SORTS.find((o) => o.id === sortId) ?? CATALOG_SORTS[0];
    return [...out].sort(opt.cmp);
  }, [typed, genre, sortId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisibleCount((c) => c + PAGE);
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visibleCount);
  const others = useMemo(
    () => items.filter((m) => m.type === cfg.other.kind).slice(0, 3),
    [items, cfg],
  );

  return (
    <div className="flex flex-col gap-32 pb-48 pt-16">
      {/* S1 — hero strip renders instantly from cache */}
      {loading && featured.length === 0 ? (
        <div className="glass-1 relative h-[36vh] min-h-[280px] overflow-hidden rounded-2xl" aria-hidden>
          <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-white/[.06] to-transparent [animation-duration:1.4s]" />
        </div>
      ) : (
        <HeroStrip kind={kind} featured={featured} />
      )}

      {/* S2 — toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.smooth}
        className="flex flex-wrap items-center gap-12"
      >
        <span className="text-caption text-muted" aria-live="polite">
          {loading
            ? t('app.catalog.loading')
            : t(kind === 'movie' ? 'app.catalog.countFilms' : 'app.catalog.countSeries', { count: filtered.length })}
        </span>
        <div className="no-scrollbar order-4 flex min-w-0 flex-1 basis-full gap-8 overflow-x-auto md:order-none md:basis-auto" role="group" aria-label={t('app.discover.genreAria')}>
          <FilterChip active={genre === 'all'} onClick={() => setGenre('all')}>
            {t('app.catalog.all')}
          </FilterChip>
          {genres.map((g) => (
            <FilterChip key={g} active={genre === g} onClick={() => setGenre(g)}>
              {g}
            </FilterChip>
          ))}
        </div>
        <SortControl value={sortId} onChange={setSortId} options={CATALOG_SORTS} />
        {/* view toggle */}
        <div className="glass-1 flex rounded-full p-4" role="group" aria-label={t('app.catalog.viewAria')}>
          <button
            type="button"
            aria-pressed={view === 'grid'}
            aria-label={t('app.catalog.gridView')}
            onClick={() => switchView('grid')}
            className={cn('focusable cursor-pointer rounded-full p-8', view === 'grid' ? 'bg-signature text-deep' : 'text-muted hover:text-ink')}
          >
            <LayoutGrid size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            aria-label={t('app.catalog.listView')}
            onClick={() => switchView('list')}
            className={cn('focusable cursor-pointer rounded-full p-8', view === 'list' ? 'bg-signature text-deep' : 'text-muted hover:text-ink')}
          >
            <Rows3 size={16} strokeWidth={1.75} />
          </button>
        </div>
      </motion.div>

      {/* S3 — catalog body */}
      {loading ? (
        <SkeletonGrid count={18} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={List}
          title={t(cfg.emptyTitleKey)}
          caption={t('app.catalog.emptyCaption')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-12">
              <ButtonGhost to={cfg.emptyLink.to}>{t(cfg.emptyLink.labelKey)}</ButtonGhost>
              <ButtonGhost to="/app/addons">{t('app.discover.checkHealth')}</ButtonGhost>
            </div>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 gap-20 sm:grid-cols-4 lg:grid-cols-6">
          {shown.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ ...spring.smooth, delay: Math.min(i % PAGE, 10) * 0.035 }}
              style={{ contentVisibility: 'auto' }}
            >
              {item.type === 'series' ? (
                <SeriesCard item={item} />
              ) : (
                <PosterCard item={item} className="w-full md:w-full xl:w-full" />
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {shown.map((item, i) => (
            <ListRow key={item.id} item={item} index={i} />
          ))}
        </div>
      )}

      {/* infinite-feel sentinel */}
      {!loading && visibleCount < filtered.length && (
        <div ref={sentinelRef} className="py-16">
          <div className="glass-1 relative mx-auto h-3 w-1/3 overflow-hidden rounded-full" aria-hidden>
            <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-[rgba(124,217,236,.35)] to-transparent [animation-duration:1.4s]" />
          </div>
        </div>
      )}

      {/* S4 — cross-promote band */}
      {others.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={spring.smooth}
          className="mt-16 flex flex-col gap-16 border-t border-[rgba(124,217,236,.15)] pt-32"
        >
          <div className="flex items-baseline justify-between gap-16">
            <h2 className="font-display text-title text-ink">{t(cfg.other.labelKey)}</h2>
            <ButtonGhost to={cfg.other.to}><span className="inline-flex items-center gap-6">{t(cfg.other.ctaKey)}<ArrowRight size={14} strokeWidth={1.75} /></span></ButtonGhost>
          </div>
          <div className="no-scrollbar -mx-16 flex gap-20 overflow-x-auto overscroll-x-contain scroll-smooth px-16 pb-4 md:mx-0 md:px-0">
            {others.map((item, i) => (
              <motion.div
                key={item.id}
                className="shrink-0"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...spring.smooth, delay: i * 0.06 }}
              >
                <PosterCard item={item} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
