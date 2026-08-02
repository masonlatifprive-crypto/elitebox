/**
 * Detail — /app/detail/:type/:id (detail.md).
 *
 * The orbital title page: parallax backdrop hero with poster, meta row,
 * synopsis, episodes rail (series) and the signature stream-sources panel —
 * addonEngine.getStreams() grouped by addon with live health dots, mono
 * latency, quality badges and real circuit-breaker state (BENCHED countdown
 * + Recover wired to addonEngine.recover).
 *
 * Play gating: without access (useAuth().hasAccess()) every play action
 * opens a PaywallCard modal instead of navigating; otherwise it routes to
 * /app/player/:type/:id?src=<index>.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCheck,
  ChevronRight,
  Clapperboard,
  Clock,
  Eye,
  EyeOff,
  Orbit,
  Play,
  Plus,
  RefreshCw,
  Satellite,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import { addonEngine } from '@/lib/addons/engine';
import { getAnimeCatalog, getCuratedGlobalTitles, getUpcomingTitles } from '@/lib/globalCatalog';
import { findShowcaseMeta } from '@/data/showcase';
import { parseSourceTitle, scoreSource } from '@/lib/sourceScore';
import { useAddons, useLibrary } from '@/lib/store';
import { detectTV } from '@/lib/tvnav';
import { useAuth } from '@/lib/auth';
import PaywallCard from '@/components/PaywallCard';
import Shelf from '@/components/Shelf';
import TrailerModal from '@/components/TrailerModal';
import {
  Badge,
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  EmptyState,
  HealthDot,
  Modal,
  spring,
  toast,
} from '@/components/ui-elite';
import type { AddonHealth, AddonInfo, MetaItem, MetaType, MetaVideo, StreamSource } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

/* Episode runtimes for the showcase series (minutes, real runtimes). */
const EPISODE_RUNTIME: Record<string, number> = {
  'caminandes-series-s01e01': 2,
  'caminandes-series-s01e02': 3,
  'caminandes-series-s01e03': 3,
};

function episodeArt(meta: MetaItem, video: MetaVideo): string {
  if (meta.id === 'caminandes-series' && video.episode) {
    return `/art/backdrop-caminandes-${video.episode}.jpg`;
  }
  return meta.backdrop ?? meta.poster;
}

function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    : `${m}:${String(s % 60).padStart(2, '0')}`;
}

function QualityChip({ quality }: { quality: string }) {
  const k = quality.toUpperCase();
  if (k === 'HD' || k === '4K' || k === 'LIVE') return <Badge kind={k} />;
  return (
    <span className="glass-1 inline-flex items-center rounded-md px-8 py-2 text-micro uppercase text-muted">
      {quality}
    </span>
  );
}

/** Live health readout for one addon; ticks every second while benched. */
function useAddonHealth(addonId: string, rev: number): AddonHealth {
  const [health, setHealth] = useState<AddonHealth>(() => addonEngine.health(addonId));
  useEffect(() => {
    setHealth(addonEngine.health(addonId));
    const t = window.setInterval(() => {
      const next = addonEngine.health(addonId);
      setHealth(next);
      if (next.circuit !== 'open') window.clearInterval(t);
    }, 1000);
    return () => window.clearInterval(t);
  }, [addonId, rev]);
  return health;
}

interface SourceGroup {
  addon: AddonInfo;
  streams: Array<{ source: StreamSource; index: number }>;
}

function SourceGroupPanel({
  group,
  rev,
  onPlay,
  onRecovered,
}: {
  group: SourceGroup;
  rev: number;
  onPlay: (index: number) => void;
  onRecovered: () => void;
}) {
  const { t } = useT();
  const health = useAddonHealth(group.addon.id, rev);
  const [recovering, setRecovering] = useState(false);

  const recover = async () => {
    setRecovering(true);
    await addonEngine.recover(group.addon.id);
    setRecovering(false);
    toast(t('app.detail.toastRecovered', { name: group.addon.name }));
    onRecovered();
  };

  const benched = health.circuit === 'open';
  const degraded = !benched && health.status === 'degraded';

  return (
    <div className="border-b border-white/[.06] last:border-b-0">
      {/* group header */}
      <div className="flex flex-wrap items-center gap-12 px-16 md:px-24 pt-16 pb-8">
        <img
          src={group.addon.icon}
          alt=""
          loading="lazy"
          className="h-28 w-28 rounded-md object-cover ring-1 ring-white/[.08]"
        />
        <span className="text-caption font-semibold text-ink">{group.addon.name}</span>
        <HealthDot status={health.status} latencyMs={health.latencyMs} />
        {benched && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-error">
            {t('app.detail.benched', { s: health.retryInSec ?? 0 })}
          </span>
        )}
        {degraded && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-warn">{t('app.detail.degradedBadge')}</span>
        )}
        {(benched || degraded) && (
          <button
            type="button"
            onClick={recover}
            disabled={recovering}
            className="focusable ml-auto inline-flex items-center gap-6 rounded-full px-12 py-6 text-micro font-semibold uppercase text-muted hover:text-ink hover:bg-white/[.06] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} strokeWidth={1.75} className={recovering ? 'animate-spin' : ''} />
            {recovering ? t('app.detail.probing') : benched ? t('app.detail.recover') : t('app.detail.testNow')}
          </button>
        )}
      </div>

      {benched ? (
        <p className="px-16 md:px-24 pb-16 text-caption text-muted">
          {t('app.detail.circuitOpenBody', {
            for: health.retryInSec !== undefined ? t('app.detail.circuitOpenFor', { s: health.retryInSec }) : '',
          })}
        </p>
      ) : (
        <>
          {degraded && (
            <p className="px-16 md:px-24 pb-8 text-caption text-warn">
              {t('app.detail.degradedBody')}
            </p>
          )}
          <ul className="pb-8">
            {group.streams.map(({ source, index }, rank) => (
              <li key={source.id}>
                <button
                  type="button"
                  onClick={() => onPlay(index)}
                  className="focusable group flex w-full items-center gap-12 px-16 md:px-24 py-12 min-h-[56px] text-left cursor-pointer border-l-2 border-transparent hover:border-cyan hover:bg-white/[.04] transition-all duration-[180ms]"
                >
                  <QualityChip quality={source.quality} />
                  {rank === 0 && group.streams.length > 1 && (
                    <span
                      className="shrink-0 rounded-full bg-signature px-8 py-2 text-[10px] font-bold uppercase text-deep"
                      title={t('app.detail.autoBestTitle')}
                    >
                      {t('app.detail.autoBest')}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate text-caption text-ink">{source.title}</span>
                    <span className="flex flex-wrap items-center gap-6">
                      {parseSourceTitle(source.title).badges
                        .filter((b) => b !== source.quality)
                        .map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-cyan/30 px-8 py-1 font-mono text-[10px] uppercase text-cyan/90"
                          >
                            {b}
                          </span>
                        ))}
                      {source.sizeHint && (
                        <span className="font-mono text-[11px] text-muted">{source.sizeHint}</span>
                      )}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-6 text-caption font-semibold text-cyan opacity-80 group-hover:opacity-100">
                    <Play size={14} strokeWidth={1.75} className="fill-current" />
                    {t('app.detail.play')}
                  </span>
                </button>
              </li>
            ))}
            {group.streams.length === 0 && (
              <li className="px-16 md:px-24 py-12 text-caption text-muted">
                {t('app.detail.noStreams')}
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Detail() {
  const { t } = useT();
  const { type = 'movie', id = '' } = useParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const isTV = useMemo(() => detectTV(), []);
  const parallax = !reduceMotion && !isTV;

  const { hasAccess } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [meta, setMeta] = useState<MetaItem | null | undefined>(undefined);
  const [streams, setStreams] = useState<StreamSource[] | null>(null);
  const [catalog, setCatalog] = useState<MetaItem[]>([]);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [spoilerSafe, setSpoilerSafe] = useState(false);
  const [healthRev, setHealthRev] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const installed = useAddons((s) => s.installed);
  const enabled = useAddons((s) => s.enabled);
  const continueWatching = useLibrary((s) => s.continueWatching);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const toggleWatchlist = useLibrary((s) => s.toggleWatchlist);
  const watched = useLibrary((s) => s.watched);
  const toggleWatched = useLibrary((s) => s.toggleWatched);
  const favorites = useLibrary((s) => s.favorites);
  const watchlist = useLibrary((s) => s.watchlist);

  /* ── data loading ──────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setMeta(undefined);
    setStreams(null);
    setSynopsisOpen(false);
    window.scrollTo(0, 0);
    const metaType = type as MetaType;
    const curated = [...getCuratedGlobalTitles(), ...getUpcomingTitles()];
    const direct = curated.find((m) => m.id === id || m.id.split(':').at(-1) === id);
    if (direct) {
      setMeta(direct);
    } else if (id.startsWith('mal:')) {
      getAnimeCatalog().then((anime) => {
        if (!cancelled) setMeta(anime.find((m) => m.id === id) ?? null);
      });
    } else {
      const lookupId = id.includes(':') ? id.split(':').at(-1)! : id;
      addonEngine.getMeta(metaType, lookupId).then((m) => {
        if (!cancelled) setMeta(m ? { ...m, id } : null);
      });
    }
    addonEngine.getCatalog().then((items) => {
      if (!cancelled) setCatalog(items);
    });
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  const loadStreams = useCallback(() => {
    const metaType = type as MetaType;
    const lookupId = id.includes(':') ? id.split(':').at(-1)! : id;
    return addonEngine.getStreams(metaType, lookupId).then((s) => setStreams(s));
  }, [type, id]);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    const lookupId = id.includes(':') ? id.split(':').at(-1)! : id;
    addonEngine.getStreams(type as MetaType, lookupId).then((s) => {
      if (!cancelled) setStreams(s);
    });
    return () => {
      cancelled = true;
    };
  }, [meta, type, id]);

  const retryAllAddons = async () => {
    await Promise.all(installed.map((a) => addonEngine.recover(a.id)));
    setHealthRev((r) => r + 1);
    await loadStreams();
    toast(t('app.detail.toastRetriedAll'));
  };

  /* ── play gating ───────────────────────────────────────────────────── */
  const requestPlay = useCallback(
    (srcIndex?: number, targetId?: string) => {
      if (!hasAccess()) {
        setPaywallOpen(true);
        return;
      }
      const playId = targetId ?? id;
      const q = srcIndex !== undefined ? `?src=${srcIndex}` : '';
      navigate(`/app/player/${type}/${playId}${q}`);
    },
    [hasAccess, navigate, type, id],
  );

  /* ── derived data ──────────────────────────────────────────────────── */
  const groups = useMemo<SourceGroup[]>(() => {
    const statusRank = (addonId: string) => {
      const h = addonEngine.health(addonId);
      return h.circuit === 'open' ? 2 : h.status === 'degraded' ? 1 : 0;
    };
    return installed
      .filter((a) => enabled[a.id] && (a.builtin || a.resources.includes('stream')))
      .map((addon) => ({
        addon,
        streams: (streams ?? [])
          .map((source, index) => ({ source, index }))
          .filter(({ source }) => source.addonId === addon.id)
          /* source intelligence: best score first (reliability + quality) */
          .sort(
            (a, b) =>
              scoreSource(b.source, addonEngine.reliability(addon.id)).score -
              scoreSource(a.source, addonEngine.reliability(addon.id)).score,
          ),
      }))
      .sort((a, b) => statusRank(a.addon.id) - statusRank(b.addon.id));
    // healthRev intentionally re-reads circuit state after recovery
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installed, enabled, streams, healthRev]);

  const moreLikeThis = useMemo(() => {
    if (!meta) return [];
    return catalog
      .filter((m) => m.id !== meta.id && m.genres.some((g) => meta.genres.includes(g)))
      .slice(0, 8);
  }, [catalog, meta]);

  const firstEpisode = meta?.videos?.[0];
  const resumeEntry = useMemo(() => {
    if (!meta) return undefined;
    if (meta.type !== 'series') return continueWatching.find((e) => e.id === meta.id);
    return meta.videos
      ?.map((v) => continueWatching.find((e) => e.id === v.id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }, [meta, continueWatching]);

  const mainPlayTarget = meta?.type === 'series' ? (resumeEntry?.id ?? firstEpisode?.id ?? id) : id;
  /* Cinemeta trailers — the action only exists when real trailer ids do */
  const trailers = useMemo(() => meta?.trailers ?? [], [meta]);
  const inLibrary = meta ? favorites.includes(meta.id) : false;
  const inWatchlist = meta ? watchlist.includes(meta.id) : false;
  const isWatched = meta ? watched.includes(meta.id) : false;

  /* ── parallax (design.md §8: translateY 0→120px, scale 1.05→1.0) ───── */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const backdropY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);

  const typeLabel = type === 'series' ? t('app.rail.series') : type === 'channel' ? t('app.rail.live') : t('app.rail.movies');
  const typeHref = type === 'series' ? '/app/series' : type === 'channel' ? '/app/live' : '/app/movies';

  /* ── loading skeleton ──────────────────────────────────────────────── */
  if (meta === undefined) {
    return (
      <div className="animate-pulse">
        <div className="-mx-16 -mt-24 md:-ml-[96px] md:-mr-24 xl:-ml-[120px] xl:-mr-48 h-[78vh] min-h-[480px] bg-navy" />
        <div className="mt-24 flex max-w-2xl flex-col gap-12">
          <div className="h-12 w-1/3 rounded bg-white/[.06]" />
          <div className="h-40 w-3/4 rounded bg-white/[.06]" />
          <div className="h-14 w-2/3 rounded bg-white/[.06]" />
        </div>
      </div>
    );
  }

  /* ── unknown id: branded inline 404 ────────────────────────────────── */
  if (meta === null) {
    return (
      <EmptyState
        icon={Orbit}
        title={t('app.detail.notFoundTitle')}
        caption={t('app.detail.notFoundCaption')}
        action={<ButtonPrimary to="/app/discover">{t('app.detail.backToDiscover')}</ButtonPrimary>}
        className="min-h-[70dvh]"
      />
    );
  }

  const toggleLibrary = () => {
    toggleFavorite(meta.id);
    toast(inLibrary ? t('app.detail.toastRemovedFavorites') : t('app.detail.toastAddedFavorites'));
  };
  const toggleWatch = () => {
    toggleWatchlist(meta.id);
    toast(inWatchlist ? t('app.detail.toastRemovedWatchlist') : t('app.detail.toastAddedWatchlist'));
  };
  const toggleSeen = () => {
    toggleWatched(meta.id);
    toast(isWatched ? t('app.detail.toastUnwatched') : t('app.detail.toastWatched'));
  };
  /** Share via the OS sheet when available, else copy the deep link. */
  const shareTitle = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Elitebox — ${meta.name}`, text: meta.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast(t('app.detail.toastLinkCopied'));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error(t('app.detail.toastShareFailed'));
    }
  };

  const heroPad = 'px-16 md:pl-[96px] md:pr-24 xl:pl-[120px] xl:pr-48';

  return (
    <div className="pb-48">
      {/* ── S1 backdrop hero ──────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative -mx-16 -mt-24 md:-ml-[96px] md:-mr-24 xl:-ml-[120px] xl:-mr-48 h-[78vh] min-h-[480px] overflow-hidden"
      >
        <motion.div
          className="absolute inset-0"
          style={parallax ? { y: backdropY, scale: backdropScale } : undefined}
        >
          <motion.img
            src={meta.backdrop ?? meta.poster}
            alt=""
            fetchPriority="high"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="h-full w-full object-cover"
          />
        </motion.div>
        {/* cinematic masks */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-deep/85 via-deep/30 to-transparent" />
        <div className="absolute inset-0 [box-shadow:inset_0_0_160px_rgba(3,6,18,.8)]" />

        {/* content bottom-left */}
        <div className={cn('absolute inset-x-0 bottom-0 pb-64', heroPad)}>
          <div className="flex items-end gap-32">
            <div className="flex max-w-2xl flex-col gap-16">
              {/* breadcrumb */}
              <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                aria-label={t('app.detail.breadcrumbAria')}
                className="flex items-center gap-6 text-micro uppercase text-muted"
              >
                <Link to="/app" className="focusable rounded hover:text-ink">{t('app.rail.home')}</Link>
                <ChevronRight size={12} strokeWidth={1.75} />
                <Link to={typeHref} className="focusable rounded hover:text-ink">{typeLabel}</Link>
                <ChevronRight size={12} strokeWidth={1.75} />
                <span className="text-ink">{meta.name}</span>
              </motion.nav>

              {/* title — chrome-silver Display-XL */}
              <motion.h1
                initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.smooth, delay: 0.05 }}
                className="font-display text-display-xl text-chrome"
              >
                {meta.name}
              </motion.h1>

              {/* meta row */}
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.smooth, delay: 0.12 }}
                className="flex flex-wrap items-center gap-10 text-caption text-muted"
              >
                {/* mobile poster thumb */}
                <img
                  src={meta.poster}
                  alt=""
                  className="mr-4 h-72 w-48 rounded-md object-cover ring-1 ring-white/[.12] xl:hidden"
                />
                {meta.year && <span className="font-mono">{meta.year}</span>}
                {meta.runtime !== undefined && (
                  <span className="inline-flex items-center gap-4">
                    <Clock size={14} strokeWidth={1.75} />
                    {meta.runtime} min
                  </span>
                )}
                {meta.rating !== undefined && (
                  <span className="inline-flex items-center gap-4 text-ink">
                    <Star size={14} strokeWidth={1.75} className="fill-cyan text-cyan" />
                    {meta.rating.toFixed(1)}
                  </span>
                )}
                {meta.upcoming ? (
                  <span className="inline-flex items-center gap-6 rounded-full bg-gradient-to-r from-cyan/20 to-purple/20 px-12 py-5 text-micro uppercase tracking-wider text-cyan ring-1 ring-cyan/40">
                    <Sparkles size={12} strokeWidth={1.75} />
                    {meta.releaseLabel ?? t('app.poster.comingSoon')}
                  </span>
                ) : meta.live ? (
                  <Badge kind="LIVE" />
                ) : (
                  <Badge kind="HD" />
                )}
                {meta.genres.map((g) => (
                  <span key={g} className="glass-1 rounded-full px-10 py-4 text-micro uppercase text-muted">
                    {g}
                  </span>
                ))}
                {meta.upcoming ? (
                  <span className="text-micro uppercase text-highlight">{t('app.home.upcomingTag')}</span>
                ) : (
                  /* CC-BY attribution is only truthful for the built-in
                     Blender showcase — never for external catalog titles. */
                  findShowcaseMeta(meta.id) &&
                  (meta.type === 'movie' || meta.type === 'series') && (
                    <span className="text-micro uppercase text-muted/70">Blender Foundation · CC-BY</span>
                  )
                )}
              </motion.div>

              {/* synopsis */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="max-w-[62ch]"
              >
                <p className={cn('text-body text-muted', !synopsisOpen && 'line-clamp-3')}>
                  {meta.description}
                </p>
                {meta.description.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setSynopsisOpen((v) => !v)}
                    className="focusable mt-4 rounded text-caption font-semibold text-cyan hover:underline cursor-pointer"
                  >
                    {synopsisOpen ? t('app.detail.less') : t('app.detail.more')}
                  </button>
                )}
              </motion.div>

              {/* actions */}
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.smooth, delay: 0.28 }}
                className="flex flex-wrap items-center gap-12 pt-8"
              >
                {meta.upcoming ? (
                  <>
                    <ButtonNeon onClick={toggleWatch} aria-pressed={inWatchlist}>
                      {inWatchlist ? (
                        <BookmarkCheck size={16} strokeWidth={1.75} />
                      ) : (
                        <Bookmark size={16} strokeWidth={1.75} />
                      )}
                      {inWatchlist ? t('app.detail.onWatchlist') : t('app.detail.watchlistArrival')}
                    </ButtonNeon>
                    <ButtonGhost onClick={toggleLibrary} aria-pressed={inLibrary}>
                      {inLibrary ? <Check size={16} strokeWidth={1.75} /> : <Plus size={16} strokeWidth={1.75} />}
                      {inLibrary ? t('app.detail.inFavorites') : t('app.detail.favorites')}
                    </ButtonGhost>
                    <ButtonGhost onClick={shareTitle} aria-label={t('app.detail.shareAria', { name: meta.name })}>
                      <Share2 size={16} strokeWidth={1.75} />
                      {t('app.detail.share')}
                    </ButtonGhost>
                  </>
                ) : (
                  <>
                    <ButtonPrimary onClick={() => requestPlay(undefined, mainPlayTarget)}>
                      <Play size={16} strokeWidth={1.75} className="fill-current" />
                      {resumeEntry ? t('app.home.resumeAt', { time: fmtClock(resumeEntry.progressSec) }) : t('app.detail.play')}
                    </ButtonPrimary>
                    <ButtonNeon onClick={toggleLibrary} aria-pressed={inLibrary}>
                      {inLibrary ? (
                        <Check size={16} strokeWidth={1.75} />
                      ) : (
                        <Plus size={16} strokeWidth={1.75} />
                      )}
                      {inLibrary ? t('app.detail.inFavorites') : t('app.detail.favorites')}
                    </ButtonNeon>
                    <ButtonGhost onClick={toggleWatch} aria-pressed={inWatchlist}>
                      {inWatchlist ? (
                        <BookmarkCheck size={16} strokeWidth={1.75} className="text-cyan" />
                      ) : (
                        <Bookmark size={16} strokeWidth={1.75} />
                      )}
                      {inWatchlist ? t('app.home.inWatchlist') : t('app.detail.watchlist')}
                    </ButtonGhost>
                    <ButtonGhost onClick={toggleSeen} aria-pressed={isWatched}>
                      {isWatched ? (
                        <EyeOff size={16} strokeWidth={1.75} className="text-cyan" />
                      ) : (
                        <Eye size={16} strokeWidth={1.75} />
                      )}
                      {isWatched ? t('app.detail.watched') : t('app.detail.markWatched')}
                    </ButtonGhost>
                    {meta.officialUrl && (
                      <ButtonGhost href={meta.officialUrl}>
                        <Clapperboard size={16} strokeWidth={1.75} />
                        {t('app.detail.trailerInfo')}
                      </ButtonGhost>
                    )}
                    <ButtonGhost onClick={shareTitle} aria-label={t('app.detail.shareAria', { name: meta.name })}>
                      <Share2 size={16} strokeWidth={1.75} />
                      {t('app.detail.share')}
                    </ButtonGhost>
                    {resumeEntry && (
                      <span className="text-micro uppercase text-cyan">
                        {t('app.detail.percentWatched', {
                          pct: Math.round((resumeEntry.progressSec / Math.max(1, resumeEntry.durationSec)) * 100),
                        })}
                      </span>
                    )}
                  </>
                )}
                {trailers.length > 0 && (
                  <ButtonGhost onClick={() => setTrailerOpen(true)}>
                    <Clapperboard size={16} strokeWidth={1.75} />
                    {t('app.detail.watchTrailer')}
                  </ButtonGhost>
                )}
              </motion.div>
            </div>

            {/* poster — shared-element target, xl+ only */}
            <motion.div
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.cinematic}
              className="ml-auto hidden shrink-0 xl:block"
            >
              <img
                src={meta.poster}
                alt={t('app.detail.posterAlt', { name: meta.name })}
                className="w-200 rounded-lg ring-1 ring-white/[.12] shadow-aura-purple"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── S2 episodes (series only) ─────────────────────────────────── */}
      {meta.type === 'series' && meta.videos && meta.videos.length > 0 && (
        <section className="mt-48">
          <div className="mb-16 flex flex-wrap items-center gap-16">
            <h2 className="font-display text-display-l text-ink">{t('app.detail.episodes')}</h2>
            <span className="glass-1 rounded-full px-12 py-6 text-micro uppercase text-muted">
              {t('app.detail.seasonOne')}
            </span>
            <div className="ml-auto flex items-center gap-8">
              <ButtonGhost
                onClick={() => setSpoilerSafe((v) => !v)}
                aria-pressed={spoilerSafe}
                className="px-12 py-6 text-micro"
              >
                {spoilerSafe ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                {spoilerSafe ? t('app.detail.titlesHidden') : t('app.detail.hideTitles')}
              </ButtonGhost>
              <ButtonGhost
                onClick={() => {
                  for (const v of meta.videos ?? []) {
                    if (!watched.includes(v.id)) toggleWatched(v.id);
                  }
                  toast(t('app.detail.toastSeasonWatched'));
                }}
                className="px-12 py-6 text-micro"
              >
                <CheckCheck size={14} strokeWidth={1.75} />
                {t('app.detail.markSeasonWatched')}
              </ButtonGhost>
            </div>
          </div>
          <ul className="flex max-w-4xl flex-col gap-12">
            {meta.videos.map((video, i) => {
              const entry = continueWatching.find((e) => e.id === video.id);
              const pct = entry
                ? Math.min(100, (entry.progressSec / Math.max(1, entry.durationSec)) * 100)
                : 0;
              const epWatched = watched.includes(video.id);
              return (
                <motion.li
                  key={video.id}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...spring.smooth, delay: i * 0.05 }}
                >
                  <div className="glass-1 group flex items-center gap-16 rounded-xl p-12 transition-colors hover:bg-white/[.06]">
                    <div className="relative hidden shrink-0 sm:block">
                      <img
                        src={episodeArt(meta, video)}
                        alt={t('app.detail.episodeThumbAlt', {
                          title: spoilerSafe
                            ? t('app.detail.episodeFallback', { n: video.episode ?? i + 1 })
                            : video.title,
                        })}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          'h-80 w-144 rounded-md object-cover ring-1 ring-white/[.08] transition-all duration-300',
                          spoilerSafe && 'blur-md saturate-50',
                        )}
                      />
                      {epWatched && (
                        <span className="absolute right-6 top-6 rounded-full bg-deep/80 p-4 text-ok ring-1 ring-ok/40">
                          <Check size={12} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      <span className="font-mono text-micro uppercase text-muted">
                        S{String(video.season ?? 1).padStart(2, '0')} E
                        {String(video.episode ?? i + 1).padStart(2, '0')}
                        {EPISODE_RUNTIME[video.id] ? ` · ${EPISODE_RUNTIME[video.id]} min` : ''}
                        {epWatched ? ` · ${t('app.detail.watched')}` : ''}
                      </span>
                      <span className="truncate text-title text-ink">
                        {spoilerSafe ? t('app.detail.episodeFallback', { n: video.episode ?? i + 1 }) : video.title}
                      </span>
                      {entry && !epWatched && (
                        <div className="h-3 w-full max-w-240 overflow-hidden rounded-full bg-white/[.08]">
                          <div className="h-full bg-signature" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleWatched(video.id);
                        toast(epWatched
                          ? t('app.detail.toastEpUnmarked', { title: spoilerSafe ? t('app.detail.episodeWord') : video.title })
                          : t('app.detail.toastEpWatched', { title: spoilerSafe ? t('app.detail.episodeWord') : video.title }));
                      }}
                      aria-label={epWatched
                        ? t('app.detail.unmarkAria', { title: video.title })
                        : t('app.detail.markAria', { title: video.title })}
                      aria-pressed={epWatched}
                      className={cn(
                        'focusable flex h-40 w-40 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer',
                        epWatched ? 'glass-2 text-ok' : 'text-muted opacity-0 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100',
                      )}
                    >
                      {epWatched ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestPlay(undefined, video.id)}
                      aria-label={t('app.catalog.playAria', { name: video.title })}
                      className="focusable glass-2 flex h-48 w-48 shrink-0 items-center justify-center rounded-full text-cyan transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Play size={20} strokeWidth={1.75} className="fill-current" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── S3 stream sources (coming-soon panel for upcoming originals) ── */}
      {meta.upcoming ? (
        <motion.section
          initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={spring.smooth}
          className="mt-48"
        >
          <div className="glass-2 relative max-w-4xl overflow-hidden rounded-2xl p-32 md:p-48">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-80 -top-80 h-240 w-240 rounded-full bg-cyan/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-64 -left-64 h-200 w-200 rounded-full bg-purple/10 blur-3xl"
            />
            <span className="inline-flex items-center gap-8 rounded-full bg-gradient-to-r from-cyan/20 to-purple/20 px-14 py-7 text-micro uppercase tracking-wider text-cyan ring-1 ring-cyan/40">
              <Sparkles size={13} strokeWidth={1.75} />
              {meta.releaseLabel ?? t('app.poster.comingSoon')}
            </span>
            <h2 className="mt-16 font-display text-display-l text-ink">
              {t('app.detail.arrivesTitle', { name: meta.name })}
            </h2>
            <p className="mt-8 max-w-[58ch] text-body text-muted">
              {t('app.detail.arrivesBody')}
            </p>
            <p className="mt-12 max-w-[58ch] text-caption text-muted/70">
              {t('app.detail.arrivesNote')}
            </p>
            <div className="mt-24 flex flex-wrap items-center gap-12">
              <ButtonNeon onClick={toggleWatch} aria-pressed={inWatchlist}>
                {inWatchlist ? (
                  <BookmarkCheck size={16} strokeWidth={1.75} />
                ) : (
                  <Bookmark size={16} strokeWidth={1.75} />
                )}
                {inWatchlist ? t('app.detail.onWatchlist') : t('app.detail.addToWatchlist')}
              </ButtonNeon>
              <ButtonGhost onClick={shareTitle}>
                <Share2 size={16} strokeWidth={1.75} />
                {t('app.detail.share')}
              </ButtonGhost>
            </div>
          </div>
        </motion.section>
      ) : (
      <motion.section
        initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={spring.smooth}
        className="mt-48"
      >
        <h2 className="font-display text-display-l text-ink">{t('app.detail.streamSources')}</h2>
        <p className="mt-4 mb-16 text-caption text-muted">{t('app.detail.streamSourcesSub')}</p>

        {streams === null ? (
          <div className="glass-2 max-w-4xl animate-pulse rounded-2xl p-24">
            <div className="mb-16 h-20 w-1/2 rounded bg-white/[.06]" />
            <div className="mb-12 h-40 rounded bg-white/[.06]" />
            <div className="h-40 rounded bg-white/[.06]" />
          </div>
        ) : streams.length === 0 && groups.every((g) => g.streams.length === 0) ? (
          <div className="glass-2 max-w-4xl rounded-2xl">
            <EmptyState
              icon={Satellite}
              title={t('app.detail.noSourcesTitle')}
              caption={t('app.detail.noSourcesCaption')}
              action={
                <div className="flex flex-wrap items-center justify-center gap-12">
                  <ButtonPrimary onClick={retryAllAddons}>{t('app.detail.retryAllAddons')}</ButtonPrimary>
                  <ButtonGhost to="/app/addons">{t('app.detail.addonHealth')}</ButtonGhost>
                </div>
              }
              className="py-48"
            />
          </div>
        ) : (
          <div className="glass-2 max-w-4xl overflow-hidden rounded-2xl">
            {groups.map((group) => (
              <SourceGroupPanel
                key={group.addon.id}
                group={group}
                rev={healthRev}
                onPlay={(index) => requestPlay(index)}
                onRecovered={() => {
                  setHealthRev((r) => r + 1);
                  loadStreams();
                }}
              />
            ))}
          </div>
        )}
      </motion.section>
      )}

      {/* ── S4 more like this ─────────────────────────────────────────── */}
      {moreLikeThis.length > 0 && (
        <section className="mt-48">
          <Shelf title={t('app.detail.moreLikeThis')} items={moreLikeThis} seeAllTo="/app/discover" />
        </section>
      )}

      {/* ── paywall gate ──────────────────────────────────────────────── */}
      <Modal open={paywallOpen} onClose={() => setPaywallOpen(false)}>
        <PaywallCard />
      </Modal>

      {/* ── trailer (only when the meta carries real trailer ids) ────── */}
      {trailers.length > 0 && (
        <TrailerModal
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          trailers={trailers}
          name={meta.name}
        />
      )}
    </div>
  );
}
