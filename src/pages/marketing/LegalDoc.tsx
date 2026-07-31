/**
 * Shared legal-document layout for /privacy, /terms and /security.
 * Real policy copy lives in each page; this shell keeps typography and
 * structure consistent with the marketing design system.
 */
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/ui-elite';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export function LegalDoc({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[880px] flex-col gap-40 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">{title}</h1>
        <p className="text-caption text-muted">Last updated: {updated}</p>
        <p className="max-w-[64ch] text-body text-muted">{intro}</p>
      </motion.header>

      <nav aria-label="On this page" className="glass-2 flex flex-wrap gap-8 rounded-xl p-16">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="focusable rounded-full border border-white/[.08] px-12 py-6 text-caption text-ink/80 transition-colors hover:text-cyan"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-40">
        {sections.map((s) => (
          <motion.section
            key={s.id}
            id={s.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex scroll-mt-[120px] flex-col gap-12"
          >
            <h2 className="font-display text-title text-ink">{s.title}</h2>
            <div className="flex flex-col gap-10 text-body text-muted [&_strong]:text-ink">{s.body}</div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
