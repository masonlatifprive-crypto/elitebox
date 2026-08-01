/**
 * Library — `/app/library` (design library.md).
 * Tabs: Continue Watching / Watchlist / Favorites / History — all real data
 * from the profile-scoped `useLibrary` store. Stats strip (titles saved,
 * hours tracked, day streak), remove actions with toasts, honest empty
 * states with real CTAs.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  Clock,
  Flame,
  Heart,
  History as HistoryIcon,
  LibraryBig,
  Play,
  PlayCircle,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import { ButtonNeon, EmptyState, spring, toast } from '@/components/ui-elite';
import { DEFAULT_PROFILE_ID, useLibrary, useProfiles } from '@/lib/store';
import { findShowcaseMeta } from '@/data/showcase';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
import { cn } from '@/lib/utils';
import type { MetaItem } from '@/lib/types';

/* ── shared helpers ────────────────────────────────────────────────────── */

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days with activity, ending today (or yesterday if today is quiet). */
function computeStreak(timestamps: number[]): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map(dayKey));
  const cursor = new Date();
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!days.has(keyOf(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(keyOf(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(keyOf(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Case/diacritic-insensitive fold for local library search (stremio local_search parity). */
function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function formatHours(totalSec: number): number {
  const h = totalSec / 3600;
  return h >= 10 ? Math.round(h) : Math.round(h * 10) / 10;
}

function formatRemaining(sec: number, t: TFunction): string {
  const m = Math.max(1, Math.round(sec / 60));
  return m >= 60
    ? t('app.library.remainingHours', { h: Math.floor(m / 60), m: m % 60 })
    : t('app.library.remainingMinutes', { m });
}

function formatAgo(ts: number, t: TFunction): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('app.library.justNow');
  if (mins < 60) return t('app.library.minutesAgo', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('app.library.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('app.library.daysAgo', { n: days });
  return new Date(ts).toLocaleDateString();
}

/* ── count-up number (reduced-motion safe) ─────────────────────────────── */

function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const prevRef = useRef(0);
  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const from = prevRef.current;
    prevRef.current = value;
    if (from === value) return;
    const started = performance.now();
    const dur = 750;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <span className={className}>{display.toFixed(decimals)}</span>;
}

/* ── tabs ──────────────────────────────────────────────────────────────── */

type TabId = 'continue' | 'watchlist' | 'favorites' | 'history';

const TABS: Array<{ id: TabId; labelKey: string }> = [
  { id: 'continue', labelKey: 'app.library.tabContinue' },
  { id: 'watchlist', labelKey: 'app.library.tabWatchlist' },
  { id: 'favorites', labelKey: 'app.library.tabFavorites' },
  { id: 'history', labelKey: 'app.library.tabHistory' },
];

/* ── small round glass action button ───────────────────────────────────── */

function CardAction({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'focusable glass-2 flex h-32 w-32 items-center justify-center rounded-full cursor-pointer transition-colors',
        danger ? 'text-muted hover:text-error hover:border-error/40' : 'text-muted hover:text-cyan',
      )}
    >
      {children}
    </button>
  );
}

/* ── continue-watching backdrop card ───────────────────────────────────── */

function ContinueCard({
  meta,
  progressSec,
  durationSec,
  onRemove,
}: {
  meta: MetaItem;
  progressSec: number;
  durationSec: number;
  onRemove: () => void;
}) {
  const { t } = useT();
  const ratio = durationSec > 0 ? progressSec / durationSec : 0;
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring.smooth}
      className="group relative"
    >
      <Link
        to={`/app/player/${meta.type}/${meta.id}`}
        className="focusable relative block aspect-video overflow-hidden rounded-lg ring-1 ring-white/[.08] bg-navy hover:shadow-focus-glow focus-visible:shadow-focus-glow transition-shadow"
        aria-label={t('app.library.resumeAria', { name: meta.name, remaining: formatRemaining(durationSec - progressSec, t) })}
      >
        <img
          src={meta.backdrop ?? meta.poster}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.94)] via-[rgba(3,6,18,.35)] to-transparent" />
        <div className="absolute right-12 top-12 flex h-40 w-40 items-center justify-center rounded-full bg-deep/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <Play size={18} strokeWidth={1.75} className="text-cyan fill-cyan" />
        </div>
        <div className="absolute inset-x-12 bottom-12 flex flex-col gap-2">
          <span className="text-caption text-ink leading-tight line-clamp-1">{meta.name}</span>
          <span className="text-micro uppercase text-muted flex items-center gap-6">
            <Clock size={12} strokeWidth={1.75} />
            {formatRemaining(durationSec - progressSec, t)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3 bg-white/[.08]">
          <div className="h-full bg-signature" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
      </Link>
      <div className="absolute left-8 top-8 z-10">
        <CardAction label={t('app.library.removeFromCw', { name: meta.name })} onClick={onRemove} danger>
          <X size={14} strokeWidth={1.75} />
        </CardAction>
      </div>
    </motion.div>
  );
}

/* ── local search no-match state ───────────────────────────────────────── */

function SearchNoMatch({ query, onClear }: { query: string; onClear: () => void }) {
  const { t } = useT();
  return (
    <EmptyState
      icon={SearchX}
      title={t('app.library.searchNoMatchTitle', { query })}
      caption={t('app.library.searchNoMatchCaption')}
      action={<ButtonNeon onClick={onClear}>{t('app.library.searchClear')}</ButtonNeon>}
    />
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function LibraryPage() {
  const { t } = useT();
  const { watchlist, favorites, watched, continueWatching, removeFromWatchlist, removeFavorite, addFavorite, clearProgress, toggleWatched } =
    useLibrary();
  const profiles = useProfiles((s) => s.profiles);
  const activeProfileId = useProfiles((s) => s.activeProfileId);
  const profile = profiles.find((p) => p.id === (activeProfileId ?? DEFAULT_PROFILE_ID));

  const [tab, setTab] = useState<TabId>('continue');
  /* Local search filters the rendered lists only — saved data and tab
     counts always reflect the real library. */
  const [query, setQuery] = useState('');
  const q = fold(query.trim());
  const matches = (name: string) => !q || fold(name).includes(q);

  const stats = useMemo(() => {
    const saved = new Set([...watchlist, ...favorites]);
    const totalSec = continueWatching.reduce((acc, e) => acc + e.progressSec, 0);
    const streak = computeStreak(continueWatching.map((e) => e.updatedAt));
    return { titles: saved.size, hours: formatHours(totalSec), streak };
  }, [watchlist, favorites, continueWatching]);

  const continueItems = useMemo(
    () =>
      continueWatching
        .map((e) => ({ entry: e, meta: findShowcaseMeta(e.id) }))
        .filter((x): x is { entry: (typeof continueWatching)[number]; meta: MetaItem } => Boolean(x.meta)),
    [continueWatching],
  );

  const watchlistItems = useMemo(
    () => watchlist.map((id) => findShowcaseMeta(id)).filter((m): m is MetaItem => Boolean(m)),
    [watchlist],
  );
  const favoriteItems = useMemo(
    () => favorites.map((id) => findShowcaseMeta(id)).filter((m): m is MetaItem => Boolean(m)),
    [favorites],
  );
  const watchedItems = useMemo(
    () => watched.map((id) => findShowcaseMeta(id)).filter((m): m is MetaItem => Boolean(m)),
    [watched],
  );

  /* Query-filtered views (client-side, stremio local_search parity). */
  const fContinue = continueItems.filter((x) => matches(x.meta.name));
  const fWatchlist = watchlistItems.filter((m) => matches(m.name));
  const fFavorites = favoriteItems.filter((m) => matches(m.name));
  const fWatched = watchedItems.filter((m) => matches(m.name));
  const searching = q.length > 0;

  const counts: Record<TabId, number> = {
    continue: continueItems.length,
    watchlist: watchlistItems.length,
    favorites: favoriteItems.length,
    history: continueItems.length + watchedItems.length,
  };

  return (
    <div className="flex flex-col gap-32">
      {/* ── S1 header + stats strip ── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-16"
      >
        <div className="flex flex-wrap items-center gap-16">
          <h1 className="font-display text-display-xl text-ink max-md:text-[2.25rem]">{t('app.library.title')}</h1>
          {profile && (
            <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-6">
              <img src={profile.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
              <span className="text-caption text-muted">{profile.name}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-12 lg:grid-cols-3">
          {(
            [
              { labelKey: 'app.library.titlesSaved', value: stats.titles, decimals: 0, icon: LibraryBig, purple: false },
              { labelKey: 'app.library.hoursTracked', value: stats.hours, decimals: stats.hours >= 10 ? 0 : 1, icon: Clock, purple: false },
              { labelKey: 'app.library.dayStreak', value: stats.streak, decimals: 0, icon: Flame, purple: true },
            ] as const
          ).map((tile, i) => (
            <motion.div
              key={tile.labelKey}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.smooth, delay: 0.08 + i * 0.07 }}
            >
              <Link
                to="/app/stats"
                className="focusable glass-1 flex items-center gap-16 rounded-xl p-16 hover:border-white/[.14] transition-colors"
              >
                <span className="glass-2 flex h-40 w-40 shrink-0 items-center justify-center rounded-full">
                  <tile.icon size={18} strokeWidth={1.75} className={tile.purple ? 'text-purple' : 'text-cyan'} />
                </span>
                <span className="flex flex-col">
                  <CountUp
                    value={tile.value}
                    decimals={tile.decimals}
                    className="font-display text-display-l text-gradient-signature max-md:text-[1.75rem]"
                  />
                  <span className="text-micro uppercase text-muted">{t(tile.labelKey)}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.header>

      {/* ── S2 tab bar + local search ── */}
      <div className="flex flex-wrap items-center gap-16">
        <div className="glass-1 flex w-fit max-w-full gap-4 overflow-x-auto no-scrollbar rounded-full p-4">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.id}
              type="button"
              onClick={() => setTab(tabDef.id)}
              className={cn(
                'focusable relative flex shrink-0 items-center gap-8 rounded-full px-16 py-8 text-caption font-semibold cursor-pointer transition-colors',
                tab === tabDef.id ? 'text-deep' : 'text-muted hover:text-ink',
              )}
            >
              {tab === tabDef.id && (
                <motion.span
                  layoutId="library-tab-pill"
                  className="absolute inset-0 rounded-full bg-chrome"
                  transition={spring.snappy}
                />
              )}
              <span className="relative z-10">{t(tabDef.labelKey)}</span>
              <span
                className={cn(
                  'relative z-10 rounded-full px-8 py-1 text-micro',
                  tab === tabDef.id ? 'bg-deep/15 text-deep' : 'bg-white/[.06] text-muted',
                )}
              >
                {counts[tabDef.id]}
              </span>
            </button>
          ))}
        </div>

        {/* local search — filters by title, case/diacritic-insensitive */}
        <div className="glass-1 ml-auto flex items-center gap-8 rounded-full px-16 py-8">
          <Search size={14} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('app.library.searchPlaceholder')}
            aria-label={t('app.library.searchInputAria')}
            spellCheck={false}
            className="w-180 bg-transparent text-caption text-ink outline-none placeholder:text-muted/60 max-md:w-120"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('app.library.searchClearAria')}
              className="focusable flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink cursor-pointer"
            >
              <X size={12} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* ── tab content ── */}
      <AnimatePresence mode="wait">
        <motion.section
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'continue' &&
            (continueItems.length === 0 ? (
              <EmptyState
                icon={PlayCircle}
                title={t('app.library.emptyContinueTitle')}
                caption={t('app.library.emptyContinueCaption')}
                action={<ButtonNeon to="/app/discover">{t('app.library.browseDiscover')}</ButtonNeon>}
              />
            ) : fContinue.length === 0 && searching ? (
              <SearchNoMatch query={query.trim()} onClear={() => setQuery('')} />
            ) : (
              <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {fContinue.map(({ entry, meta }) => (
                    <ContinueCard
                      key={entry.id}
                      meta={meta}
                      progressSec={entry.progressSec}
                      durationSec={entry.durationSec}
                      onRemove={() => {
                        clearProgress(entry.id);
                        toast(t('app.library.toastRemovedCw', { name: meta.name }));
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}

          {tab === 'watchlist' &&
            (watchlistItems.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title={t('app.library.emptyWatchlistTitle')}
                caption={t('app.library.emptyWatchlistCaption')}
                action={<ButtonNeon to="/app/discover">{t('app.library.discoverSomething')}</ButtonNeon>}
              />
            ) : fWatchlist.length === 0 && searching ? (
              <SearchNoMatch query={query.trim()} onClear={() => setQuery('')} />
            ) : (
              <div className="grid grid-cols-2 gap-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {fWatchlist.map((meta, i) => (
                  <motion.div
                    key={meta.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.smooth, delay: i * 0.04 }}
                    className="relative"
                  >
                    <PosterCard item={meta} className="w-full" />
                    <div className="absolute right-8 top-8 z-10 flex flex-col gap-6">
                      <CardAction
                        label={t('app.library.moveToFavorites', { name: meta.name })}
                        onClick={() => {
                          addFavorite(meta.id);
                          removeFromWatchlist(meta.id);
                          toast(t('app.library.toastMovedFavorites', { name: meta.name }));
                        }}
                      >
                        <Heart size={14} strokeWidth={1.75} />
                      </CardAction>
                      <CardAction
                        label={t('app.library.removeFromWatchlist', { name: meta.name })}
                        danger
                        onClick={() => {
                          removeFromWatchlist(meta.id);
                          toast(t('app.library.toastRemovedWatchlist', { name: meta.name }));
                        }}
                      >
                        <X size={14} strokeWidth={1.75} />
                      </CardAction>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}

          {tab === 'favorites' &&
            (favoriteItems.length === 0 ? (
              <EmptyState
                icon={Heart}
                title={t('app.library.emptyFavoritesTitle')}
                caption={t('app.library.emptyFavoritesCaption')}
                action={
                  watchlistItems.length > 0 ? (
                    <ButtonNeon onClick={() => setTab('watchlist')}>{t('app.library.browseWatchlist')}</ButtonNeon>
                  ) : (
                    <ButtonNeon to="/app/discover">{t('app.library.discoverSomething')}</ButtonNeon>
                  )
                }
              />
            ) : fFavorites.length === 0 && searching ? (
              <SearchNoMatch query={query.trim()} onClear={() => setQuery('')} />
            ) : (
              <div className="grid grid-cols-2 gap-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {fFavorites.map((meta, i) => (
                  <motion.div
                    key={meta.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.smooth, delay: i * 0.04 }}
                    className="relative"
                  >
                    <PosterCard item={meta} className="w-full" />
                    <span className="absolute left-8 top-8 z-10 glass-2 flex h-28 w-28 items-center justify-center rounded-full">
                      <Heart size={13} strokeWidth={1.75} className="text-purple fill-purple" />
                    </span>
                    <div className="absolute right-8 top-8 z-10">
                      <CardAction
                        label={t('app.library.removeFromFavorites', { name: meta.name })}
                        danger
                        onClick={() => {
                          removeFavorite(meta.id);
                          toast(t('app.library.toastRemovedFavorites', { name: meta.name }));
                        }}
                      >
                        <X size={14} strokeWidth={1.75} />
                      </CardAction>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}

          {tab === 'history' &&
            (continueItems.length === 0 && watchedItems.length === 0 ? (
              <EmptyState
                icon={HistoryIcon}
                title={t('app.library.emptyHistoryTitle')}
                caption={t('app.library.emptyHistoryCaption')}
                action={<ButtonNeon to="/app">{t('app.library.watchSomething')}</ButtonNeon>}
              />
            ) : fContinue.length === 0 && fWatched.length === 0 && searching ? (
              <SearchNoMatch query={query.trim()} onClear={() => setQuery('')} />
            ) : (
              <div className="flex max-w-4xl flex-col gap-12">
                {fContinue.map(({ entry, meta }) => {
                  const pct = entry.durationSec > 0 ? Math.round((entry.progressSec / entry.durationSec) * 100) : 0;
                  return (
                    <motion.div
                      key={entry.id}
                      layout="position"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={spring.smooth}
                      className="glass-1 flex items-center gap-16 rounded-xl p-12"
                    >
                      <Link
                        to={`/app/detail/${meta.type}/${meta.id}`}
                        className="focusable block w-64 shrink-0 overflow-hidden rounded-md ring-1 ring-white/[.08]"
                        aria-label={t('app.calendar.detailsAria', { name: meta.name })}
                      >
                        <img src={meta.poster} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <span className="text-caption text-ink line-clamp-1">{meta.name}</span>
                        <span className="text-micro uppercase text-muted">
                          {t('app.library.watchedAgo', { ago: formatAgo(entry.updatedAt, t), pct })}
                        </span>
                        <div className="h-3 w-full max-w-240 overflow-hidden rounded-full bg-white/[.08]">
                          <div className="h-full bg-signature" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <Link
                          to={`/app/player/${meta.type}/${meta.id}`}
                          className="focusable glass-2 flex h-36 w-36 items-center justify-center rounded-full text-cyan hover:shadow-glow-neon"
                          aria-label={t('app.library.resumeShortAria', { name: meta.name })}
                        >
                          <Play size={16} strokeWidth={1.75} className="fill-cyan" />
                        </Link>
                        <CardAction
                          label={t('app.library.removeFromHistory', { name: meta.name })}
                          danger
                          onClick={() => {
                            clearProgress(entry.id);
                            toast(t('app.library.toastRemovedHistory', { name: meta.name }));
                          }}
                        >
                          <X size={14} strokeWidth={1.75} />
                        </CardAction>
                      </div>
                    </motion.div>
                  );
                })}
              {fWatched.length > 0 && (
                <>
                  <h3 className="mt-24 text-micro uppercase tracking-wider text-muted">
                    {t('app.library.markedWatchedCount', { count: fWatched.length })}
                  </h3>
                  <div className="grid grid-cols-3 gap-12 sm:grid-cols-4 md:grid-cols-6">
                    {fWatched.map((meta) => (
                      <div key={meta.id} className="relative">
                        <PosterCard item={meta} className="w-full" />
                        <div className="absolute right-8 top-8 z-10">
                          <CardAction
                            label={t('app.library.unmarkWatched', { name: meta.name })}
                            onClick={() => {
                              toggleWatched(meta.id);
                              toast(t('app.library.toastUnmarked', { name: meta.name }));
                            }}
                          >
                            <X size={14} strokeWidth={1.75} />
                          </CardAction>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            ))}
        </motion.section>
      </AnimatePresence>

      {/* ── S4 portability note ── */}
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-2 rounded-xl px-16 py-12 text-caption text-muted"
      >
        {t('app.library.portabilityNote')}{' '}
        <Link to="/app/settings" className="focusable text-cyan hover:underline">
          {t('app.library.portabilityLink')}
        </Link>
        .
      </motion.p>
    </div>
  );
}
