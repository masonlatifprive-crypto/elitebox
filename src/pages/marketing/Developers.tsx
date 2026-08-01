/**
 * /developers — the Elitebox addon developer guide. Documents the protocol
 * exactly as the shipped engine implements it: endpoints, timeouts,
 * circuit-breaker behavior, Manifest 2.0 declarations, and the safety screen.
 */
import { motion } from 'framer-motion';
import { Braces, Gauge, ShieldCheck, Timer, Wrench } from 'lucide-react';
import { Eyebrow, GlassPanel } from '@/components/ui-elite';
import { useT } from '@/i18n';

const MANIFEST = `{
  "id": "com.example.myaddon",
  "version": "1.0.0",
  "name": "My Addon",
  "description": "What it provides, in one line.",
  "logo": "https://example.com/icon.png",
  "resources": ["catalog", "meta", "stream"],
  "types": ["movie", "series"],
  "catalogs": [
    {
      "type": "movie",
      "id": "top",
      "name": "Top movies",
      "extra": [{ "name": "search" }, { "name": "genre" }, { "name": "skip" }]
    }
  ],
  "permissions": [],
  "privacy": { "receivesUserId": false, "receivesWatchHistory": false },
  "legal": { "copyrightSafe": true, "contentRightsDeclared": true }
}`;

const SECTIONS = [
  { icon: Braces, slug: 'protocol', lines: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'] },
  { icon: Timer, slug: 'calls', lines: ['l1', 'l2', 'l3'] },
  { icon: Gauge, slug: 'circuit', lines: ['l1', 'l2'] },
  { icon: ShieldCheck, slug: 'safety', lines: ['l1', 'l2', 'l3'] },
  { icon: Wrench, slug: 'local', lines: ['l1', 'l2', 'l3'] },
] as const;

export default function Developers() {
  const { t } = useT();
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>{t('marketing.developers.eyebrow')}</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">{t('marketing.developers.title')}</h1>
        <p className="max-w-[64ch] text-body text-muted">
          {t('marketing.developers.sub')}
        </p>
      </motion.header>

      <GlassPanel className="overflow-x-auto rounded-xl p-24">
        <span className="mb-12 block text-micro uppercase text-muted">{t('marketing.developers.manifestCaption')}</span>
        <pre className="font-mono text-[12.5px] leading-relaxed text-cyan/90">{MANIFEST}</pre>
      </GlassPanel>

      <div className="grid gap-20 md:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <motion.section
            key={s.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: (i % 2) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="glass-2 flex flex-col gap-12 rounded-xl p-24"
          >
            <span className="glass-1 flex h-40 w-40 items-center justify-center rounded-lg text-cyan">
              <s.icon size={19} strokeWidth={1.75} />
            </span>
            <h2 className="font-display text-title-s text-ink">{t(`marketing.developers.${s.slug}.title`)}</h2>
            <div className="flex flex-col gap-8">
              {s.lines.map((line) => (
                <p key={line} className="text-caption text-muted">
                  {t(`marketing.developers.${s.slug}.${line}`)}
                </p>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
