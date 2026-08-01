/**
 * Discover — /app/discover (discover.md).
 * Filterable, sortable catalog grid across installed catalog addons with a
 * source switcher. Deep-linkable via ?type= ?genre= ?sort= ?collection= ?src=.
 *
 * This module also hosts the shared browsing helpers used by the other
 * browsing pages (catalog hook, smart-collection rules, sort control).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, SearchX, Store } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import { ButtonGhost, EmptyState, HealthDot, spring } from '@/components/ui-elite';
import { addonEngine } from '@/lib/addons/engine';
import { findShowcaseMeta } from '@/data/showcase';
import { useAddons } from '@/lib/store';
import type { AddonHealth, MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

/* ── Shared browsing helpers (also used by AppHome / Catalog / Search) ──── */

/** Live catalog across all enabled catalog addons. */
export function useCatalogItems(): { items: MetaItem[]; loading: boolean; reload: () => void } {
  const [items, setItems] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    addonEngine
      .getCatalog()
      .then((metas) => {
        if (alive) setItems(metas);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);
  return { items, loading, reload };
}

/** Which addon an item came from (builtin showcase vs. first external). */
export function sourceForItem(item: MetaItem, installedIds: string[]): string {
  if (findShowcaseMeta(item.id)) return 'elitebox.showcase';
  return installedIds.find((id) => id !== 'elitebox.showcase') ?? 'elitebox.showcase';
}

/* ── Smart collections (rule-filtered rows, computed live from metadata) ── */

export interface CollectionDef {
  id: string;
  /** i18n key for the collection name — render via t() */
  nameKey: string;
  /** i18n key for the caption — render via t() */
  captionKey: string;
  match: (m: MetaItem) => boolean;
}

export const COLLECTIONS: CollectionDef[] = [
  {
    id: 'sci-fi-night',
    nameKey: 'app.collections.scifiName',
    captionKey: 'app.collections.scifiCaption',
    match: (m) => m.genres.includes('Sci-Fi') && (m.rating ?? 0) >= 6.5,
  },
  {
    id: 'family-afternoon',
    nameKey: 'app.collections.familyName',
    captionKey: 'app.collections.familyCaption',
    match: (m) => m.genres.includes('Family'),
  },
  {
    id: 'critics-picks',
    nameKey: 'app.collections.criticsName',
    captionKey: 'app.collections.criticsCaption',
    match: (m) => (m.rating ?? 0) >= 7,
  },
  {
    id: 'short-brilliant',
    nameKey: 'app.collections.shortName',
    captionKey: 'app.collections.shortCaption',
    match: (m) => (m.runtime ?? 999) < 15 && m.type === 'movie',
  },
];

export function getCollection(id: string | null): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

/* ── Sort control (glass dropdown, shared with Catalog) ────────────────── */

export interface SortOption {
  id: string;
  /** i18n key for the label — render via t() */
  labelKey: string;
  cmp: (a: MetaItem, b: MetaItem) => number;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: 'trending', labelKey: 'app.sort.trending', cmp: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  { id: 'rating', labelKey: 'app.sort.rating', cmp: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  { id: 'az', labelKey: 'app.sort.az', cmp: (a, b) => a.name.localeCompare(b.name) },
  { id: 'year-desc', labelKey: 'app.sort.yearDesc', cmp: (a, b) => (b.year ?? 0) - (a.year ?? 0) },
  { id: 'year-asc', labelKey: 'app.sort.yearAsc', cmp: (a, b) => (a.year ?? 0) - (b.year ?? 0) },
];

export function SortControl({
  value,
  onChange,
  options = SORT_OPTIONS,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  options?: SortOption[];
  className?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="focusable glass-1 inline-flex cursor-pointer items-center gap-8 rounded-full px-16 py-8 text-caption font-semibold text-muted hover:text-ink"
      >
        {t('app.discover.sortPrefix')} <span className="text-cyan">{t(current.labelKey)}</span>
        <ChevronDownIcon open={open} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={spring.snappy}
            className="glass-2 absolute right-0 top-full z-40 mt-8 flex min-w-[160px] flex-col gap-2 rounded-xl p-8"
          >
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={cn(
                  'focusable cursor-pointer rounded-lg px-12 py-8 text-left text-caption font-semibold',
                  o.id === value ? 'bg-[rgba(124,217,236,.10)] text-cyan' : 'text-muted hover:bg-white/[.06] hover:text-ink',
                )}
              >
                {t(o.labelKey)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('transition-transform duration-150', open && 'rotate-180')}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ── Filter chip ───────────────────────────────────────────────────────── */

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focusable shrink-0 cursor-pointer rounded-full px-16 py-8 text-caption font-semibold transition-[color,box-shadow] duration-150',
        active ? 'glass-1 text-cyan shadow-glow-neon' : 'glass-1 text-muted hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Skeleton card grid (shimmer sweep, 1.4s) ──────────────────────────── */

export function SkeletonGrid({ count = 21, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-3 gap-20 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7', className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="glass-1 relative aspect-[2/3] overflow-hidden rounded-lg">
          <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-white/[.07] to-transparent [animation-duration:1.4s] [animation-timing-function:ease-in-out]" />
        </div>
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

const PAGE = 24;
const TYPE_TABS = [
  { id: 'all', labelKey: 'app.discover.tabAll' },
  { id: 'movie', labelKey: 'app.rail.movies' },
  { id: 'series', labelKey: 'app.rail.series' },
  { id: 'channel', labelKey: 'app.discover.tabLive' },
] as const;

export default function Discover() {
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const { items, loading, reload } = useCatalogItems();
  const installed = useAddons((s) => s.installed);
  const [health, setHealth] = useState<Record<string, AddonHealth>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Health snapshot for source chips.
  useEffect(() => {
    setHealth(addonEngine.healthAll());
  }, [installed]);

  const catalogAddons = useMemo(
    () => installed.filter((a) => a.builtin || a.resources.includes('catalog')),
    [installed],
  );
  const installedIds = useMemo(() => catalogAddons.map((a) => a.id), [catalogAddons]);

  // ── filter state = URL (shareable) ──
  const type = params.get('type') ?? 'all';
  const genre = params.get('genre') ?? 'all';
  const sortId = params.get('sort') ?? 'trending';
  const collectionId = params.get('collection');
  const srcParam = params.get('src');
  const activeSources = useMemo(
    () => (srcParam ? new Set(srcParam.split(',').filter(Boolean)) : new Set(installedIds)),
    [srcParam, installedIds],
  );

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === '' || v === 'all' || (k === 'sort' && v === 'trending')) next.delete(k);
            else next.set(k, v);
          }
          return next;
        },
        { replace: true },
      );
      setVisibleCount(PAGE);
    },
    [setParams],
  );

  const collection = getCollection(collectionId);

  // Source-filtered pool.
  const sourced = useMemo(
    () => items.filter((m) => activeSources.has(sourceForItem(m, installedIds))),
    [items, activeSources, installedIds],
  );

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const m of sourced) for (const g of m.genres) set.add(g);
    return Array.from(set).sort();
  }, [sourced]);

  const filtered = useMemo(() => {
    let out = sourced;
    if (collection) out = out.filter(collection.match);
    if (type !== 'all') out = out.filter((m) => m.type === type);
    if (genre !== 'all') out = out.filter((m) => m.genres.includes(genre));
    const opt = SORT_OPTIONS.find((o) => o.id === sortId) ?? SORT_OPTIONS[0];
    return [...out].sort(opt.cmp);
  }, [sourced, collection, type, genre, sortId]);

  // Infinite-feel batching via scroll sentinel.
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
  const allDown = catalogAddons.length > 0 && catalogAddons.every((a) => health[a.id]?.status === 'down');

  const toggleSource = (id: string) => {
    const next = new Set(activeSources);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (next.size === 0) next.add(id); // never zero sources
    const all = catalogAddons.every((a) => next.has(a.id));
    patchParams({ src: all ? null : Array.from(next).join(',') });
  };

  return (
    <div className="flex flex-col gap-24">
      {/* S1 — header */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.smooth}
        className="flex flex-wrap items-end justify-between gap-12 pt-16"
      >
        <h1 className="font-display text-display-xl text-ink">{t('app.discover.title')}</h1>
        <p className="text-caption text-muted" aria-live="polite">
          {loading ? t('app.discover.loadingCatalogs') : t('app.discover.titleCount', { count: filtered.length })}
        </p>
      </motion.header>

      {/* S3 — collection banner */}
      <AnimatePresence>
        {collection && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={spring.smooth}
            className="glass-2 flex flex-wrap items-center justify-between gap-12 rounded-xl border-l-[3px] border-l-cyan p-16"
          >
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-title text-ink">{t(collection.nameKey)}</h2>
              <p className="font-mono text-micro uppercase tracking-wider text-muted">
                {t(collection.captionKey)} · {t('app.discover.computedFromAddons')}
              </p>
            </div>
            <ButtonGhost onClick={() => patchParams({ collection: null })}>{t('app.discover.clear')}</ButtonGhost>
          </motion.div>
        )}
      </AnimatePresence>

      {/* S1 — filter dock */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.smooth, delay: 0.08 }}
        className="glass-2 sticky top-16 z-30 flex flex-col gap-12 rounded-xl p-16"
      >
        <div className="flex flex-wrap items-center gap-12">
          {/* type segmented control */}
          <div className="glass-1 flex rounded-full p-4" role="tablist" aria-label={t('app.discover.typeAria')}>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={type === tab.id}
                onClick={() => patchParams({ type: tab.id })}
                className="focusable relative cursor-pointer rounded-full px-16 py-8 text-caption font-semibold"
              >
                {type === tab.id && (
                  <motion.span
                    layoutId="discover-type-pill"
                    transition={spring.snappy}
                    className="bg-signature absolute inset-0 rounded-full"
                  />
                )}
                <span className={cn('relative z-10', type === tab.id ? 'text-deep' : 'text-muted hover:text-ink')}>
                  {t(tab.labelKey)}
                </span>
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <SortControl value={sortId} onChange={(id) => patchParams({ sort: id })} />
          </div>
        </div>

        {/* genre chips */}
        <div className="no-scrollbar flex gap-8 overflow-x-auto" role="group" aria-label={t('app.discover.genreAria')}>
          <FilterChip active={genre === 'all'} onClick={() => patchParams({ genre: null })}>
            {t('app.discover.allGenres')}
          </FilterChip>
          {genres.map((g) => (
            <FilterChip key={g} active={genre === g} onClick={() => patchParams({ genre: g })}>
              {g}
            </FilterChip>
          ))}
        </div>

        {/* source switcher */}
        <div className="flex flex-wrap items-center gap-8">
          <span className="text-caption text-muted">{t('app.discover.sources')}</span>
          {catalogAddons.map((a) => {
            const h = health[a.id];
            const broken = h?.circuit === 'open';
            const active = activeSources.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleSource(a.id)}
                disabled={broken}
                aria-pressed={active}
                title={broken ? t('app.discover.benched') : a.name}
                className={cn(
                  'focusable glass-1 inline-flex cursor-pointer items-center gap-8 rounded-full px-12 py-6 text-caption font-semibold transition-opacity',
                  active ? 'text-ink' : 'text-muted opacity-60',
                  broken && 'cursor-not-allowed opacity-40',
                )}
              >
                <HealthDot status={h?.status ?? 'ok'} />
                {a.name}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* S2 — results */}
      {loading ? (
        <SkeletonGrid />
      ) : allDown ? (
        <EmptyState
          icon={RotateCcw}
          title={t('app.discover.emptyDownTitle')}
          caption={t('app.discover.emptyDownCaption')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-12">
              <ButtonGhost to="/app/addons">{t('app.discover.checkHealth')}</ButtonGhost>
              <ButtonGhost
                onClick={() => {
                  reload();
                  setHealth(addonEngine.healthAll());
                }}
              >
                {t('app.discover.retry')}
              </ButtonGhost>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t('app.discover.emptyFilterTitle')}
          caption={t('app.discover.emptyFilterCaption')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-12">
              {genre !== 'all' && (
                <FilterChip active={false} onClick={() => patchParams({ genre: null })}>
                  {t('app.discover.clearGenre')}
                </FilterChip>
              )}
              <FilterChip
                active={false}
                onClick={() => patchParams({ type: null, genre: null, sort: null, collection: null, src: null })}
              >
                {t('app.discover.resetAll')}
              </FilterChip>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-20 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            <AnimatePresence mode="popLayout">
              {shown.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout="position"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...spring.smooth, delay: Math.min(i % PAGE, 10) * 0.035 }}
                  style={{ contentVisibility: 'auto' }}
                >
                  <PosterCard item={item} className="w-full md:w-full xl:w-full" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {visibleCount < filtered.length ? (
            <div ref={sentinelRef} className="py-24">
              <div className="glass-1 relative mx-auto h-3 w-1/3 overflow-hidden rounded-full" aria-hidden>
                <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-[rgba(124,217,236,.35)] to-transparent [animation-duration:1.4s]" />
              </div>
              <p className="mt-12 text-center text-micro uppercase text-muted">{t('app.discover.loadingMore')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-12 py-32 text-center">
              <p className="text-caption text-muted">
                {t('app.discover.allShown')}
              </p>
              <ButtonGhost to="/store">
                <Store size={16} strokeWidth={1.75} /> {t('app.discover.openStore')}
              </ButtonGhost>
            </div>
          )}
        </>
      )}
    </div>
  );
}
