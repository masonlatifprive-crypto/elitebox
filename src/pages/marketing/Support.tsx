/**
 * Support marketing page `/support` (support.md).
 * S1 hero (support-hero.jpg + live status card) · S2 FAQ accordion (deep-
 * linkable) · S3 diagnostics checklist · S4 downloads, contact + open-content
 * license attribution. MarketingShell provides navbar, footer, ambience.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowUpRight,
  Bug,
  Captions,
  ChevronDown,
  Download,
  FileText,
  Globe,
  MessagesSquare,
  Monitor,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Tv,
} from 'lucide-react';
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
import { addonEngine } from '@/lib/addons/engine';
import { useAddons } from '@/lib/store';

const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── S1 — Hero + status card ───────────────────────────────────────────── */

const H1_WORDS = ['Get', 'back', 'to', 'watching.'];

function StatusCard() {
  const installed = useAddons((s) => s.installed);
  const showcase = addonEngine.health('elitebox.showcase');
  const liveOk = installed.some((a) => a.builtin);
  const rows = [
    { label: 'Web engine', status: 'ok' as const, note: 'Operational' },
    {
      label: 'Showcase addon',
      status: showcase.status,
      note: showcase.status === 'ok' ? 'Operational' : showcase.status,
    },
    {
      label: 'Live channels',
      status: liveOk ? ('ok' as const) : ('down' as const),
      note: liveOk ? 'Operational' : 'No source installed',
    },
  ];
  return (
    <GlassPanel level={2} className="flex w-full max-w-sm flex-col gap-16 rounded-xl p-24">
      <p className="text-micro uppercase tracking-[.08em] text-muted">System status</p>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.15, ...spring.snappy }}
          className="flex items-center justify-between gap-12"
        >
          <span className="text-caption text-ink">{r.label}</span>
          <span className="flex items-center gap-8">
            <HealthDot status={r.status} />
            <span className="text-[12px] capitalize text-muted">{r.note}</span>
          </span>
        </motion.div>
      ))}
    </GlassPanel>
  );
}

function Hero() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[40dvh] md:min-h-[45dvh] items-center overflow-hidden pt-96"
    >
      <motion.div className="absolute inset-0 z-0" style={reduceMotion ? undefined : { y: bgY }}>
        <img
          src="/support-hero.jpg"
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover brightness-[.4]"
        />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-gradient-to-t from-deep via-deep/40 to-deep/60"
      />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1280px] flex-col items-start gap-32 px-16 py-64 md:px-24 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}
            >
              <Eyebrow className="mb-16">Support</Eyebrow>
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
            className="max-w-[56ch] text-body-l text-muted"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.45, ease: OUT_EXPO }}
          >
            Most Elitebox issues fix themselves. For the rest, start here.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: OUT_EXPO }}
        >
          <StatusCard />
        </motion.div>
      </div>
    </section>
  );
}

/* ── S2 — FAQ accordion ────────────────────────────────────────────────── */

const FAQS = [
  {
    id: 'q1',
    q: 'Which platforms does Elitebox run on?',
    a: 'Elitebox runs in any modern browser, as a native Windows app, on Android phones and on Android TV. Every build shares one codebase — the TV build adds a true 10-foot interface with arrow-key spatial navigation and oversized focus targets.',
  },
  {
    id: 'q2',
    q: 'What does Elitebox Premium cost — and how do I cancel?',
    a: 'Elitebox Premium is $4.99/month: every movie, every series, completely. Cancel any time from your account page — the change applies at the end of the current month, and your local library, profiles and watch progress stay exactly where they are.',
  },
  {
    id: 'q3',
    q: 'How do I install an addon?',
    a: 'Two ways: from the Store page, or by pasting a manifest URL in the app\u2019s Addon Manager (Addons → Install by URL). Elitebox fetches the manifest, shows you exactly which permissions the addon requests — network, storage — and installs nothing until you confirm.',
  },
  {
    id: 'q4',
    q: 'How do subtitles work?',
    a: 'Subtitle addons provide tracks per title; the player normalizes everything to WebVTT. Pick a track from Player → Subtitles, set a preferred language and size in Settings, and Elitebox remembers the choice per profile. A broken track can be re-downloaded from the same menu.',
  },
  {
    id: 'q5',
    q: 'Can I watch on my TV or cast from my phone?',
    a: 'On Android TV, use the leanback build. From any other device, open the web app in your TV\u2019s browser or cast the tab — the player hands off cleanly, and the 10-foot web mode takes over navigation with remote-style arrow keys.',
  },
  {
    id: 'q6',
    q: 'Where is my watch progress stored? Does it sync?',
    a: 'Locally, per profile, on your device — Elitebox resumes to the second. Premium syncs resume points and library across signed-in devices. Without Premium, Settings → Export produces one JSON you can import on any other device.',
  },
  {
    id: 'q7',
    q: 'What movies and shows ship with Elitebox?',
    a: 'The built-in Showcase addon: open films from the Blender Foundation — Big Buck Bunny, Sintel, Tears of Steel and more — released under Creative Commons (CC-BY). They play out of the box, fully offline-capable, with full attribution in the licenses section below.',
  },
  {
    id: 'q8',
    q: 'Can I try Elitebox without an account?',
    a: 'Yes — open the app and you\u2019re in demo mode: the full engine, the Showcase catalog and the open live channels, no sign-in required. An account is only needed for Premium and cross-device sync.',
  },
  {
    id: 'q9',
    q: 'Why does an addon show a red dot?',
    a: 'It failed its health check — timeouts or errors three times in a row. The circuit breaker benches it automatically so it can\u2019t freeze your evening, and it probes again after 60 seconds. Check Addons → Health for latency, success rate and a manual Recover button.',
  },
] as const;

function FaqItem({
  faq,
  open,
  onToggle,
  index,
}: {
  faq: (typeof FAQS)[number];
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      id={faq.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: OUT_EXPO }}
      className="glass-1 scroll-mt-[120px] rounded-lg"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${faq.id}-panel`}
        className="focusable flex w-full items-center justify-between gap-16 rounded-lg px-20 py-16 text-left cursor-pointer"
      >
        <span className="text-caption font-semibold text-ink">{faq.q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring.smooth}
          className="shrink-0 text-muted"
        >
          <ChevronDown size={20} strokeWidth={1.75} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${faq.id}-panel`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...spring.smooth, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <p className="max-w-[68ch] px-20 pb-16 text-caption text-muted">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Faq() {
  const [openId, setOpenId] = useState<string | null>(null);

  // Deep links: /support#q3 opens that item.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (FAQS.some((f) => f.id === hash)) {
      setOpenId(hash);
      document.getElementById(hash)?.scrollIntoView({ block: 'start' });
    }
  }, []);

  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-48 px-16 py-96 md:px-24 lg:flex-row lg:items-start">
      {/* sticky left column */}
      <div className="flex flex-col gap-16 lg:sticky lg:top-[120px] lg:w-[35%]">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="font-display text-display-l text-ink">Frequently asked</h2>
        <p className="text-caption text-muted">Nine answers. Most questions end here.</p>
        <ButtonGhost onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="w-fit">
          Contact support ↓
        </ButtonGhost>
      </div>
      {/* accordion */}
      <div className="flex flex-1 flex-col gap-12">
        {FAQS.map((f, i) => (
          <FaqItem
            key={f.id}
            faq={f}
            index={i}
            open={openId === f.id}
            onToggle={() => setOpenId(openId === f.id ? null : f.id)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── S3 — Diagnostics checklist ────────────────────────────────────────── */

const STEPS = [
  { name: 'Network', instruction: 'Settings → Diagnostics → Run network check. You want cyan on all three probes.' },
  { name: 'Addon health', instruction: 'Addons → any amber/red addon → Test. Reorder healthy addons to the top.' },
  { name: 'Cache', instruction: 'Settings → Cache → Clear image cache if posters look stale.' },
  { name: 'Playback', instruction: 'Try the same title at a lower quality from the recovery panel.' },
  { name: 'Subtitles', instruction: 'Player → Subtitles → re-download track; all tracks are normalized to WebVTT.' },
  { name: 'Fresh start', instruction: 'Settings → Export config, then Reset. Import to restore.' },
] as const;

function Diagnostics() {
  return (
    <section id="diagnostics" className="relative z-10 mx-auto flex w-full max-w-[1280px] scroll-mt-[120px] flex-col gap-48 px-16 pb-96 md:px-24 lg:flex-row">
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: OUT_EXPO }}
          className="mb-32 flex flex-col gap-8"
        >
          <Eyebrow>Self-check</Eyebrow>
          <h2 className="font-display text-display-l text-ink">Run the self-check.</h2>
        </motion.div>

        <GlassPanel level={2} className="flex flex-col gap-16 rounded-xl p-24">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: OUT_EXPO }}
              className="group relative flex items-start gap-16"
            >
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-36 h-[calc(100%-20px)] w-2 bg-gradient-to-b from-cyan/40 to-purple/20"
                />
              )}
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08, ...spring.snappy }}
                className="bg-signature flex h-32 w-32 shrink-0 items-center justify-center rounded-full font-display text-caption font-bold text-deep transition-shadow duration-[180ms] group-hover:shadow-glow-neon"
              >
                {i + 1}
              </motion.span>
              <div className="flex flex-col gap-4 pt-4">
                <h3 className="font-display text-title text-ink">{s.name}</h3>
                <p className="text-caption text-muted">{s.instruction}</p>
              </div>
            </motion.div>
          ))}
        </GlassPanel>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: OUT_EXPO }}
        className="lg:sticky lg:top-[120px] lg:w-[38%] lg:self-start"
      >
        <GlassPanel level={2} className="overflow-hidden rounded-xl p-8">
          <img
            src="/devices-mockup.webp"
            alt="Elitebox running on TV, laptop, tablet and phone"
            loading="lazy"
            className="w-full rounded-lg"
          />
        </GlassPanel>
      </motion.div>
    </section>
  );
}

/* ── S4 — Downloads ────────────────────────────────────────────────────── */

const EXE_MSG = 'The Windows installer ships with the v1.0 desktop release — in final packaging now. The web app is fully live today.';
const APK_MSG = 'The Android APK ships with the v1.0 mobile release — in final packaging now. The web app is fully live today.';
const TV_MSG = 'The Android TV leanback build ships with the v1.0 TV release — the web app already speaks remote.';

function Downloads() {
  const cards = [
    { icon: Monitor, name: 'Windows', detail: 'Native EXE installer · in packaging', action: () => toast(EXE_MSG), cta: 'Build status' },
    { icon: Smartphone, name: 'Android', detail: 'Mobile APK · in packaging', action: () => toast(APK_MSG), cta: 'Build status' },
    { icon: Globe, name: 'Web', detail: 'Runs in your browser', action: undefined, cta: 'Launch web app' },
    { icon: Tv, name: 'Android TV', detail: 'Leanback build · in packaging', action: () => toast(TV_MSG), cta: 'Build status' },
  ] as const;

  return (
    <section id="downloads" className="relative z-10 mx-auto flex w-full max-w-[1280px] scroll-mt-[120px] flex-col gap-32 px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-col gap-8"
      >
        <Eyebrow>Downloads</Eyebrow>
        <h2 className="font-display text-display-l text-ink">One codebase. Every screen.</h2>
      </motion.div>
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: OUT_EXPO }}
          >
            <GlassPanel level={2} className="flex h-full flex-col items-start gap-12 rounded-xl p-24">
              <span className="glass-1 flex h-48 w-48 items-center justify-center rounded-xl">
                <card.icon size={24} strokeWidth={1.75} className="text-cyan" />
              </span>
              <div>
                <h3 className="font-display text-title text-ink">{card.name}</h3>
                <p className="text-caption text-muted">{card.detail}</p>
              </div>
              {card.action ? (
                <ButtonNeon onClick={card.action} className="mt-auto px-16 py-8 text-[12px]">
                  <Download size={14} strokeWidth={1.75} /> {card.cta}
                </ButtonNeon>
              ) : (
                <ButtonPrimary to="/app" className="mt-auto px-16 py-8 text-[12px]">
                  {card.cta}
                </ButtonPrimary>
              )}
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── S5 — Legal: release notes, privacy, terms ─────────────────────────── */

const RELEASE_NOTES = [
  'Cinematic web app: Home, Discover, Movies, Series, Live, Search, Library, Stats and more — 22 routes, every one live.',
  'Elitebox Addon Protocol v1: install any compatible source, with live health dots, circuit breaker and one-click recovery.',
  'Player: HLS with automatic multi-source failover, resume-from-position memory, WebVTT subtitle tracks, keyboard and TV-remote control.',
  'TV mode: spatial navigation, 10-foot focus rings, Android TV leanback support.',
  'Elitebox Premium: one plan, $4.99/month, via Stripe or PayPal. Clearly-labeled demo mode where no backend is connected.',
];

const PRIVACY_POINTS = [
  'Local-first: your library, watch progress, profiles and settings are stored on your device, not on our servers.',
  'Demo mode: accounts and subscriptions never leave your device — there is nothing to leak because nothing is sent.',
  'Live mode: the server stores your email and subscription state only. Card details are handled entirely by Stripe or PayPal — Elitebox never sees your card number.',
  'No ad networks, no tracking pixels, no selling of viewing data. Ever.',
];

const TERMS_POINTS = [
  'Elitebox Premium is a recurring subscription at $5 USD per month. Cancel anytime from Account — access stays active until the end of the current paid period.',
  'Where demo mode is labeled, checkout is simulated and no payment method is charged.',
  'The Showcase catalog streams open films © Blender Foundation under CC-BY 3.0 (attribution below). Third-party addons are operated by their own authors, who are responsible for their content and rights.',
  'One subscription covers every client — web, Windows, Android and TV — on the same account.',
];

function LegalPanel({
  id,
  icon: Icon,
  title,
  items,
  delay,
}: {
  id: string;
  icon: typeof FileText;
  title: string;
  items: readonly string[];
  delay: number;
}) {
  return (
    <motion.div
      id={id}
      className="scroll-mt-[120px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.55, ease: OUT_EXPO }}
    >
      <GlassPanel level={2} className="flex h-full flex-col gap-16 rounded-2xl p-32">
        <span className="glass-1 flex h-48 w-48 items-center justify-center rounded-xl">
          <Icon size={24} strokeWidth={1.75} className="text-cyan" />
        </span>
        <h2 className="font-display text-title text-ink">{title}</h2>
        <ul className="flex flex-col gap-10">
          {items.map((t) => (
            <li key={t.slice(0, 24)} className="flex items-start gap-10 text-caption text-muted">
              <span aria-hidden className="mt-6 h-4 w-4 shrink-0 rounded-full bg-cyan" />
              {t}
            </li>
          ))}
        </ul>
      </GlassPanel>
    </motion.div>
  );
}

function Legal() {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-32 px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-col gap-8"
      >
        <Eyebrow>In writing</Eyebrow>
        <h2 className="font-display text-display-l text-ink">What shipped. What we store. What you pay.</h2>
      </motion.div>
      <div className="grid grid-cols-1 gap-24 lg:grid-cols-3">
        <LegalPanel id="release-notes" icon={FileText} title="Release notes — v1.0.0" items={RELEASE_NOTES} delay={0} />
        <LegalPanel id="privacy" icon={ShieldCheck} title="Privacy" items={PRIVACY_POINTS} delay={0.08} />
        <LegalPanel id="terms" icon={ScrollText} title="Terms of service" items={TERMS_POINTS} delay={0.16} />
      </div>
    </section>
  );
}

/* ── S6 — Contact + licenses ───────────────────────────────────────────── */

const LICENSES = [
  'Big Buck Bunny © Blender Foundation — blender.org',
  'Sintel © Blender Foundation',
  'Tears of Steel © Blender Foundation',
  'Elephants Dream © Blender Foundation',
  'Cosmos Laundromat © Blender Foundation',
  'Caminandes, Agent 327, Sprite Fright, Charge, Wing It! © Blender Foundation',
];

function ContactAndLicenses() {
  return (
    <section
      id="contact"
      className="relative z-10 mx-auto grid w-full max-w-[1280px] scroll-mt-[120px] grid-cols-1 gap-24 px-16 pb-96 md:px-24 lg:grid-cols-2"
    >
      {/* contact card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: OUT_EXPO }}
      >
        <GlassPanel level={3} className="flex h-full flex-col gap-16 rounded-2xl p-32">
          <h2 className="font-display text-title text-ink">Talk to a human.</h2>
          <p className="text-caption text-muted">
            Support is handled through the project's community channels.
          </p>
          <div className="flex flex-col gap-12">
            <a
              href="https://github.com/elitebox/discuss"
              target="_blank"
              rel="noopener noreferrer"
              className="focusable group flex items-center gap-12 rounded-lg px-12 py-10 text-caption text-ink hover:bg-white/[.06]"
            >
              <MessagesSquare size={20} strokeWidth={1.75} className="shrink-0 text-cyan" />
              <span className="flex flex-col">
                <span className="font-semibold">GitHub Discussions</span>
                <span className="font-mono text-[12px] text-muted">github.com/elitebox/discuss</span>
              </span>
              <ArrowUpRight
                size={16}
                strokeWidth={1.75}
                className="ml-auto text-muted transition-transform duration-150 group-hover:translate-x-2 group-hover:-translate-y-2"
              />
            </a>
            <a
              href="https://github.com/elitebox/elitebox/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="focusable group flex items-center gap-12 rounded-lg px-12 py-10 text-caption text-ink hover:bg-white/[.06]"
            >
              <Bug size={20} strokeWidth={1.75} className="shrink-0 text-cyan" />
              <span className="flex flex-col">
                <span className="font-semibold">Issue tracker</span>
                <span className="text-[12px] text-muted">
                  Bug reports with a diagnostics export attached get fixed first.
                </span>
              </span>
              <ArrowUpRight
                size={16}
                strokeWidth={1.75}
                className="ml-auto shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-2 group-hover:-translate-y-2"
              />
            </a>
          </div>
          <p className="mt-auto text-micro uppercase tracking-[.08em] text-muted">
            Never share your config export publicly — it contains your addon list.
          </p>
        </GlassPanel>
      </motion.div>

      {/* open content licenses card */}
      <motion.div
        id="licenses"
        className="scroll-mt-[120px]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: 0.12, duration: 0.55, ease: OUT_EXPO }}
      >
        <GlassPanel level={2} className="flex h-full flex-col gap-16 rounded-2xl p-32">
          <h2 className="font-display text-title text-ink">With gratitude.</h2>
          <p className="text-caption text-muted">
            The Showcase catalog is built on open films released under Creative Commons Attribution
            (CC-BY 3.0):
          </p>
          <ul className="flex flex-col gap-8">
            {LICENSES.map((l) => (
              <li key={l} className="flex items-start gap-10 text-caption text-muted">
                <Captions size={14} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                {l}
              </li>
            ))}
          </ul>
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="focusable group mt-auto inline-flex w-fit items-center gap-6 rounded-lg text-caption font-semibold text-cyan hover:underline"
          >
            Full license texts
            <ArrowUpRight
              size={16}
              strokeWidth={1.75}
              className="transition-transform duration-150 group-hover:translate-x-2 group-hover:-translate-y-2"
            />
          </a>
        </GlassPanel>
      </motion.div>
    </section>
  );
}

export default function Support() {
  /* Deep links: /support#<section-id> scrolls to that block (FAQ ids are
     handled inside Faq, which also opens the item). */
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Hero />
      <Faq />
      <Diagnostics />
      <Downloads />
      <Legal />
      <ContactAndLicenses />
    </>
  );
}
