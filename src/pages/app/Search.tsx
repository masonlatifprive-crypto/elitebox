/**
 * Search — /app/search (search.md).
 * Instant, honest search across every installed catalog addon (150ms
 * debounce via addonEngine.search), per-profile recent searches, genre quick
 * chips, keyboard-first: autofocus, `/` refocuses, Enter opens first result.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock3, Play, Search as SearchIcon, SearchX, X } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import { ButtonGhost, EmptyState, spring, toast } from '@/components/ui-elite';
import { MagnetPasteField, presentMagnetUri } from '@/components/MagnetDrop';
import { FilterChip, sourceForItem, useCatalogItems } from '@/pages/app/Discover';
import { addonEngine } from '@/lib/addons/engine';
import { isMagnetUri } from '@/lib/magnet';
import { scopedKey, useAddons, useLibrary, useSettings } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const MAX_RECENTS = 8;

function recentsKey(): string {
  return scopedKey('search.recent');
}

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(recentsKey());
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function writeRecents(list: string[]): void {
  try {
    localStorage.setItem(recentsKey(), JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {
    /* storage unavailable */
  }
}

/* ── idle: jump back in card ───────────────────────────────────────────── */

function JumpBackInCard({ item, progress }: { item: MetaItem; progress?: number }) {
  const { t } = useT();
  return (
    <Link
      to={`/app/player/${item.type}/${item.id}`}
      aria-label={t('app.library.resumeShortAria', { name: item.name })}
      className="focusable group/jb relative block w-[240px] shrink-0 snap-start overflow-hidden rounded-lg ring-1 ring-white/[.08] bg-navy hover:shadow-focus-glow focus-visible:shadow-focus-glow"
    >
      <img
        src={item.backdrop ?? item.poster}
        alt=""
        loading="lazy"
        draggable={false}
        className="aspect-video w-full object-cover transition-transform duration-300 group-hover/jb:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.9)] via-transparent to-transparent" />
      <div className="absolute bottom-8 left-10 right-10 flex items-center justify-between gap-8">
        <span className="truncate text-caption text-ink">{item.name}</span>
        <Play size={14} strokeWidth={1.75} fill="currentColor" className="shrink-0 text-cyan" />
      </div>
      {progress !== undefined && progress > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-3 bg-white/[.08]">
          <div className="h-full bg-signature" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
      )}
    </Link>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function Search() {
  const { t } = useT();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { items } = useCatalogItems();
  const installed = useAddons((s) => s.installed);
  const continueWatching = useLibrary((s) => s.continueWatching);
  const torrentEnabled = useSettings((s) => s.settings.streaming.torrentProfile !== 'off');

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<MetaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => readRecents());

  const searchAddons = useMemo(
    () => installed.filter((a) => a.builtin || a.resources.includes('catalog')),
    [installed],
  );

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const m of items) for (const g of m.genres) set.add(g);
    return Array.from(set).sort().slice(0, 8);
  }, [items]);

  const jumpBackIn = useMemo(
    () =>
      continueWatching
        .map((e) => ({ entry: e, item: items.find((m) => m.id === e.id) }))
        .filter((r): r is { entry: (typeof continueWatching)[number]; item: MetaItem } => Boolean(r.item))
        .slice(0, 4),
    [continueWatching, items],
  );

  // Autofocus on entry + `/` refocuses from anywhere on the page.
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && typing) {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 150ms debounce → real parallel queries to all healthy catalog addons.
  useEffect(() => {
    const q = query.trim();
    const t = window.setTimeout(() => setDebounced(q), 150);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    // A pasted magnet URI never becomes a catalog search: route it to the
    // shared magnet result sheet instead (valid → details, invalid → honest
    // error). Torrent profile "off" → treated as plain text, untouched path.
    if (torrentEnabled && isMagnetUri(debounced)) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      presentMagnetUri(debounced);
      return;
    }
    let alive = true;
    setSearching(true);
    addonEngine
      .search(debounced)
      .then((metas) => {
        if (!alive) return;
        setResults(metas);
        setSearched(true);
      })
      .catch(() => {
        if (!alive) return;
        setResults([]);
        setSearched(true);
      })
      .finally(() => {
        if (alive) setSearching(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced, torrentEnabled]);

  const recordRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecents((prev) => {
      const next = [trimmed, ...prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENTS);
      writeRecents(next);
      return next;
    });
  }, []);

  const clearRecents = () => {
    setRecents([]);
    writeRecents([]);
    toast(t('app.search.toastRecentsCleared'));
  };

  // Results grouped by source addon.
  const groups = useMemo(() => {
    const map = new Map<string, MetaItem[]>();
    for (const m of results) {
      const src = sourceForItem(m, searchAddons.map((a) => a.id));
      const list = map.get(src) ?? [];
      list.push(m);
      map.set(src, list);
    }
    return Array.from(map.entries()).map(([addonId, metas]) => ({
      addon: searchAddons.find((a) => a.id === addonId),
      addonId,
      metas,
    }));
  }, [results, searchAddons]);

  // Fuzzy "did you mean" — closest real titles by shared word prefix.
  const suggestions = useMemo(() => {
    if (!searched || results.length > 0) return [];
    const words = debounced.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
    if (words.length === 0) return items.slice(0, 3).map((m) => m.name);
    return items
      .filter((m) => {
        const name = m.name.toLowerCase();
        return words.some((w) => name.includes(w) || w.startsWith(name.split(' ')[0]) || name.split(' ').some((n) => n.startsWith(w.slice(0, 3))));
      })
      .map((m) => m.name)
      .slice(0, 3);
  }, [searched, results.length, debounced, items]);

  const openFirst = () => {
    if (results.length === 0) return;
    recordRecent(query);
    const first = results[0];
    navigate(`/app/detail/${first.type}/${first.id}`);
  };

  const idle = query.trim() === '';

  return (
    <div className="flex flex-col gap-32 pb-48">
      {/* S1 — search stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.smooth}
        className="mx-auto flex w-full max-w-2xl flex-col gap-16 pt-48"
      >
        <h1 className="text-center font-display text-display-xl text-ink">{t('app.search.headline')}</h1>

        <div className="relative">
          {/* breathing glow under the input */}
          <motion.div
            aria-hidden
            className="absolute -inset-2 rounded-full bg-[rgba(124,217,236,.18)] blur-2xl"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
          <div className="glass-2 relative flex h-64 items-center gap-12 rounded-full px-28">
            <SearchIcon size={22} strokeWidth={1.75} className="shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openFirst();
              }}
              placeholder={t('app.search.placeholder')}
              aria-label={t('app.search.inputAria')}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-body-l text-ink caret-[#7CD9EC] outline-none placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                aria-label={t('app.search.clearAria')}
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="focusable shrink-0 cursor-pointer rounded-full p-6 text-muted hover:text-ink"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            )}
          </div>
          {/* slim "Searching…" shimmer bar */}
          <div className="relative mx-28 mt-6 h-2 overflow-hidden rounded-full" aria-hidden>
            {searching && (
              <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-[rgba(124,217,236,.8)] to-transparent [animation-duration:1.2s]" />
            )}
          </div>
        </div>

        <p className="text-center font-mono text-micro uppercase text-muted" aria-live="polite">
          {t('app.search.searchingSources', { sources: searchAddons.map((a) => a.name).join(' · ') || t('app.search.noCatalogAddons') })}
        </p>

        {/* genre quick chips */}
        {idle && genres.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8">
            {genres.map((g) => (
              <FilterChip key={g} active={false} onClick={() => setQuery(g)}>
                {g}
              </FilterChip>
            ))}
          </div>
        )}
      </motion.div>

      {/* S2 — idle state */}
      {idle && (
        <div className="flex flex-col gap-32">
          {recents.length > 0 && (
            <section className="flex flex-col gap-12">
              <div className="flex items-baseline justify-between gap-16">
                <h2 className="font-display text-title text-ink">{t('app.search.recents')}</h2>
                <ButtonGhost onClick={clearRecents}>{t('app.search.clear')}</ButtonGhost>
              </div>
              <div className="flex flex-wrap gap-8">
                <AnimatePresence mode="popLayout">
                  {recents.map((r, i) => (
                    <motion.span
                      key={r}
                      layout="position"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ ...spring.snappy, delay: i * 0.04 }}
                    >
                      <FilterChip active={false} onClick={() => setQuery(r)}>
                        <Clock3 size={14} strokeWidth={1.75} className="mr-4 inline" /> {r}
                      </FilterChip>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {jumpBackIn.length > 0 && (
            <section className="flex flex-col gap-12">
              <h2 className="font-display text-title text-ink">{t('app.search.jumpBackIn')}</h2>
              <div className="shelf-fade-x no-scrollbar -mx-16 flex gap-16 overflow-x-auto px-16 py-8 snap-x snap-mandatory md:-mx-24 md:px-24 xl:-mx-48 xl:px-48">
                {jumpBackIn.map(({ entry, item }, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ ...spring.smooth, delay: i * 0.05 }}
                    className="snap-start"
                  >
                    <JumpBackInCard
                      item={item}
                      progress={entry.durationSec > 0 ? entry.progressSec / entry.durationSec : undefined}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-wrap items-center gap-12">
            <span className="text-caption text-muted">{t('app.search.browseInstead')}</span>
            <ButtonGhost to="/app/movies" className="glass-1">{t('app.rail.movies')}</ButtonGhost>
            <ButtonGhost to="/app/series" className="glass-1">{t('app.rail.series')}</ButtonGhost>
            <ButtonGhost to="/app/live" className="glass-1">{t('app.discover.tabLive')}</ButtonGhost>
          </section>

          {torrentEnabled && (
            <section className="mx-auto flex w-full max-w-xl flex-col gap-8">
              <h2 className="text-center font-display text-title text-ink">{t('app.search.haveMagnet')}</h2>
              <MagnetPasteField />
            </section>
          )}
        </div>
      )}

      {/* S3 — live results */}
      {!idle && searched && results.length > 0 && (
        <div className="flex flex-col gap-24">
          {groups.length === 1 ? (
            // single source: grouped section with header
            groups.map(({ addon, metas }) => (
              <section key={addon?.id ?? 'results'} className="flex flex-col gap-16">
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={spring.smooth}
                  className="flex items-center gap-12"
                >
                  {addon?.icon && (
                    <img
                      src={addon.icon}
                      alt=""
                      className="h-28 w-28 rounded-md ring-1 ring-white/[.1]"
                      onError={(e) => {
                        const img = e.currentTarget;
                        // scaffold manifests reference .png; generated tiles are .jpg
                        if (img.src.endsWith('.png')) img.src = img.src.replace(/\.png$/, '.jpg');
                        else img.style.display = 'none';
                      }}
                    />
                  )}
                  <h2 className="font-display text-title text-ink">{addon?.name ?? t('app.search.resultsFallback')}</h2>
                  <span className="glass-1 rounded-full px-10 py-2 text-micro uppercase text-cyan">{metas.length}</span>
                </motion.div>
                <div className="grid grid-cols-3 gap-20 sm:grid-cols-4 lg:grid-cols-6">
                  {metas.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.smooth, delay: Math.min(i, 12) * 0.03 }}
                      onClick={() => recordRecent(query)}
                    >
                      <PosterCard item={item} className="w-full md:w-full xl:w-full" />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))
          ) : (
            // ≥2 sources: unified ranked grid with source chips
            <div className="grid grid-cols-3 gap-20 sm:grid-cols-4 lg:grid-cols-6">
              {results.map((item, i) => {
                const src = sourceForItem(item, searchAddons.map((a) => a.id));
                const addon = searchAddons.find((a) => a.id === src);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.smooth, delay: Math.min(i, 12) * 0.03 }}
                    className="relative"
                    onClick={() => recordRecent(query)}
                  >
                    <PosterCard item={item} className="w-full md:w-full xl:w-full" />
                    {addon && (
                      <span className="glass-1 pointer-events-none absolute bottom-40 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-8 py-2 text-micro uppercase text-muted">
                        {addon.name}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* S4 — no results */}
      {!idle && searched && results.length === 0 && !searching && (
        <EmptyState
          icon={SearchX}
          title={t('app.search.nothingFound', { query: debounced })}
          caption={t('app.search.nothingFoundCaption')}
          action={
            suggestions.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-8">
                <span className="text-caption text-muted">{t('app.search.didYouMean')}</span>
                {suggestions.map((s) => (
                  <FilterChip key={s} active={false} onClick={() => setQuery(s)}>
                    {s}
                  </FilterChip>
                ))}
              </div>
            ) : (
              <ButtonGhost onClick={() => setQuery('')}>{t('app.search.clearSearch')}</ButtonGhost>
            )
          }
        />
      )}

      {/* still searching placeholder */}
      {!idle && searching && results.length === 0 && (
        <p className={cn('py-32 text-center text-caption text-muted')}>{t('app.search.searchingYourAddons')}</p>
      )}
    </div>
  );
}
