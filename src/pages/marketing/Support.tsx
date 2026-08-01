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
import { useT } from '@/i18n';

const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── S1 — Hero + status card ───────────────────────────────────────────── */

function StatusCard() {
  const { t } = useT();
  const installed = useAddons((s) => s.installed);
  const showcase = addonEngine.health('elitebox.showcase');
  const liveOk = installed.some((a) => a.builtin);
  const rows = [
    { label: t('marketing.support.status.webEngine'), status: 'ok' as const, note: t('marketing.support.status.operational') },
    {
      label: t('marketing.support.status.showcase'),
      status: showcase.status,
      note: showcase.status === 'ok' ? t('marketing.support.status.operational') : showcase.status,
    },
    {
      label: t('marketing.support.status.live'),
      status: liveOk ? ('ok' as const) : ('down' as const),
      note: liveOk ? t('marketing.support.status.operational') : t('marketing.support.status.noSource'),
    },
  ];
  return (
    <GlassPanel level={2} className="flex w-full max-w-sm flex-col gap-16 rounded-xl p-24">
      <p className="text-micro uppercase tracking-[.08em] text-muted">{t('marketing.support.status.title')}</p>
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
  const { t } = useT();
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
              <Eyebrow className="mb-16">{t('marketing.support.hero.eyebrow')}</Eyebrow>
            </motion.div>
            <h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.035em] font-extrabold md:text-display-xl">
              {t('marketing.support.hero.title').split(' ').map((word, i) => (
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
            {t('marketing.support.hero.sub')}
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
  { id: 'q1' },
  { id: 'q2' },
  { id: 'q3' },
  { id: 'q4' },
  { id: 'q5' },
  { id: 'q6' },
  { id: 'q7' },
  { id: 'q8' },
  { id: 'q9' },
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
  const { t } = useT();
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
        <span className="text-caption font-semibold text-ink">{t(`marketing.support.faq.${faq.id}.q`)}</span>
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
            <p className="max-w-[68ch] px-20 pb-16 text-caption text-muted">{t(`marketing.support.faq.${faq.id}.a`)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Faq() {
  const { t } = useT();
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
        <Eyebrow>{t('marketing.support.faq.eyebrow')}</Eyebrow>
        <h2 className="font-display text-display-l text-ink">{t('marketing.support.faq.title')}</h2>
        <p className="text-caption text-muted">{t('marketing.support.faq.sub')}</p>
        <ButtonGhost onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="w-fit">
          {t('marketing.support.faq.contact')}
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

const STEPS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

function Diagnostics() {
  const { t } = useT();
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
          <Eyebrow>{t('marketing.support.diagnostics.eyebrow')}</Eyebrow>
          <h2 className="font-display text-display-l text-ink">{t('marketing.support.diagnostics.title')}</h2>
        </motion.div>

        <GlassPanel level={2} className="flex flex-col gap-16 rounded-xl p-24">
          {STEPS.map((s, i) => (
            <motion.div
              key={s}
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
                <h3 className="font-display text-title text-ink">{t(`marketing.support.diagnostics.${s}.name`)}</h3>
                <p className="text-caption text-muted">{t(`marketing.support.diagnostics.${s}.instruction`)}</p>
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
            alt={t('marketing.support.diagnostics.imageAlt')}
            loading="lazy"
            className="w-full rounded-lg"
          />
        </GlassPanel>
      </motion.div>
    </section>
  );
}

/* ── S4 — Downloads ────────────────────────────────────────────────────── */

function Downloads() {
  const { t } = useT();
  const cards = [
    { icon: Monitor, slug: 'windows', action: () => toast(t('marketing.support.downloads.toasts.exe')) },
    { icon: Smartphone, slug: 'android', action: () => toast(t('marketing.support.downloads.toasts.apk')) },
    { icon: Globe, slug: 'web', action: undefined },
    { icon: Tv, slug: 'androidTv', action: () => toast(t('marketing.support.downloads.toasts.tv')) },
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
        <Eyebrow>{t('marketing.support.downloads.eyebrow')}</Eyebrow>
        <h2 className="font-display text-display-l text-ink">{t('marketing.support.downloads.title')}</h2>
      </motion.div>
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.slug}
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
                <h3 className="font-display text-title text-ink">{t(`marketing.platformCards.${card.slug}.name`)}</h3>
                <p className="text-caption text-muted">{t(`marketing.platformCards.${card.slug}.detail`)}</p>
              </div>
              {card.action ? (
                <ButtonNeon onClick={card.action} className="mt-auto px-16 py-8 text-[12px]">
                  <Download size={14} strokeWidth={1.75} /> {t(`marketing.platformCards.${card.slug}.cta`)}
                </ButtonNeon>
              ) : (
                <ButtonPrimary to="/app" className="mt-auto px-16 py-8 text-[12px]">
                  {t(`marketing.platformCards.${card.slug}.cta`)}
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

const RELEASE_NOTES = ['p1', 'p2', 'p3', 'p4', 'p5'] as const;
const PRIVACY_POINTS = ['p1', 'p2', 'p3', 'p4'] as const;
const TERMS_POINTS = ['p1', 'p2', 'p3', 'p4'] as const;

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
  const { t } = useT();
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-32 px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-col gap-8"
      >
        <Eyebrow>{t('marketing.support.legal.eyebrow')}</Eyebrow>
        <h2 className="font-display text-display-l text-ink">{t('marketing.support.legal.title')}</h2>
      </motion.div>
      <div className="grid grid-cols-1 gap-24 lg:grid-cols-3">
        <LegalPanel id="release-notes" icon={FileText} title={t('marketing.support.legal.releaseNotes.title')} items={RELEASE_NOTES.map((p) => t(`marketing.support.legal.releaseNotes.${p}`))} delay={0} />
        <LegalPanel id="privacy" icon={ShieldCheck} title={t('marketing.support.legal.privacy.title')} items={PRIVACY_POINTS.map((p) => t(`marketing.support.legal.privacy.${p}`))} delay={0.08} />
        <LegalPanel id="terms" icon={ScrollText} title={t('marketing.support.legal.terms.title')} items={TERMS_POINTS.map((p) => t(`marketing.support.legal.terms.${p}`))} delay={0.16} />
      </div>
    </section>
  );
}

/* ── S6 — Contact + licenses ───────────────────────────────────────────── */

const LICENSES = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'] as const;

function ContactAndLicenses() {
  const { t } = useT();
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
          <h2 className="font-display text-title text-ink">{t('marketing.support.contact.title')}</h2>
          <p className="text-caption text-muted">
            {t('marketing.support.contact.sub')}
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
                <span className="font-semibold">{t('marketing.support.contact.github')}</span>
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
                <span className="font-semibold">{t('marketing.support.contact.issues')}</span>
                <span className="text-[12px] text-muted">
                  {t('marketing.support.contact.issuesNote')}
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
            {t('marketing.support.contact.warning')}
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
          <h2 className="font-display text-title text-ink">{t('marketing.support.licenses.title')}</h2>
          <p className="text-caption text-muted">
            {t('marketing.support.licenses.intro')}
          </p>
          <ul className="flex flex-col gap-8">
            {LICENSES.map((l) => (
              <li key={l} className="flex items-start gap-10 text-caption text-muted">
                <Captions size={14} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                {t(`marketing.support.licenses.${l}`)}
              </li>
            ))}
          </ul>
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="focusable group mt-auto inline-flex w-fit items-center gap-6 rounded-lg text-caption font-semibold text-cyan hover:underline"
          >
            {t('marketing.support.licenses.fullTexts')}
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
