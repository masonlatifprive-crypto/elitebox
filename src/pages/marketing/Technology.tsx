/**
 * /technology — what actually powers Elitebox. Honest stack, no invented
 * partnerships: these are the real open technologies in the shipped build.
 */
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/ui-elite';
import { useT } from '@/i18n';

const STACK = [
  'react',
  'typescript',
  'vite',
  'hls',
  'tailwind',
  'motion',
  'zustand',
  'capacitor',
  'electron',
  'express',
  'pwa',
  'addonProtocol',
] as const;

export default function Technology() {
  const { t } = useT();
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>{t('marketing.technology.eyebrow')}</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">{t('marketing.technology.title')}</h1>
        <p className="max-w-[64ch] text-body-l text-muted">
          {t('marketing.technology.sub')}
        </p>
      </motion.header>

      <div className="grid gap-16 md:grid-cols-2 xl:grid-cols-3">
        {STACK.map((slug, i) => (
          <motion.div
            key={slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="glass-2 flex flex-col gap-8 rounded-xl p-20"
          >
            <span className="font-mono text-caption text-cyan">{t(`marketing.technology.stack.${slug}.name`)}</span>
            <p className="text-caption text-muted">{t(`marketing.technology.stack.${slug}.note`)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
