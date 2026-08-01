/**
 * Landing page `/` (home.md): hero S1, top content rail S2, pinned feature
 * story S3 (GSAP ScrollTrigger), addon engine S4, player S5, platforms +
 * downloads S6, final CTA S7. Footer is rendered by MarketingShell.
 *
 * Library isolation: Framer Motion drives UI entrances; GSAP/ScrollTrigger is
 * contained in <FeatureStory/> only.
 */
import { Fragment, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Activity,
  AlertTriangle,
  Captions,
  ChevronRight,
  Code2,
  Download,
  FastForward,
  Globe,
  Keyboard,
  Monitor,
  Mouse,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Tv,
} from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import LivingTree from '@/components/LivingTree';
import ScrambleText from '@/components/ScrambleText';
import SpotlightCard from '@/components/SpotlightCard';
import Shelf from '@/components/Shelf';
import {
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  GlassPanel,
  HealthDot,
  spring,
  toast,
  Eyebrow,
} from '@/components/ui-elite';
import { SHOWCASE_CHANNELS, SHOWCASE_MOVIES } from '@/data/showcase';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

/* ── shared bits ───────────────────────────────────────────────────────── */

const riseIn = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

/* ── S1 — Hero ─────────────────────────────────────────────────────────── */

function Hero() {
  const { t } = useT();
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      {/* z0 — pure-black stage: the LivingTree is the hero, dadgpt-calm.
          Deep vignette melts the edges into the lunar night. */}
      <div className="absolute inset-0 z-0 bg-black" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[radial-gradient(120%_90%_at_50%_42%,transparent_38%,rgba(3,6,18,.55)_72%,#030612_100%)]"
      />

      {/* z2 — moonlit starfield + a whisper of nebula */}
      <div className="starfield z-[2] opacity-60" aria-hidden />
      <div className="nebula-wash absolute inset-0 z-[2] opacity-50" aria-hidden />

      {/* z3 — content */}
      <div className="relative z-[3] flex flex-col items-center gap-24 px-16 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02, delayChildren: 0.35 } } }}
        >
          {/* LivingTree — the signature mark: an AI waveform × neural tree,
              floating and breathing above the headline. Its own lunar halo
              lifts it clear of the starfield. Static under reduced
              motion (handled in index.css). */}
          <motion.div
            aria-hidden
            className="relative mb-24 mt-8 flex h-[150px] items-start justify-center md:h-[190px]"
            initial={{ opacity: 0, scale: 0.82, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-0 h-[300px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(3,6,18,.94),rgba(3,6,18,.62)_58%,transparent)] backdrop-blur-[3px]"
            />
            <LivingTree className="relative origin-top scale-[.82] [filter:drop-shadow(0_0_26px_rgba(124,217,236,.62))] sm:scale-100 md:scale-[1.18]" />
          </motion.div>

          <Eyebrow className="mb-16">
            {t('marketing.home.hero.eyebrow').split(' ').map((word, wi) => (
              <Fragment key={wi}>
                {wi > 0 && ' '}
                <span className="inline-block whitespace-nowrap">
                  {word.split('').map((ch, i) => (
                    <motion.span
                      key={i}
                      className="inline-block"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    >
                      {ch}
                    </motion.span>
                  ))}
                </span>
              </Fragment>
            ))}
          </Eyebrow>

          <h1 className="font-display text-[clamp(2rem,10.5vw,2.75rem)] leading-[1.05] tracking-[-0.04em] font-extrabold md:text-display-2xl">
            {[t('marketing.home.hero.title1'), t('marketing.home.hero.title2')].map((line, li) => (
              <span key={line} className={cn('block', li > 0 && 'mt-2')}>
                {line.split(' ').map((word, wi) => (
                  <Fragment key={wi}>
                    {wi > 0 && ' '}
                    <span className="inline-block whitespace-nowrap">
                      {word.split('').map((ch, i) => (
                        <motion.span
                          key={i}
                          className="text-chrome inline-block will-change-transform"
                          variants={{
                            hidden: { opacity: 0, y: 40, rotate: 4 },
                            show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                          }}
                        >
                          {ch}
                        </motion.span>
                      ))}
                    </span>
                  </Fragment>
                ))}
              </span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          className="max-w-[62ch] text-body-l text-muted"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('marketing.home.hero.sub')}
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-16 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <ButtonPrimary to="/app" className="max-sm:w-full px-32 py-16 text-base">
            {t('marketing.home.hero.openApp')}
          </ButtonPrimary>
          <ButtonNeon to="/app/onboarding" className="max-sm:w-full px-32 py-16 text-base">
            {t('marketing.home.hero.setup')}
          </ButtonNeon>
        </motion.div>

        <motion.p
          className="text-caption text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.45 }}
        >
          {t('marketing.home.hero.meta')}
        </motion.p>
      </div>

      {/* z4 — scroll cue */}
      <div className="absolute bottom-24 left-1/2 z-[4] flex -translate-x-1/2 flex-col items-center gap-8">
        <Mouse size={20} strokeWidth={1.75} className="text-muted" />
        <span className="block h-32 w-2 rounded-full bg-cyan animate-scroll-cue" />
      </div>
    </section>
  );
}

/* ── S2 — Top Content Rail ─────────────────────────────────────────────── */

function TopContentRail() {
  const { t } = useT();
  // 12 showcase posters (HD) + the two LIVE channels riding the same rail.
  const items = [...SHOWCASE_MOVIES, ...SHOWCASE_CHANNELS.filter((c) => c.id !== 'launchpad')];
  return (
    <section id="top-content" className="relative z-10 flex flex-col gap-8 py-96">
      <motion.div {...riseIn} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[1280px] px-16 md:px-24">
        <Eyebrow>{t('marketing.home.rail.eyebrow')}</Eyebrow>
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-16">
          <h2 className="font-display text-display-l text-ink">{t('marketing.home.rail.title')}</h2>
          <ButtonGhost to="/app/discover">
            {t('marketing.home.rail.openCatalog')} <ChevronRight size={16} strokeWidth={1.75} />
          </ButtonGhost>
        </div>
      </motion.div>
      <Shelf items={items} autoScroll />
    </section>
  );
}

/* ── S3 — Feature Story: "Engineered, not patched" (GSAP pinned scene) ─── */

const FEATURE_CARDS = [
  { key: 'health', accent: 'cyan' as const, linkTo: '/app/addons' },
  { key: 'memory', accent: 'purple' as const, linkTo: '/app' },
  { key: 'recovery', accent: 'cyan' as const, linkTo: '/app/settings' },
];

function FeatureCardVisual({ cardKey }: { cardKey: string }) {
  const { t } = useT();
  if (cardKey === 'health') {
    return (
      <div className="flex flex-col gap-10">
        {[
          { name: 'Elitebox Showcase', ms: 128, status: 'ok' as const },
          { name: 'Cinemeta', ms: 214, status: 'ok' as const },
          { name: t('marketing.home.story.visual.nextAddon'), ms: 912, status: 'degraded' as const },
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-16">
            <span className="text-caption text-ink">{row.name}</span>
            <span className="flex items-center gap-8">
              <HealthDot status={row.status} />
              <span
                className="font-mono text-[11px] text-muted w-[52px] text-right"
                data-count-up={row.ms}
              >
                0ms
              </span>
            </span>
          </div>
        ))}
        <span className="glass-1 mt-4 w-fit rounded-full px-12 py-4 text-micro uppercase text-warn">
          {t('marketing.home.story.visual.autoRecovering')}
        </span>
      </div>
    );
  }
  if (cardKey === 'memory') {
    return (
      <div className="flex flex-col gap-12">
        <div className="relative h-6 overflow-hidden rounded-full bg-white/[.08]">
          <div className="h-full w-[42%] rounded-full bg-signature" />
        </div>
        <div className="flex flex-wrap gap-8">
          {['1.25×', t('marketing.home.story.visual.subtitlesEn'), t('marketing.home.story.visual.resume')].map((chip) => (
            <span key={chip} className="glass-1 rounded-full px-12 py-6 font-mono text-[11px] text-cyan">
              {chip}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-10 text-muted">
        <AlertTriangle size={18} strokeWidth={1.75} className="text-warn shrink-0" />
        <span className="text-caption">{t('marketing.home.story.visual.timeout')}</span>
      </div>
      <div className="flex flex-wrap gap-8">
        <ButtonNeon className="px-16 py-8 text-[12px]" onClick={() => toast(t('marketing.home.story.visual.toastSwitched'))}>
          {t('marketing.home.story.visual.nextSource')}
        </ButtonNeon>
        <ButtonGhost onClick={() => toast(t('marketing.home.story.visual.toastSteppedDown'))}>
          {t('marketing.home.story.visual.lowerQuality')}
        </ButtonGhost>
        <ButtonGhost onClick={() => toast(t('marketing.home.story.visual.toastRetrying'))}>
          <RefreshCw size={14} strokeWidth={1.75} /> {t('marketing.home.story.visual.retry')}
        </ButtonGhost>
      </div>
    </div>
  );
}

function FeatureStory() {
  const { t } = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const cards = cardRefs.current.filter((c): c is HTMLDivElement => Boolean(c));
      gsap.set(cards, { opacity: 0.35, x: 64, scale: 0.98 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.5,
        },
      });

      const positions = [0.05, 0.35, 0.62];
      const glows = [
        '0 0 0 1px rgba(124,217,236,.5), 0 0 24px rgba(124,217,236,.25)',
        '0 0 0 1px rgba(139,124,232,.5), 0 0 24px rgba(139,124,232,.25)',
        '0 0 0 1px rgba(124,217,236,.5), 0 0 24px rgba(124,217,236,.25)',
      ];

      cards.forEach((card, i) => {
        tl.to(
          card,
          { opacity: 1, x: 0, scale: 1.03, boxShadow: glows[i], duration: 0.18 },
          positions[i],
        ).to(card, { scale: 1, duration: 0.1 }, positions[i] + 0.18);
        // dim previous cards slightly as the next activates
        if (i > 0) tl.to(cards[i - 1], { opacity: 0.85, duration: 0.1 }, positions[i]);
      });

      // health latency count-ups, fired at each card's activation point
      const counters = section.querySelectorAll<HTMLElement>('[data-count-up]');
      counters.forEach((el) => {
        const target = Number(el.dataset.countUp ?? '0');
        const state = { v: 0 };
        tl.to(
          state,
          {
            v: target,
            duration: 0.12,
            onUpdate: () => {
              el.textContent = `${Math.round(state.v)}ms`;
            },
          },
          positions[0],
        );
      });

      tl.to({}, { duration: 0.15 }); // hold before unpin
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 flex min-h-[100dvh] items-center py-96">
      <div className="mx-auto grid w-full max-w-[1280px] gap-48 px-16 md:grid-cols-[40%_1fr] md:px-24">
        <div className="flex flex-col gap-16 md:sticky md:top-96 md:self-start">
          <Eyebrow>{t('marketing.home.story.eyebrow')}</Eyebrow>
          <h2 className="font-display text-display-l text-ink">
            {t('marketing.home.story.title')}
          </h2>
          <p className="max-w-[44ch] text-body-l text-muted">
            {t('marketing.home.story.copy')}
          </p>
        </div>

        <div className="flex flex-col gap-24">
          {FEATURE_CARDS.map((card, i) => (
            <GlassPanel
              key={card.key}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              level={2}
              className="group/fc relative flex flex-col gap-16 overflow-hidden p-24 will-change-transform transition-transform duration-300 ease-out hover:-translate-y-[7px]"
            >
              {/* dadgpt-style hover light pool rising from the card base */}
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute -bottom-[45%] -inset-x-[20%] h-[120px] rounded-full opacity-0 transition-opacity duration-[360ms] ease-out group-hover/fc:opacity-100',
                  card.accent === 'cyan'
                    ? 'bg-[radial-gradient(closest-side,rgba(124,217,236,.22),transparent)]'
                    : 'bg-[radial-gradient(closest-side,rgba(139,124,232,.22),transparent)]',
                )}
              />
              <span className="text-micro font-bold uppercase tracking-[0.08em] text-muted/60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3
                className={cn(
                  'font-display text-title',
                  card.accent === 'cyan' ? 'text-cyan' : 'text-purple',
                )}
              >
                {t(`marketing.home.story.cards.${card.key}.title`)}
              </h3>
              <FeatureCardVisual cardKey={card.key} />
              <p className="text-caption text-muted">{t(`marketing.home.story.cards.${card.key}.copy`)}</p>
              <Link
                to={card.linkTo}
                className="focusable w-fit rounded-full text-caption font-semibold text-muted transition-colors hover:text-cyan"
              >
                {t(`marketing.home.story.cards.${card.key}.link`)}
              </Link>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── S4 / S5 — split visual sections ───────────────────────────────────── */

interface SplitBullet {
  icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
  text: string;
}

function SplitVisual({
  eyebrow,
  title,
  bullets,
  cta,
  image,
  imageAlt,
  mirrored,
  overlay,
}: {
  eyebrow: string;
  title: string;
  bullets: SplitBullet[];
  cta: ReactNode;
  image: string;
  imageAlt: string;
  mirrored?: boolean;
  overlay?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative z-10 py-96">
      <div
        className={cn(
          'mx-auto grid max-w-[1280px] items-center gap-48 px-16 md:px-24 lg:grid-cols-2',
        )}
      >
        <motion.div
          {...riseIn}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn('relative', mirrored ? 'lg:order-2' : '')}
        >
          <div className="glass-2 overflow-hidden rounded-2xl shadow-aura-purple">
            <img
              src={image}
              alt={imageAlt}
              loading="lazy"
              className={cn('h-auto w-full object-cover', !reduceMotion && 'animate-float-slow')}
            />
            {overlay}
          </div>
        </motion.div>

        <div className={cn('flex flex-col gap-24', mirrored ? 'lg:order-1' : '')}>
          <motion.div {...riseIn} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-16">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="font-display text-display-l text-ink">{title}</h2>
          </motion.div>
          <ul className="flex flex-col gap-16">
            {bullets.map((b, i) => (
              <motion.li
                key={b.text}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-16"
              >
                <span className="glass-1 flex h-40 w-40 shrink-0 items-center justify-center rounded-lg">
                  <b.icon size={20} strokeWidth={1.75} className="text-cyan" />
                </span>
                <span className="text-caption text-ink/90">{b.text}</span>
              </motion.li>
            ))}
          </ul>
          <motion.div {...riseIn} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>{cta}</motion.div>
        </div>
      </div>
    </section>
  );
}

function ScrubberBeam() {
  return (
    <div className="pointer-events-none absolute inset-x-24 bottom-24">
      <div className="relative h-4 overflow-hidden rounded-full bg-white/[.10]">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-signature opacity-80" />
        <div className="absolute inset-y-0 w-1/3 animate-beam-slide bg-gradient-to-r from-transparent via-[rgba(124,217,236,.8)] to-transparent" />
      </div>
    </div>
  );
}

/* ── S6 — Platforms + downloads ────────────────────────────────────────── */

const PLATFORM_CHIPS = [
  { icon: Globe, slug: 'web' },
  { icon: Monitor, slug: 'windows' },
  { icon: Smartphone, slug: 'android' },
  { icon: Tv, slug: 'androidTv' },
] as const;

function PlatformsAndDownloads() {
  const { t } = useT();
  return (
    <section id="downloads" className="relative z-10 flex flex-col gap-48 py-96">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-16 px-16 text-center md:px-24">
        <Eyebrow>{t('marketing.home.platforms.eyebrow')}</Eyebrow>
        <motion.h2
          {...riseIn}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-display-l text-ink max-w-[20ch]"
        >
          {t('marketing.home.platforms.title')}
        </motion.h2>
        <motion.p
          {...riseIn}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[64ch] text-body-l text-muted"
        >
          {t('marketing.home.platforms.sub')}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ ...spring.cinematic, duration: 0.7 }}
        className="mx-auto w-full max-w-5xl px-16"
      >
        <img src="/devices-mockup.webp" alt={t('marketing.home.platforms.imageAlt')} loading="lazy" className="w-full rounded-2xl" />
        {/* reflection */}
        <div
          aria-hidden
          className="pointer-events-none -mt-2 h-96 overflow-hidden opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        >
          <img src="/devices-mockup.webp" alt="" loading="lazy" className="w-full -scale-y-100 rounded-2xl" />
        </div>
      </motion.div>

      {/* platform chips */}
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-stretch justify-center gap-12 px-16">
        {PLATFORM_CHIPS.map((chip, i) => (
          <motion.span
            key={chip.slug}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.07, ...spring.snappy }}
            className="glass-1 flex items-center gap-10 rounded-full px-20 py-12 transition-all duration-150 hover:-translate-y-2 hover:shadow-glow-neon"
          >
            <chip.icon size={20} strokeWidth={1.75} className="text-cyan" />
            <span className="flex flex-col">
              <span className="text-caption font-semibold text-ink">{t(`marketing.home.platforms.chips.${chip.slug}.label`)}</span>
              {chip.slug !== 'web' && <span className="text-[11px] text-muted">{t(`marketing.home.platforms.chips.${chip.slug}.caption`)}</span>}
            </span>
          </motion.span>
        ))}
      </div>

      {/* download cards */}
      <div className="mx-auto grid w-full max-w-[1280px] gap-16 px-16 sm:grid-cols-2 lg:grid-cols-4 md:px-24">
        {[
          { icon: Monitor, slug: 'windows' },
          { icon: Smartphone, slug: 'android' },
          { icon: Globe, slug: 'web', web: true },
          { icon: Tv, slug: 'androidTv' },
        ].map((card, i) => (
          <motion.div
            key={card.slug}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <SpotlightCard className="h-full rounded-2xl">
              <GlassPanel level={2} className="flex h-full flex-col items-start gap-12 p-24">
                <span className="glass-1 flex h-48 w-48 items-center justify-center rounded-xl">
                  <card.icon size={24} strokeWidth={1.75} className="text-cyan" />
                </span>
                <div>
                  <h3 className="font-display text-title text-ink">{t(`marketing.platformCards.${card.slug}.name`)}</h3>
                  <p className="text-caption text-muted">{t(`marketing.platformCards.${card.slug}.detail`)}</p>
                </div>
                {card.web ? (
                  <ButtonPrimary to="/app" className="mt-auto px-16 py-8 text-[12px]">
                    {t(`marketing.platformCards.${card.slug}.cta`)}
                  </ButtonPrimary>
                ) : (
                  <ButtonNeon to="/downloads" className="mt-auto px-16 py-8 text-[12px]">
                    <Download size={14} strokeWidth={1.75} /> {t(`marketing.platformCards.${card.slug}.cta`)}
                  </ButtonNeon>
                )}
              </GlassPanel>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── S7 — Final CTA ────────────────────────────────────────────────────── */


/* ── S6b — FAQ: the questions everyone asks, answered straight ────────── */

const FAQ_IDS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'] as const;

function FaqSection() {
  const { t } = useT();
  return (
    <section className="relative z-10 py-96">
      <div className="mx-auto flex max-w-[880px] flex-col gap-32 px-16 md:px-24">
        <motion.div {...riseIn} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-12 text-center">
          <Eyebrow>{t('marketing.home.faq.eyebrow')}</Eyebrow>
          <h2 className="font-display text-display-l text-ink">{t('marketing.home.faq.title')}</h2>
        </motion.div>
        <div className="flex flex-col gap-12">
          {FAQ_IDS.map((id, i) => (
            <motion.details
              key={id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-2 group rounded-xl px-20 py-16 open:border-cyan/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-16 text-caption font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                {t(`marketing.home.faq.${id}.q`)}
                <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 rotate-90 text-cyan transition-transform group-open:-rotate-90" />
              </summary>
              <p className="mt-10 text-caption leading-relaxed text-muted">{t(`marketing.home.faq.${id}.a`)}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useT();
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.4 });
  return (
    <section className="relative z-10 px-16 py-96">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl"
      >
        {/* animated gradient border draw */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cta-border" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7CD9EC" />
              <stop offset="55%" stopColor="#8B7CE8" />
              <stop offset="100%" stopColor="#A99BF0" />
            </linearGradient>
          </defs>
          <motion.rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="24"
            fill="none"
            stroke="url(#cta-border)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <GlassPanel level={3} className="flex flex-col items-center gap-24 border-transparent px-24 py-64 text-center">
          <LogoMark height={48} />
          <div ref={ctaRef}>
            <h2 className="font-display text-display-l text-gradient-signature">
              {ctaInView ? (
                <ScrambleText text={t('marketing.home.finalCta.title')} caret />
              ) : (
                <span className="opacity-0">{t('marketing.home.finalCta.title')}</span>
              )}
            </h2>
          </div>
          <p className="max-w-[48ch] text-body-l text-muted">
            {t('marketing.home.finalCta.copy')}
          </p>
          <div className="flex flex-col items-center gap-16 sm:flex-row">
            <ButtonPrimary to="/app" className="px-32 py-16 text-base">
              {t('marketing.home.finalCta.launch')}
            </ButtonPrimary>
            <ButtonNeon to="/app/onboarding" className="px-32 py-16 text-base">
              {t('marketing.home.finalCta.tour')}
            </ButtonNeon>
          </div>
        </GlassPanel>
      </motion.div>
    </section>
  );
}

/* ── page assembly ─────────────────────────────────────────────────────── */

export default function Home() {
  const { t } = useT();
  return (
    <>
      <Hero />
      <TopContentRail />
      <FeatureStory />
      <SplitVisual
        eyebrow={t('marketing.home.splitLibrary.eyebrow')}
        title={t('marketing.home.splitLibrary.title')}
        bullets={[
          { icon: Shield, text: t('marketing.home.splitLibrary.b1') },
          { icon: Activity, text: t('marketing.home.splitLibrary.b2') },
          { icon: SlidersHorizontal, text: t('marketing.home.splitLibrary.b3') },
          { icon: Code2, text: t('marketing.home.splitLibrary.b4') },
        ]}
        cta={<ButtonNeon to="/app/discover">{t('marketing.home.splitLibrary.cta')}</ButtonNeon>}
        image="/addon-engine-visual.webp"
        imageAlt={t('marketing.home.splitLibrary.imageAlt')}
      />
      <SplitVisual
        mirrored
        eyebrow={t('marketing.home.splitPlayer.eyebrow')}
        title={t('marketing.home.splitPlayer.title')}
        bullets={[
          { icon: RefreshCw, text: t('marketing.home.splitPlayer.b1') },
          { icon: Captions, text: t('marketing.home.splitPlayer.b2') },
          { icon: Keyboard, text: t('marketing.home.splitPlayer.b3') },
          { icon: FastForward, text: t('marketing.home.splitPlayer.b4') },
        ]}
        cta={<ButtonPrimary to="/app">{t('marketing.home.splitPlayer.cta')}</ButtonPrimary>}
        image="/player-visual.webp"
        imageAlt={t('marketing.home.splitPlayer.imageAlt')}
        overlay={<ScrubberBeam />}
      />
      <FaqSection />
      <PlatformsAndDownloads />
      <FinalCta />
    </>
  );
}

export { Hero, TopContentRail, FeatureStory };
