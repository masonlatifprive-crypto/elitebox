/**
 * /technology — what actually powers Elitebox. Honest stack, no invented
 * partnerships: these are the real open technologies in the shipped build.
 */
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/ui-elite';

const STACK = [
  { name: 'React 19', note: 'The interface layer — every screen in the app and this site.' },
  { name: 'TypeScript', note: 'The whole codebase, strictly typed end to end.' },
  { name: 'Vite 7', note: 'Build tooling — hashed, code-split, immutable assets.' },
  { name: 'hls.js', note: 'Adaptive HLS playback with smart buffering and recovery in the player.' },
  { name: 'Tailwind CSS', note: 'The lunar design system behind every surface.' },
  { name: 'Framer Motion & GSAP', note: 'Cinematic motion — including the LivingTree on the homepage.' },
  { name: 'Zustand', note: 'On-device state and persistence for your library, profiles and settings.' },
  { name: 'Capacitor', note: 'The native Android and Android TV shells — one codebase, leanback ready.' },
  { name: 'Electron', note: 'The Windows, macOS and Linux desktop shells.' },
  { name: 'Express', note: 'The companion server — accounts, billing and the gated build service.' },
  { name: 'PWA', note: 'Installable straight from the browser — offline shell included.' },
  { name: 'The open addon protocol', note: 'One JSON manifest, four resources: catalog, meta, stream, subtitles.' },
];

export default function Technology() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>Technology</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">What powers Elitebox.</h1>
        <p className="max-w-[64ch] text-body-l text-muted">
          No magic and no mystery — a modern, honest stack where every piece earns its place.
        </p>
      </motion.header>

      <div className="grid gap-16 md:grid-cols-2 xl:grid-cols-3">
        {STACK.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="glass-2 flex flex-col gap-8 rounded-xl p-20"
          >
            <span className="font-mono text-caption text-cyan">{t.name}</span>
            <p className="text-caption text-muted">{t.note}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
