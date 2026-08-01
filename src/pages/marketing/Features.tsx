/**
 * /features — the Elitebox feature tour. Every card is a shipped feature,
 * linked to where it lives in the app. Stremio-style confidence, Elitebox voice.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Captions,
  FastForward,
  Globe2,
  LayoutGrid,
  MonitorPlay,
  MousePointerClick,
  Puzzle,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import { ButtonNeon, ButtonPrimary, Eyebrow } from '@/components/ui-elite';
import { useT } from '@/i18n';

const FEATURES = [
  { icon: MousePointerClick, slug: 'f1', to: '/app' },
  { icon: Globe2, slug: 'f2', to: '/downloads' },
  { icon: Puzzle, slug: 'f3', to: '/app/addons' },
  { icon: MonitorPlay, slug: 'f4', to: '/app' },
  { icon: CalendarDays, slug: 'f5', to: '/app/calendar' },
  { icon: ShieldCheck, slug: 'f6', to: '/privacy' },
  { icon: LayoutGrid, slug: 'f7', to: '/app/discover' },
  { icon: Tv, slug: 'f8', to: '/downloads' },
  { icon: Captions, slug: 'f9', to: '/app/settings' },
  { icon: FastForward, slug: 'f10', to: '/updates' },
];

export default function Features() {
  const { t } = useT();
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>{t('marketing.features.eyebrow')}</Eyebrow>
        <h1 className="font-display text-display-xl text-ink max-w-[18ch]">
          {t('marketing.features.title')}
        </h1>
        <p className="max-w-[64ch] text-body-l text-muted">
          {t('marketing.features.sub')}
        </p>
      </motion.header>

      <div className="grid gap-20 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="glass-2 group relative flex flex-col gap-12 overflow-hidden rounded-xl p-24"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-[45%] -inset-x-[20%] h-[120px] rounded-full bg-[radial-gradient(closest-side,rgba(124,217,236,.18),transparent)] opacity-0 transition-opacity duration-[360ms] group-hover:opacity-100"
            />
            <span className="glass-1 flex h-44 w-44 items-center justify-center rounded-lg text-cyan">
              <f.icon size={21} strokeWidth={1.75} />
            </span>
            <h2 className="font-display text-title-s text-ink">{t(`marketing.features.${f.slug}.title`)}</h2>
            <p className="flex-1 text-caption text-muted">{t(`marketing.features.${f.slug}.copy`)}</p>
            <Link
              to={f.to}
              className="focusable w-fit rounded-full text-caption font-semibold text-muted transition-colors hover:text-cyan"
            >
              {t(`marketing.features.${f.slug}.link`)}
              <ArrowRight size={14} strokeWidth={1.75} className="ml-4 inline" aria-hidden />
            </Link>
          </motion.article>
        ))}
      </div>

      <div className="flex flex-col items-center gap-16 pt-32 text-center">
        <h2 className="font-display text-display-l text-ink">{t('marketing.features.cta.title')}</h2>
        <p className="max-w-[52ch] text-body-l text-muted">
          {t('marketing.features.cta.sub')}
        </p>
        <div className="flex flex-wrap justify-center gap-12">
          <ButtonPrimary to="/app">{t('marketing.features.cta.open')}</ButtonPrimary>
          <ButtonNeon to="/subscribe">{t('marketing.features.cta.premium')}</ButtonNeon>
        </div>
      </div>
    </div>
  );
}
