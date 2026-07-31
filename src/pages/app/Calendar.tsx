/**
 * Release Calendar — `/app/calendar`.
 *
 * Every announced premiere on one honest timeline: countdowns and .ics
 * export appear only for officially dated titles, everything else is
 * "date TBA" — never an invented day. Watchlisted premieres surface an
 * arrival toast once their confirmed date passes (local, per device).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Bell, BellRing, Bookmark, BookmarkCheck, CalendarClock, CalendarPlus, Sparkles } from 'lucide-react';
import { findShowcaseMeta } from '@/data/showcase';
import { useCatalogItems } from '@/pages/app/Discover';
import { useLibrary } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import {
  countdownTo,
  downloadIcs,
  drainArrivedReleases,
  monthLabel,
  releaseMonthKey,
} from '@/lib/releases';
import { ButtonGhost, ButtonNeon, Eyebrow, GlassPanel, spring, toast } from '@/components/ui-elite';
import { cn } from '@/lib/utils';

/* ── live countdown (ticking every second) ─────────────────────────────── */

function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const c = countdownTo(iso, now);
  if (c.arrived) {
    return <span className="font-mono text-[12px] text-ok">Premiered</span>;
  }
  const cells: Array<[number, string]> = [
    [c.days, 'd'],
    [c.hours, 'h'],
    [c.minutes, 'm'],
    [c.seconds, 's'],
  ];
  return (
    <span className="flex items-center gap-8" aria-label={`Premieres in ${c.days} days ${c.hours} hours`}>
      {cells.map(([v, unit]) => (
        <span key={unit} className="glass-1 rounded-md px-8 py-4 font-mono text-[12px] text-cyan">
          {String(v).padStart(2, '0')}
          <span className="ml-2 text-muted">{unit}</span>
        </span>
      ))}
    </span>
  );
}

/* ── premiere card ─────────────────────────────────────────────────────── */

function PremiereCard({ item }: { item: MetaItem }) {
  const watchlist = useLibrary((s) => s.watchlist);
  const toggleWatchlist = useLibrary((s) => s.toggleWatchlist);
  const saved = watchlist.includes(item.id);
  const dated = Boolean(item.releaseDate);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={spring.smooth}
      className="glass-2 group relative overflow-hidden rounded-2xl"
    >
      <Link
        to={`/app/detail/${item.type}/${item.id}`}
        className="focusable relative block aspect-video overflow-hidden rounded-t-2xl"
        aria-label={`${item.name} — details`}
      >
        <img
          src={item.backdrop ?? item.poster}
          alt={`${item.name} key art`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-12 top-12 inline-flex items-center gap-6 rounded-full bg-deep/70 px-10 py-5 text-micro uppercase text-cyan ring-1 ring-cyan/40 backdrop-blur-sm">
          <Sparkles size={11} strokeWidth={1.75} />
          {item.releaseLabel ?? 'Coming soon'}
        </span>
      </Link>
      <div className="flex flex-col gap-12 p-20">
        <div className="flex items-start justify-between gap-12">
          <div className="flex min-w-0 flex-col gap-4">
            <Link
              to={`/app/detail/${item.type}/${item.id}`}
              className="focusable rounded-sm font-display text-title text-ink hover:text-cyan transition-colors"
            >
              {item.name}
            </Link>
            <span className="text-caption text-muted">
              {item.year ? `${item.year} · ` : ''}{item.genres.slice(0, 3).join(' · ')}
            </span>
          </div>
          {dated && item.releaseDate ? (
            <Countdown iso={item.releaseDate} />
          ) : (
            <span
              className="inline-flex shrink-0 items-center gap-6 rounded-full border border-white/[.10] px-10 py-5 font-mono text-[11px] text-muted"
              title="The premiere date has not been officially announced"
            >
              <CalendarClock size={12} strokeWidth={1.75} />
              DATE TBA
            </span>
          )}
        </div>
        <p className="text-caption text-muted line-clamp-2">{item.description}</p>
        <div className="flex flex-wrap items-center gap-8 border-t border-white/[.06] pt-12">
          <ButtonNeon
            onClick={() => {
              toggleWatchlist(item.id);
              toast(saved ? `${item.name} removed from Watchlist` : `${item.name} — we'll flag it the moment it lands`);
            }}
            aria-pressed={saved}
            className="px-14 py-7 text-micro"
          >
            {saved ? <BookmarkCheck size={14} strokeWidth={1.75} /> : <Bookmark size={14} strokeWidth={1.75} />}
            {saved ? 'Tracking' : 'Remind me'}
          </ButtonNeon>
          <ButtonGhost
            onClick={() => {
              if (downloadIcs(item)) toast('Calendar file downloaded');
            }}
            disabled={!dated}
            className={cn('px-14 py-7 text-micro', !dated && 'opacity-40 pointer-events-none')}
            aria-label={dated ? `Export ${item.name} premiere to calendar` : 'Calendar export unlocks when the date is announced'}
          >
            <CalendarPlus size={14} strokeWidth={1.75} />
            {dated ? 'Add to calendar' : 'Add to calendar — needs a date'}
          </ButtonGhost>
        </div>
      </div>
    </motion.article>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function Calendar() {
  const watchlist = useLibrary((s) => s.watchlist);

  /* arrival reminders: watchlisted premieres whose confirmed date passed */
  useEffect(() => {
    const arrived = drainArrivedReleases(watchlist, findShowcaseMeta);
    for (const item of arrived) {
      toast(`${item.name} has premiered — it's on your Board now`, 'ok');
    }
    // watchlist identity changes don't re-fire arrivals (seen-set guards)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { items } = useCatalogItems();
  const upcoming = useMemo(
    () => items.filter((m) => m.upcoming || (m.year ?? 0) >= new Date().getFullYear() - 1).slice(0, 12),
    [items],
  );
  const groups = useMemo(() => {
    const map = new Map<string, MetaItem[]>();
    for (const item of upcoming) {
      const key = releaseMonthKey(item);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].sort(([a], [b]) => (a === 'tba' ? 1 : b === 'tba' ? -1 : a.localeCompare(b)));
  }, [upcoming]);
  const datedCount = upcoming.filter((m) => m.releaseDate).length;

  return (
    <div className="flex flex-col gap-40 pb-64 pt-32">
      <header className="flex flex-col gap-12">
        <Eyebrow>Release calendar</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">New & upcoming, one timeline.</h1>
        <p className="max-w-[62ch] text-body text-muted">
          The freshest titles across your installed catalogs — tracked against officially
          announced dates, never invented ones. Watchlist anything and Elitebox flags it
          the moment a confirmed date lands.
        </p>
        <div className="flex flex-wrap items-center gap-12 text-caption text-muted">
          <span className="inline-flex items-center gap-6">
            <Bell size={13} strokeWidth={1.75} className="text-cyan" />
            {upcoming.length} fresh title{upcoming.length === 1 ? '' : 's'} across your catalogs
          </span>
          <span className="inline-flex items-center gap-6">
            <BellRing size={13} strokeWidth={1.75} className="text-cyan" />
            {datedCount} with confirmed dates
          </span>
        </div>
      </header>

      {groups.map(([key, items]) => (
        <section key={key} className="flex flex-col gap-16">
          <h2 className="font-display text-title text-ink">
            {key === 'tba' ? 'Across your catalogs' : monthLabel(key)}
          </h2>
          <div className="grid gap-20 md:grid-cols-2">
            {items.map((item) => (
              <PremiereCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      <GlassPanel className="flex flex-col gap-8 p-24">
        <span className="text-micro uppercase text-muted">How tracking works</span>
        <p className="text-caption text-muted">
          Reminders live on this device: when a tracked premiere&apos;s confirmed date passes,
          the title surfaces on your Board with an arrival note. Install catalog addons to see
          their dated releases flow into this calendar automatically as they announce them.
        </p>
      </GlassPanel>
    </div>
  );
}
