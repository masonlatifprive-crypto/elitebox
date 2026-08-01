/**
 * Stats — `/app/stats` (design stats.md).
 * The watch-stats dashboard: every number is computed on-device from the
 * profile's real `useLibrary` data (continue-watching progress, watchlist,
 * favorites). No vanity metrics, nothing awarded falsely — locked milestones
 * show honest progress.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  Clock,
  Clapperboard,
  Flame,
  Lock,
  Moon,
  Orbit,
  Play,
  Rocket,
  Trophy,
} from 'lucide-react';
import { ButtonNeon, EmptyState, GlassPanel, spring } from '@/components/ui-elite';
import { useLibrary } from '@/lib/store';
import { findShowcaseMeta } from '@/data/showcase';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

/* ── helpers ───────────────────────────────────────────────────────────── */

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function keyOfDate(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function currentStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const cursor = new Date();
  if (!days.has(keyOfDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(keyOfDate(cursor))) return 0;
  }
  let n = 0;
  while (days.has(keyOfDate(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

function longestStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const sorted = [...days]
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 86_400_000) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function formatHM(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/* ── count-up (reduced-motion safe) ────────────────────────────────────── */

function CountUp({ value, format, className }: { value: number; format?: (v: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const fmt = format ?? ((v: number) => String(Math.round(v)));
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
    const dur = 900;
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
  return <span className={className}>{fmt(display)}</span>;
}

/* ── genre bar ─────────────────────────────────────────────────────────── */

/* signature gradient: cyan -> highlight -> purple (locked tokens only) */
const SIGNATURE_BAR = 'linear-gradient(90deg,#7CD9EC,#8B7CE8,#A99BF0)';
const GENRE_STOPS = Array.from({ length: 6 }, () => SIGNATURE_BAR);

function GenreBar({ genre, minutes, pct, top, index }: { genre: string; minutes: number; pct: number; top: boolean; index: number }) {
  const { t } = useT();
  const topLabel = t('app.stats.topOrbit');
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ ...spring.smooth, delay: index * 0.06 }}
      className="flex items-center gap-16"
    >
      <span className="w-120 shrink-0 truncate text-caption text-ink max-md:w-88">{genre}</span>
      <div className="relative h-20 flex-1 overflow-hidden rounded-full bg-white/[.06]" title={`${minutes} min`}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: GENRE_STOPS[Math.min(index, GENRE_STOPS.length - 1)],
            transformOrigin: 'left',
          }}
          initial={reduce ? { width: `${pct}%` } : { scaleX: 0, width: `${pct}%` }}
          whileInView={reduce ? undefined : { scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
        />
      </div>
      <span className="w-48 shrink-0 text-right font-mono text-[12px] text-cyan">{pct}%</span>
      <span className="hidden w-72 shrink-0 text-right text-caption text-muted sm:block">
        {minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`}
      </span>
      {top && (
        <span className="hidden shrink-0 rounded-full bg-signature px-8 py-1 text-micro uppercase text-deep lg:block">
          {topLabel}
        </span>
      )}
    </motion.div>
  );
}

/* ── milestones ────────────────────────────────────────────────────────── */

interface Milestone {
  id: string;
  nameKey: string;
  conditionKey: string;
  icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
  earned: boolean;
  progress: string; // honest progress readout
}

function MilestoneChip({ m, index }: { m: Milestone; index: number }) {
  const { t } = useT();
  const Icon = m.earned ? m.icon : Lock;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...spring.smooth, delay: index * 0.06 }}
      className={cn(
        'glass-1 flex w-200 shrink-0 flex-col gap-8 rounded-xl p-16',
        m.earned ? 'border-cyan/50 shadow-[0_0_16px_rgba(124,217,236,.18)]' : 'opacity-45',
      )}
    >
      <span className={cn('glass-2 flex h-40 w-40 items-center justify-center rounded-full', m.earned ? 'text-cyan' : 'text-muted')}>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="text-caption font-semibold text-ink">{t(m.nameKey)}</span>
      <span className="text-micro uppercase text-muted">{t(m.conditionKey)}</span>
      <span className={cn('font-mono text-[11px]', m.earned ? 'text-ok' : 'text-muted')}>
        {m.progress}
      </span>
    </motion.div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function StatsPage() {
  const { t } = useT();
  const { continueWatching, watchlist, favorites } = useLibrary();

  const data = useMemo(() => {
    const entries = continueWatching.map((e) => ({ ...e, meta: findShowcaseMeta(e.id) }));
    const totalSec = entries.reduce((a, e) => a + e.progressSec, 0);
    const days = new Set(entries.map((e) => dayKey(e.updatedAt)));

    // minutes per calendar day (attributed to the day of last progress)
    const perDay = new Map<string, number>();
    for (const e of entries) {
      const k = dayKey(e.updatedAt);
      perDay.set(k, (perDay.get(k) ?? 0) + e.progressSec / 60);
    }
    let maxDayMin = 0;
    perDay.forEach((v) => {
      maxDayMin = Math.max(maxDayMin, v);
    });

    // genre minutes (progress split across the title's genres)
    const genreMin = new Map<string, number>();
    for (const e of entries) {
      if (!e.meta || e.meta.genres.length === 0) continue;
      const share = e.progressSec / 60 / e.meta.genres.length;
      for (const g of e.meta.genres) genreMin.set(g, (genreMin.get(g) ?? 0) + share);
    }
    const genres = [...genreMin.entries()]
      .map(([name, min]) => ({ name, min: Math.round(min) }))
      .filter((g) => g.min > 0)
      .sort((a, b) => b.min - a.min);
    const genreTotal = genres.reduce((a, g) => a + g.min, 0);

    const nightOwl = entries.some((e) => {
      const h = new Date(e.updatedAt).getHours();
      return h >= 2 && h < 5;
    });

    return {
      totalSec,
      inProgress: entries.length,
      avgCompletion:
        entries.length === 0
          ? 0
          : Math.round(
              (entries.reduce((a, e) => a + (e.durationSec > 0 ? Math.min(1, e.progressSec / e.durationSec) : 0), 0) /
                entries.length) *
                100,
            ),
      streak: currentStreak(days),
      longest: longestStreak(days),
      maxDayMin,
      genres,
      genreTotal,
      distinctGenres: genres.length,
      savedCount: new Set([...watchlist, ...favorites]).size,
      nightOwl,
      perDay,
    };
  }, [continueWatching, watchlist, favorites]);

  // 12-week heat strip: 12 columns (weeks) × 7 rows (days), oldest first.
  const heat = useMemo(() => {
    const cells: Array<{ date: Date; minutes: number }> = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 83);
    for (let i = 0; i < 84; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({ date: d, minutes: data.perDay.get(keyOfDate(d)) ?? 0 });
    }
    const max = Math.max(1, ...cells.map((c) => c.minutes));
    return { cells, max };
  }, [data.perDay]);

  const milestones: Milestone[] = [
    {
      id: 'first-stream',
      nameKey: 'app.stats.msFirstStreamName',
      conditionKey: 'app.stats.msFirstStreamCond',
      icon: Play,
      earned: data.inProgress > 0,
      progress: data.inProgress > 0
        ? t('app.stats.progressTitlesStarted', { count: data.inProgress })
        : t('app.stats.progressNoTitles'),
    },
    {
      id: 'marathon',
      nameKey: 'app.stats.msMarathonName',
      conditionKey: 'app.stats.msMarathonCond',
      icon: Rocket,
      earned: data.maxDayMin >= 180,
      progress:
        data.maxDayMin >= 180
          ? t('app.stats.progressBestDayHours', { h: Math.round(data.maxDayMin / 60) })
          : t('app.stats.progressBestDayMins', { m: Math.round(data.maxDayMin) }),
    },
    {
      id: 'explorer',
      nameKey: 'app.stats.msExplorerName',
      conditionKey: 'app.stats.msExplorerCond',
      icon: Orbit,
      earned: data.distinctGenres >= 5,
      progress: t('app.stats.progressGenres', { n: data.distinctGenres }),
    },
    {
      id: 'collector',
      nameKey: 'app.stats.msCollectorName',
      conditionKey: 'app.stats.msCollectorCond',
      icon: Bookmark,
      earned: data.savedCount >= 10,
      progress: t('app.stats.progressSaved', { n: data.savedCount }),
    },
    {
      id: 'loyal-orbit',
      nameKey: 'app.stats.msLoyalName',
      conditionKey: 'app.stats.msLoyalCond',
      icon: Flame,
      earned: data.longest >= 7,
      progress: data.longest >= 7
        ? t('app.stats.progressDayBest', { n: data.longest })
        : t('app.stats.progressDayOf', { n: data.longest }),
    },
    {
      id: 'night-owl',
      nameKey: 'app.stats.msOwlName',
      conditionKey: 'app.stats.msOwlCond',
      icon: Moon,
      earned: data.nightOwl,
      progress: data.nightOwl ? t('app.stats.progressOwlEarned') : t('app.stats.progressOwlNone'),
    },
  ];

  const isEmpty = data.inProgress === 0 && data.savedCount === 0;

  return (
    <div className="flex flex-col gap-32">
      {/* ── S1 header + hero numbers ── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-8"
      >
        <h1 className="font-display text-display-xl text-ink max-md:text-[2.25rem]">
          {t('app.stats.headline')}
        </h1>
        <p className="text-caption text-muted">{t('app.stats.sub')}</p>
      </motion.header>

      <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
        {(
          [
            {
              label: t('app.stats.timeWatched'),
              icon: Clock,
              node: (
                <CountUp
                  value={data.totalSec}
                  format={(v) => formatHM(v)}
                  className="font-display text-display-2xl text-gradient-signature max-md:text-[2.75rem]"
                />
              ),
              sub: t('app.stats.timeWatchedSub'),
            },
            {
              label: t('app.stats.titlesInProgress'),
              icon: Clapperboard,
              node: (
                <CountUp
                  value={data.inProgress}
                  className="font-display text-display-2xl text-gradient-signature max-md:text-[2.75rem]"
                />
              ),
              sub: data.inProgress > 0
                ? t('app.stats.titlesInProgressSub', { pct: data.avgCompletion })
                : t('app.stats.titlesInProgressEmpty'),
            },
            {
              label: t('app.stats.currentStreak'),
              icon: Flame,
              node: (
                <span className="flex items-end gap-12">
                  <CountUp
                    value={data.streak}
                    className="font-display text-display-2xl text-gradient-signature max-md:text-[2.75rem]"
                  />
                  <motion.span
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="pb-8"
                  >
                    <Flame size={24} strokeWidth={1.75} className="text-purple" />
                  </motion.span>
                </span>
              ),
              sub: t('app.stats.streakSub', { longest: data.longest }),
            },
          ] as const
        ).map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.smooth, delay: i * 0.08 }}
          >
            <GlassPanel level={2} className="flex h-full flex-col gap-8 p-24">
              <span className="text-micro uppercase text-muted flex items-center gap-8">
                <tile.icon size={14} strokeWidth={1.75} className="text-cyan" />
                {tile.label}
              </span>
              {tile.node}
              <span className="text-caption text-muted">{tile.sub}</span>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Trophy}
          title={t('app.stats.emptyTitle')}
          caption={t('app.stats.emptyCaption')}
          action={<ButtonNeon to="/app">{t('app.library.watchSomething')}</ButtonNeon>}
        />
      ) : (
        <>
          {/* ── S2 genre breakdown ── */}
          {data.genres.length > 0 && (
            <section className="flex flex-col gap-16">
              <h2 className="font-display text-title text-ink">{t('app.stats.genreTitle')}</h2>
              <GlassPanel level={2} className="flex max-w-4xl flex-col gap-16 p-24">
                {data.genres.map((g, i) => (
                  <GenreBar
                    key={g.name}
                    genre={g.name}
                    minutes={g.min}
                    pct={data.genreTotal > 0 ? Math.round((g.min / data.genreTotal) * 100) : 0}
                    top={i === 0}
                    index={i}
                  />
                ))}
              </GlassPanel>
            </section>
          )}

          {/* ── S3 activity heat strip ── */}
          <section className="flex flex-col gap-16">
            <h2 className="font-display text-title text-ink">{t('app.stats.activityTitle')}</h2>
            <GlassPanel level={2} className="flex max-w-4xl flex-col gap-16 overflow-x-auto p-24">
              <div
                className="grid gap-6"
                style={{ gridTemplateRows: 'repeat(7, 10px)', gridAutoFlow: 'column', gridAutoColumns: '10px' }}
                role="img"
                aria-label={t('app.stats.heatAria')}
              >
                {heat.cells.map((c, i) => {
                  const intensity = c.minutes === 0 ? 0 : Math.max(1, Math.ceil((c.minutes / heat.max) * 4));
                  const bg =
                    intensity === 0
                      ? 'rgba(255,255,255,.06)'
                      : intensity === 1
                        ? 'rgba(124,217,236,.25)'
                        : intensity === 2
                          ? 'rgba(124,217,236,.55)'
                          : intensity === 3
                            ? 'rgba(169,155,240,.7)'
                            : 'rgba(139,124,232,.95)';
                  return (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.2, delay: Math.floor(i / 7) * 0.025 }}
                      className="h-10 w-10 rounded-[3px]"
                      style={{ background: bg }}
                      title={`${c.date.toLocaleDateString()} · ${Math.round(c.minutes)} min`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-8 text-micro uppercase text-muted">
                <span>{t('app.stats.less')}</span>
                {['rgba(255,255,255,.06)', 'rgba(124,217,236,.25)', 'rgba(124,217,236,.55)', 'rgba(169,155,240,.7)', 'rgba(139,124,232,.95)'].map(
                  (c) => (
                    <span key={c} className="h-10 w-10 rounded-[3px]" style={{ background: c }} />
                  ),
                )}
                <span>{t('app.stats.more')}</span>
              </div>
            </GlassPanel>
          </section>
        </>
      )}

      {/* ── S4 milestones (always visible — greyed teaser when empty) ── */}
      <section className="flex flex-col gap-16">
        <h2 className="font-display text-title text-ink">{t('app.stats.milestonesTitle')}</h2>
        <div className="flex gap-16 overflow-x-auto no-scrollbar pb-8">
          {milestones.map((m, i) => (
            <MilestoneChip key={m.id} m={m} index={i} />
          ))}
        </div>
      </section>

      {/* ── S5 honesty strip ── */}
      <p className="text-center text-caption text-muted">
        {t('app.stats.honestyNote')}
      </p>
    </div>
  );
}
