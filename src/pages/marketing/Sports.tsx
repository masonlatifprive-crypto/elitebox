/**
 * Live Sports marketing page `/sports` (sports.md).
 * S1 hero (sports-hero.jpg) · S2 addon-driven live channel grid with honest
 * states · S3 why-live features · S4 CTA band. MarketingShell provides the
 * navbar, footer, ambience and Lenis scroll.
 */
import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Armchair, HeartPulse, Radio, SatelliteDish, Zap } from 'lucide-react';
import {
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  EmptyState,
  GlassPanel,
  Eyebrow,
} from '@/components/ui-elite';
import { addonEngine } from '@/lib/addons/engine';
import { useAddons } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const riseIn = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
} as const;

/* ── S1 — Hero ─────────────────────────────────────────────────────────── */

const H1_WORDS = ['Every', 'match.', 'Every', 'channel.', 'One', 'box.'];

function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 0.4], [0, 60]);

  return (
    <section className="relative flex min-h-[70dvh] md:min-h-[80dvh] items-center overflow-hidden">
      {/* z0 — sports-hero.jpg, darkened 55%, scale settle + parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={reduceMotion ? undefined : { y: bgY }}
        initial={reduceMotion ? undefined : { scale: 1.05 }}
        animate={reduceMotion ? undefined : { scale: 1 }}
        transition={{ duration: 1.4, ease: OUT_EXPO }}
      >
        <img
          src="/sports-hero.jpg"
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover brightness-[.45]"
        />
      </motion.div>
      {/* navy gradient from bottom */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-deep via-deep/40 to-transparent"
        aria-hidden
      />
      {/* one-shot cyan scanline on load */}
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
          <motion.div
            className="absolute inset-y-0 w-[30%] bg-gradient-to-r from-transparent via-cyan/[.08] to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '400%' }}
            transition={{ duration: 1.8, ease: 'linear', delay: 0.4 }}
          />
        </div>
      )}

      {/* z3 — content, center-left */}
      <div className="relative z-[3] mx-auto w-full max-w-[1280px] px-16 md:px-24">
        <div className="flex max-w-2xl flex-col gap-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.25 } } }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } }}
            >
              <Eyebrow className="mb-16">Live sports on Elitebox</Eyebrow>
            </motion.div>
            <h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.035em] font-extrabold md:text-display-xl">
              {H1_WORDS.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className="text-chrome mr-[0.28em] inline-block will-change-transform"
                  variants={{
                    hidden: { opacity: 0, y: 36 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: OUT_EXPO } },
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </motion.div>

          <motion.p
            className="max-w-[58ch] text-body-l text-muted"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.45, ease: OUT_EXPO }}
          >
            Live channels arrive through community addons — health-checked, latency-scored and one
            tap from play. No blackouts in the interface: if a channel is down, you see it before
            you click.
          </motion.p>

          <motion.div
            className="flex flex-col gap-16 sm:flex-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.45, ease: OUT_EXPO }}
          >
            <ButtonPrimary to="/app/live" className="max-sm:w-full px-32 py-16 text-base">
              Watch live now
            </ButtonPrimary>
            <ButtonNeon to="/store" className="max-sm:w-full px-32 py-16 text-base">
              Get sports addons
            </ButtonNeon>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── S2 — Live channel grid (addon-driven, honest states) ──────────────── */

/** Health chip for the addon currently serving a channel (mono latency). */
function ChannelHealth({ channel }: { channel: MetaItem }) {
  const installed = useAddons((s) => s.installed);
  // Showcase channels are served by the builtin addon; anything else maps to
  // the first installed stream addon that could answer.
  const addon =
    installed.find((a) => a.builtin) ?? installed.find((a) => a.resources.includes('stream'));
  if (!addon) return null;
  const health = addonEngine.health(addon.id);
  const dot =
    health.status === 'ok'
      ? 'bg-ok shadow-[0_0_8px_rgba(124,217,236,.7)]'
      : health.status === 'degraded'
        ? 'bg-warn shadow-[0_0_8px_rgba(255,184,77,.7)]'
        : 'bg-error shadow-[0_0_8px_rgba(255,77,109,.7)]';
  const label = addon.builtin
    ? 'local'
    : health.latencyMs !== undefined
      ? `${Math.round(health.latencyMs)}ms`
      : 'n/a';
  return (
    <span
      className="glass-1 inline-flex items-center gap-6 rounded-md px-8 py-2"
      title={`${addon.name} · ${health.status}`}
    >
      <span className={cn('h-6 w-6 rounded-full', dot)} />
      <span className="font-mono text-[11px] text-muted">{label}</span>
      <span className="sr-only">
        {channel.name} source health: {health.status}
      </span>
    </span>
  );
}

function ChannelCard({ channel, index }: { channel: MetaItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: OUT_EXPO }}
      className="group"
    >
      <GlassPanel
        level={2}
        className="overflow-hidden rounded-xl transition-shadow duration-[180ms] group-hover:shadow-focus-glow"
      >
        {/* 16:9 thumb, fixed frame */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={channel.poster}
            alt={`${channel.name} channel art`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          {/* LIVE badge */}
          <span className="glass-1 absolute left-12 top-12 inline-flex items-center gap-6 rounded-md px-8 py-2 text-micro uppercase">
            <span className="h-6 w-6 rounded-full bg-live animate-live-pulse" />
            <span className="text-ink">Live</span>
          </span>
          <span className="absolute right-12 top-12">
            <ChannelHealth channel={channel} />
          </span>
          {/* Watch button slides up on hover/focus */}
          <div className="absolute inset-x-12 bottom-12 translate-y-8 opacity-0 transition-all duration-[180ms] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <ButtonNeon to="/app/live" className="px-16 py-8 text-[12px]">
              Watch
            </ButtonNeon>
          </div>
        </div>
        {/* bottom row */}
        <div className="flex items-start justify-between gap-12 p-16">
          <div className="flex min-w-0 flex-col gap-4">
            <h3 className="font-display text-title text-ink">{channel.name}</h3>
            <p className="text-caption text-muted">{channel.genres.join(' · ')}</p>
            <p className="text-[12px] text-muted">
              <span className="font-mono uppercase tracking-[.08em] text-cyan">Now · </span>
              {channel.description}
            </p>
          </div>
          <ButtonNeon to="/app/live" className="shrink-0 px-16 py-8 text-[12px]">
            Watch
          </ButtonNeon>
        </div>
      </GlassPanel>
    </motion.article>
  );
}

function LiveChannelGrid() {
  const installed = useAddons((s) => s.installed);
  const enabled = useAddons((s) => s.enabled);
  const [channels, setChannels] = useState<MetaItem[] | null>(null);

  const liveAddons = installed.filter(
    (a) => enabled[a.id] && (a.builtin || a.resources.includes('stream')),
  );

  useEffect(() => {
    let alive = true;
    addonEngine
      .getCatalog('channel')
      .then((items) => {
        if (alive) setChannels(items.filter((m) => m.live));
      })
      .catch(() => {
        if (alive) setChannels([]);
      });
    return () => {
      alive = false;
    };
  }, [installed, enabled]);

  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-32 px-16 py-96 md:px-24">
      <motion.div
        {...riseIn}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-wrap items-center justify-between gap-16"
      >
        <div className="flex flex-col gap-8">
          <Eyebrow>Addon-driven, health-checked</Eyebrow>
          <h2 className="font-display text-display-l text-ink">On Air Now</h2>
        </div>
        {channels !== null && channels.length > 0 && (
          <span className="glass-1 inline-flex items-center gap-8 rounded-full px-16 py-8 text-caption text-ink">
            <span className="h-8 w-8 rounded-full bg-cyan animate-live-pulse" />
            {channels.length} {channels.length === 1 ? 'channel' : 'channels'} live
          </span>
        )}
      </motion.div>

      {liveAddons.length === 0 ? (
        <EmptyState
          icon={SatelliteDish}
          title="Install a live addon to fill this grid."
          caption="Channels arrive through addons — nothing is fabricated. Add one from the Store and this grid lights up."
          action={<ButtonPrimary to="/store">Open Store</ButtonPrimary>}
        />
      ) : channels === null ? (
        <div className="grid grid-cols-1 gap-24 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-2 aspect-video animate-pulse rounded-xl" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live channels respond right now."
          caption="Every installed live addon missed its health check. The circuit breaker benched them — see which one and why."
          action={<ButtonNeon to="/app/addons">Check addon health</ButtonNeon>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-24 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c, i) => (
            <ChannelCard key={c.id} channel={c} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── S3 — Why Live on Elitebox ─────────────────────────────────────────── */

const FEATURES = [
  {
    icon: HeartPulse,
    title: 'Health before hype',
    copy: 'Channels report latency and uptime. The sick ones bench themselves automatically.',
  },
  {
    icon: Zap,
    title: 'Instant recovery',
    copy: 'A stuttering stream steps down in quality or swaps source — without leaving the channel.',
  },
  {
    icon: Armchair,
    title: '10-foot ready',
    copy: 'Arrow keys, oversized focus glow, zero tiny targets. Built for the couch first.',
  },
] as const;

function WhyLive() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[1280px] px-16 pb-96 md:px-24">
      <div className="grid grid-cols-1 gap-24 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: OUT_EXPO }}
            whileHover={{ y: -4 }}
          >
            <GlassPanel
              level={1}
              className="flex h-full flex-col gap-16 rounded-xl p-24 transition-shadow duration-[180ms] hover:shadow-aura-purple"
            >
              <f.icon size={24} strokeWidth={1.75} className="text-cyan" />
              <h3 className="font-display text-title text-ink">{f.title}</h3>
              <p className="text-caption text-muted">{f.copy}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── S4 — CTA band ─────────────────────────────────────────────────────── */

function CtaBand() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[1280px] px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, ease: OUT_EXPO }}
      >
        <GlassPanel
          level={2}
          className="relative flex flex-col items-start justify-between gap-24 overflow-hidden rounded-2xl p-32 md:flex-row md:items-center md:p-48"
        >
          {/* cyan line sweep across the top border on entry */}
          <motion.span
            aria-hidden
            className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan to-transparent"
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1, ease: OUT_EXPO }}
          />
          <h2 className="font-display text-display-l text-ink">Your couch is the front row.</h2>
          <div className="flex w-full flex-col gap-12 sm:flex-row md:w-auto">
            <ButtonPrimary to="/app/live" className="max-sm:w-full">
              Open Live TV
            </ButtonPrimary>
            <ButtonGhost to="/store" className="max-sm:w-full">
              Browse the Store
            </ButtonGhost>
          </div>
        </GlassPanel>
      </motion.div>
    </section>
  );
}

export default function Sports() {
  return (
    <>
      <Hero />
      <LiveChannelGrid />
      <WhyLive />
      <CtaBand />
    </>
  );
}
