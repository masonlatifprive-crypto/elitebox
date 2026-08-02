import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Puzzle, Search, X } from 'lucide-react';
import { useCatalogItems } from '@/pages/app/Discover';
import { addonEngine } from '@/lib/addons/engine';
import type { AddonInfo, MetaItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { findShowcaseMeta } from '@/data/showcase';

interface TvRow {
  id: string;
  title: string;
  caption: string;
  items: MetaItem[];
}

function unique(items: MetaItem[]): MetaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function posterBg(item?: MetaItem): string | undefined {
  return item?.backdrop ?? item?.poster;
}

function itemMeta(item: MetaItem): string {
  return [item.year, item.type === 'series' ? 'Series' : item.type === 'channel' ? 'Channel' : 'Movie', item.genres?.[0]]
    .filter(Boolean)
    .join(' · ');
}

export default function TvMode() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { items, loading } = useCatalogItems();
  const [addons, setAddons] = useState<AddonInfo[]>([]);
  const [focus, setFocus] = useState({ r: 0, c: 0 });
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve(addonEngine.list())
      .then((list) => { if (alive) setAddons(list); })
      .catch(() => { if (alive) setAddons([]); });
    return () => { alive = false; };
  }, []);

  const rows = useMemo<TvRow[]>(() => {
    const clean = unique(items).filter((m) => m.poster && m.name);
    const realCatalog = clean.filter((m) => !findShowcaseMeta(m.id));
    const q = query.trim().toLowerCase();
    const searched = q
      ? realCatalog.filter((m) => [m.name, m.description, ...(m.genres ?? [])].join(' ').toLowerCase().includes(q))
      : realCatalog;
    const movies = searched.filter((m) => m.type === 'movie');
    const series = searched.filter((m) => m.type === 'series');
    const open = clean.filter((m) => findShowcaseMeta(m.id));
    const upcoming = searched.filter((m) => m.upcoming || m.genres?.includes('Upcoming'));
    const currentYear = new Date().getFullYear();
    const highRated = searched.filter((m) => (m.rating ?? 0) >= 7 && !m.upcoming && (!m.year || m.year <= currentYear));
    return [
      { id: 'continue', title: q ? 'Search results' : 'TV Focus picks', caption: q ? `Matching “${query}”` : 'Remote-friendly launch row', items: searched.slice(0, 18) },
      { id: 'movies', title: 'Trending movies', caption: 'Real Cinemeta movie catalog', items: movies.slice(0, 18) },
      { id: 'series', title: 'Popular series', caption: 'Real Cinemeta series catalog', items: series.slice(0, 18) },
      { id: 'rated', title: 'Critics picks', caption: 'High-rated available titles', items: highRated.slice(0, 18) },
      { id: 'upcoming', title: 'Upcoming', caption: 'Announced upcoming titles, metadata only until release', items: upcoming.slice(0, 18) },
      { id: 'open', title: 'Open cinema — free & legal', caption: 'Playable public-domain and Creative-Commons showcase', items: open.slice(0, 18) },
    ].filter((row) => row.items.length > 0);
  }, [items, query]);

  const active = rows[focus.r]?.items[focus.c] ?? rows[0]?.items[0];
  const activeRow = rows[focus.r];

  const clampFocus = useCallback((r: number, c: number) => {
    const nextR = Math.max(0, Math.min(rows.length - 1, r));
    const len = rows[nextR]?.items.length ?? 1;
    const nextC = Math.max(0, Math.min(len - 1, c));
    setFocus({ r: nextR, c: nextC });
  }, [rows]);

  useEffect(() => {
    clampFocus(focus.r, focus.c);
  }, [rows.length]);

  useEffect(() => {
    const el = document.getElementById(`tv-card-${focus.r}-${focus.c}`);
    el?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  }, [focus, reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === searchRef.current && !['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); clampFocus(focus.r, focus.c + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); clampFocus(focus.r, focus.c - 1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); clampFocus(focus.r + 1, focus.c); }
      if (e.key === 'ArrowUp') { e.preventDefault(); clampFocus(focus.r - 1, focus.c); }
      if (e.key === 'Enter' && active) { e.preventDefault(); navigate(`/app/detail/${active.type}/${active.id}`); }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); navigate('/app'); }
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, clampFocus, focus.c, focus.r, navigate]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-ink" data-testid="tv-focus-mode">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.45 }}
          >
            {posterBg(active) && <img src={posterBg(active)} alt="" className="h-full w-full object-cover opacity-45 blur-[1px]" />}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black via-[#030612]/90 to-black/45" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-40 py-28">
        <div>
          <p className="text-micro uppercase tracking-[0.35em] text-cyan">Elitebox TV Focus</p>
          <h1 className="mt-6 font-display text-display-l text-chrome">Remote-first streaming wall</h1>
        </div>
        <div className="flex items-center gap-12">
          <div className="glass-1 flex min-w-[320px] items-center gap-10 rounded-full px-16 py-10">
            <Search size={16} className="text-cyan" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setFocus({ r: 0, c: 0 }); }}
              placeholder="Search from the sofa…"
              className="w-full bg-transparent text-caption text-ink outline-none placeholder:text-muted"
              data-testid="tv-search-input"
            />
            {query && <button className="focusable text-muted hover:text-ink" onClick={() => setQuery('')} aria-label="Clear TV search"><X size={16} /></button>}
          </div>
          <Link to="/app" className="focusable glass-1 rounded-full px-18 py-10 text-caption text-muted hover:text-ink">Exit</Link>
        </div>
      </header>

      <main className="relative z-10 flex h-[calc(100dvh-116px)] flex-col justify-end gap-24 px-40 pb-36">
        {active && (
          <section className="max-w-3xl" data-testid="tv-active-title">
            <p className="text-micro uppercase tracking-[0.25em] text-cyan">{activeRow?.title ?? 'Featured'}</p>
            <h2 className="mt-8 font-display text-display-xl text-chrome">{active.name}</h2>
            <p className="mt-8 text-caption uppercase tracking-[0.14em] text-muted">{itemMeta(active)}</p>
            <p className="mt-12 line-clamp-2 max-w-2xl text-body-l text-muted">{active.description}</p>
            <div className="mt-18 flex items-center gap-12">
              <Link to={`/app/player/${active.type}/${active.id}`} className="focusable inline-flex items-center gap-8 rounded-full bg-white px-20 py-12 text-caption font-semibold text-black hover:bg-cyan">
                <Play size={16} fill="currentColor" /> Play
              </Link>
              <Link to={`/app/detail/${active.type}/${active.id}`} className="focusable glass-1 rounded-full px-20 py-12 text-caption text-ink hover:text-cyan">Details</Link>
              <Link to="/app/addons" className="focusable glass-1 inline-flex items-center gap-8 rounded-full px-20 py-12 text-caption text-muted hover:text-ink"><Puzzle size={15} /> Addons {addons.length ? `(${addons.length})` : ''}</Link>
            </div>
          </section>
        )}

        {loading && <div className="glass-1 rounded-2xl p-24 text-muted">Loading TV catalogs…</div>}
        {!loading && rows.length === 0 && <div className="glass-1 rounded-2xl p-24 text-muted">No TV-ready titles found. Check addon catalog health.</div>}
        <section className="space-y-20" aria-label="TV rows">
          {rows.map((row, r) => (
            <div key={row.id}>
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h3 className="font-display text-title">{row.title}</h3>
                  <p className="text-caption text-muted">{row.caption}</p>
                </div>
                <div className="hidden items-center gap-8 text-micro uppercase text-muted md:flex"><ChevronLeft size={14} /> arrows / enter <ChevronRight size={14} /></div>
              </div>
              <div className="no-scrollbar flex gap-14 overflow-x-auto pb-8">
                {row.items.map((item, c) => {
                  const selected = focus.r === r && focus.c === c;
                  return (
                    <button
                      key={`${row.id}-${item.id}`}
                      id={`tv-card-${r}-${c}`}
                      type="button"
                      onClick={() => { setFocus({ r, c }); navigate(`/app/detail/${item.type}/${item.id}`); }}
                      onFocus={() => setFocus({ r, c })}
                      className={cn('focusable group relative h-[210px] w-[150px] shrink-0 overflow-hidden rounded-xl bg-navy text-left outline-none transition', selected ? 'ring-2 ring-cyan shadow-focus-glow scale-[1.06]' : 'ring-1 ring-white/10 hover:ring-white/25')}
                      data-testid="tv-title-card"
                    >
                      <img src={item.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-10 pt-32">
                        <p className="line-clamp-2 text-caption font-semibold text-ink">{item.name}</p>
                        <p className="mt-2 text-micro uppercase text-muted">{itemMeta(item)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
