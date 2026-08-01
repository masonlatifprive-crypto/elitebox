/**
 * Live TV — /app/live (live.md).
 * Real channels from installed live/catalog addons with health chips and
 * one-tap play. Channels show only their real metadata (name, art, live
 * status, description) — no program schedule is fabricated: without EPG
 * data the honest state is "Live now". 10-foot first; number keys 1–9
 * jump to channels on TV.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Copy, MoreHorizontal, Play, Radio, RefreshCw, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import { Badge, ButtonNeon, ButtonPrimary, EmptyState, HealthDot, spring, toast } from '@/components/ui-elite';
import { useCatalogItems } from '@/pages/app/Discover';
import { addonEngine } from '@/lib/addons/engine';
import { getShowcaseStreams } from '@/data/showcase';
import { useAddons } from '@/lib/store';
import type { AddonHealth, MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

function signalFor(health?: AddonHealth): 1 | 2 | 3 {
  if (!health || health.status === 'down') return 1;
  const ms = health.latencyMs ?? 0;
  if (health.status === 'degraded' || ms > 800) return 2;
  return 3;
}

export default function Live() {
  const { t } = useT();
  const { items, loading, reload } = useCatalogItems();
  const reduceMotion = useReducedMotion();
  const installed = useAddons((s) => s.installed);
  const [health, setHealth] = useState<Record<string, AddonHealth>>({});
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [tick, setTick] = useState(0);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [probing, setProbing] = useState<string | null>(null);

  const channels = useMemo(() => items.filter((m) => m.type === 'channel'), [items]);
  const liveAddons = useMemo(
    () => installed.filter((a) => a.builtin || a.resources.includes('catalog')),
    [installed],
  );

  const featured = channels.find((c) => c.id === featuredId) ?? channels[0];

  const probe = useCallback(() => {
    setHealth(addonEngine.healthAll());
    setCheckedAt(Date.now());
  }, []);

  // Health probe on mount + re-probe every 10s; "checked Xs ago" ticks each second.
  useEffect(() => {
    probe();
    const reprobe = window.setInterval(probe, 10_000);
    const second = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      window.clearInterval(reprobe);
      window.clearInterval(second);
    };
  }, [probe]);
  void tick;

  // TV: number keys 1–9 jump to channels.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= Math.min(9, channels.length)) {
        const ch = channels[n - 1];
        setFeaturedId(ch.id);
        document.getElementById('live-stage')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [channels]);

  // Close the ⋯ menu on outside click.
  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuFor]);

  const addonForChannel = (_c: MetaItem) =>
    liveAddons.find((a) => a.builtin) ?? liveAddons[0];

  const testChannel = async (c: MetaItem) => {
    const addon = addonForChannel(c);
    if (!addon) return;
    setProbing(c.id);
    const h = await addonEngine.recover(addon.id);
    setHealth(addonEngine.healthAll());
    setProbing(null);
    toast(
      h.latencyMs && h.latencyMs > 0
        ? t('app.live.testToastMs', { name: c.name, ms: Math.round(h.latencyMs) })
        : t('app.live.testToastHealthy', { name: c.name }),
    );
  };

  const copyStreamUrl = async (c: MetaItem) => {
    const url = getShowcaseStreams(c.id)[0]?.url;
    if (!url) {
      toast.error(t('app.live.noStreamUrl', { name: c.name }));
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t('app.live.urlCopied'));
    } catch {
      toast(url);
    }
  };

  const secondsAgo = Math.max(0, Math.round((Date.now() - checkedAt) / 1000));
  const allUnhealthy =
    channels.length > 0 &&
    liveAddons.length > 0 &&
    liveAddons.every((a) => health[a.id]?.status === 'down');

  const featuredHealth = featured ? health[addonForChannel(featured)?.id ?? ''] : undefined;

  return (
    <div className="flex flex-col gap-32 pb-48 pt-16">
      {/* S1 — header */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.smooth}
        className="flex flex-wrap items-center gap-12"
      >
        <h1 className="font-display text-display-xl text-ink">{t('app.live.title')}</h1>
        {channels.length > 0 && (
          <span className="inline-flex items-center gap-8 text-caption text-muted">
            <span className="h-8 w-8 rounded-full bg-cyan animate-live-pulse" />
            {t('app.live.broadcasting', { count: channels.length })}
          </span>
        )}
        <span className="ml-auto font-mono text-micro uppercase text-muted" aria-live="polite">
          {t('app.live.checkedAgo', { s: secondsAgo })}
        </span>
      </motion.header>

      {loading ? (
        <>
          <div className="glass-1 relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl" aria-hidden>
            <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-white/[.06] to-transparent [animation-duration:1.4s]" />
          </div>
          <div className="grid grid-cols-1 gap-24 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-1 relative aspect-video overflow-hidden rounded-xl">
                <div className="absolute inset-0 animate-beam-slide bg-gradient-to-r from-transparent via-white/[.07] to-transparent [animation-duration:1.4s]" />
              </div>
            ))}
          </div>
        </>
      ) : channels.length === 0 ? (
        /* S4 — no live sources */
        <EmptyState
          icon={Radio}
          title={t('app.live.emptyTitle')}
          caption={t('app.live.emptyCaption')}
          action={<ButtonPrimary to="/store">{t('app.discover.openStore')}</ButtonPrimary>}
        />
      ) : allUnhealthy ? (
        <EmptyState
          icon={Radio}
          title={t('app.live.allDownTitle')}
          caption={liveAddons.map((a) => t('app.live.circuitOpen', { name: a.name })).join(' · ')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-12">
              <ButtonNeon to="/app/addons">{t('app.live.openHealth')}</ButtonNeon>
              <ButtonPrimary
                onClick={() => {
                  reload();
                  probe();
                }}
              >
                <RefreshCw size={14} strokeWidth={1.75} /> {t('app.live.retryAll')}
              </ButtonPrimary>
            </div>
          }
        />
      ) : (
        <>
          {/* S2 — featured channel stage */}
          {featured && (
            <motion.section
              id="live-stage"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.cinematic}
              className="relative w-full max-w-5xl rounded-2xl p-[1px] overflow-hidden"
              aria-label={t('app.live.stageAria', { name: featured.name })}
            >
              {/* animated gradient border (6s rotation loop) */}
              <motion.div
                aria-hidden
                className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#7CD9EC,#8B7CE8,#A99BF0,#7CD9EC)]"
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={reduceMotion ? undefined : { repeat: Infinity, duration: 6, ease: 'linear' }}
              />
              <div className="glass-3 relative overflow-hidden rounded-2xl">
                <div className="relative aspect-video">
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={featured.id}
                      src={featured.backdrop ?? featured.poster}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,6,18,.95)] via-[rgba(3,6,18,.3)] to-transparent" />
                  <div className="absolute left-16 top-16">
                    <Badge kind="LIVE" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-12 p-24 md:p-32">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featured.id}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={spring.smooth}
                        className="flex flex-col gap-8"
                      >
                        <h2 className="font-display text-display-l text-ink">{featured.name}</h2>
                        <p className="text-caption text-muted">
                          {featured.description || t('app.live.liveNow')}
                        </p>
                        <div className="flex flex-wrap items-center gap-12">
                          <ButtonPrimary to={`/app/player/channel/${featured.id}`}>
                            <Play size={16} strokeWidth={1.75} fill="currentColor" /> {t('app.live.watchNow')}
                          </ButtonPrimary>
                          {featuredHealth && (
                            <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-6 text-caption text-muted">
                              <HealthDot status={featuredHealth.status} latencyMs={featuredHealth.latencyMs} />
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* S3 — channel grid */}
          <div className="grid grid-cols-1 gap-24 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c, i) => {
              const h = health[addonForChannel(c)?.id ?? ''];
              const signal = signalFor(h);
              const SignalIcon = signal === 3 ? SignalHigh : signal === 2 ? SignalMedium : SignalLow;
              return (
                <motion.article
                  key={c.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...spring.smooth, delay: i * 0.06 }}
                  className="glass-1 group/ch flex flex-col overflow-hidden rounded-xl transition-shadow duration-150 hover:shadow-aura-purple"
                >
                  {/* art — click sets featured */}
                  <button
                    type="button"
                    onClick={() => setFeaturedId(c.id)}
                    aria-label={t('app.live.featureAria', { name: c.name })}
                    className="focusable relative block aspect-video cursor-pointer overflow-hidden"
                  >
                    <img
                      src={c.backdrop ?? c.poster}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/ch:scale-[1.04]"
                    />
                    <div className="absolute left-8 top-8">
                      <Badge kind="LIVE" />
                    </div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ ...spring.snappy, delay: i * 0.06 + 0.04 }}
                      className="glass-1 absolute right-8 top-8 inline-flex items-center gap-6 rounded-full px-10 py-4"
                    >
                      {probing === c.id ? (
                        <RefreshCw size={12} strokeWidth={1.75} className="animate-spin text-cyan" />
                      ) : (
                        <HealthDot status={h?.status ?? 'ok'} latencyMs={h?.latencyMs} />
                      )}
                    </motion.span>
                    {featured?.id === c.id && (
                      <span className="absolute inset-x-0 bottom-0 h-3 bg-signature" aria-hidden />
                    )}
                  </button>

                  {/* body */}
                  <div className="flex flex-1 flex-col gap-4 p-16">
                    <div className="flex items-start justify-between gap-8">
                      <div className="min-w-0">
                        <h3 className="font-display text-title text-ink">{c.name}</h3>
                        <p className="text-caption text-muted">{c.genres.join(' · ')}</p>
                      </div>
                      {/* ⋯ channel menu */}
                      <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          aria-label={t('app.home.optionsFor', { name: c.name })}
                          aria-expanded={menuFor === c.id}
                          onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                          className="focusable cursor-pointer rounded-full p-6 text-muted hover:bg-white/[.06] hover:text-ink"
                        >
                          <MoreHorizontal size={16} strokeWidth={1.75} />
                        </button>
                        <AnimatePresence>
                          {menuFor === c.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.96 }}
                              transition={spring.snappy}
                              className="glass-2 absolute right-0 top-full z-40 mt-6 flex min-w-[190px] flex-col gap-2 rounded-xl p-6"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuFor(null);
                                  void testChannel(c);
                                }}
                                className="focusable flex cursor-pointer items-center gap-8 rounded-lg px-12 py-8 text-left text-caption font-semibold text-ink hover:bg-white/[.06]"
                              >
                                <RefreshCw size={14} strokeWidth={1.75} /> {t('app.live.testChannel')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuFor(null);
                                  void copyStreamUrl(c);
                                }}
                                className="focusable flex cursor-pointer items-center gap-8 rounded-lg px-12 py-8 text-left text-caption font-semibold text-ink hover:bg-white/[.06]"
                              >
                                <Copy size={14} strokeWidth={1.75} /> {t('app.live.copyUrl')}
                              </button>
                              <Link
                                to="/app/addons"
                                className="focusable flex items-center gap-8 rounded-lg px-12 py-8 text-caption font-semibold text-ink hover:bg-white/[.06]"
                              >
                                <Radio size={14} strokeWidth={1.75} /> {t('app.live.manageSource')}
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <p className="truncate text-caption text-muted">
                      {c.description || t('app.live.liveNow')}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-8 pt-4">
                      <ButtonNeon
                        to={`/app/player/channel/${c.id}`}
                        className="px-16 py-8 transition-transform duration-150 group-hover/ch:-translate-y-1"
                      >
                        <Play size={14} strokeWidth={1.75} fill="currentColor" /> {t('app.live.watch')}
                      </ButtonNeon>
                      <span
                        className="inline-flex items-center gap-4 text-cyan"
                        title={h?.latencyMs ? t('app.live.signalMs', { ms: Math.round(h.latencyMs) }) : t('app.live.signal')}
                      >
                        <SignalIcon size={18} strokeWidth={1.75} />
                        <span className="font-mono text-[11px] text-muted">{signal}/3</span>
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <p className={cn('text-micro uppercase text-muted', 'font-mono')}>
            {t('app.live.tip', { max: Math.min(9, channels.length) })}
          </p>
        </>
      )}
    </div>
  );
}
