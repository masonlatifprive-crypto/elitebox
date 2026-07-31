/**
 * /features — the Elitebox feature tour. Every card is a shipped feature,
 * linked to where it lives in the app. Stremio-style confidence, Elitebox voice.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
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

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'Easy to use',
    copy: 'A clean, calm interface that gets out of the way. Open the app, pick a poster, press play — everything else is one tap away.',
    to: '/app',
    link: 'Open the app',
  },
  {
    icon: Globe2,
    title: 'Seamless across devices',
    copy: 'Web, Windows, Android and TV — one library, one watch history, one Elitebox. Your progress follows your profile to every screen.',
    to: '/downloads',
    link: 'All downloads',
  },
  {
    icon: Puzzle,
    title: 'Addons, on your terms',
    copy: 'Install community catalogs with one URL. Every addon shows its permissions before it runs, and a circuit breaker benches anything that slows you down.',
    to: '/app/addons',
    link: 'Manage addons',
  },
  {
    icon: MonitorPlay,
    title: 'A player that recovers itself',
    copy: 'Adaptive HLS with smart source scoring, automatic fallback, per-title subtitle sync, skip controls and full keyboard or remote control.',
    to: '/app',
    link: 'Meet the player',
  },
  {
    icon: CalendarDays,
    title: 'Never miss a premiere',
    copy: 'The Release Calendar tracks new and upcoming titles across your catalogs — with watchlist reminders the moment a confirmed date lands.',
    to: '/app/calendar',
    link: 'Open the calendar',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    copy: 'Your library lives on your device — no viewing logs, no trackers, no analytics beacons. Incognito mode pauses history with one switch.',
    to: '/privacy',
    link: 'Read the privacy policy',
  },
  {
    icon: LayoutGrid,
    title: 'Discover, actually curated',
    copy: 'Smart collections, on-device "From your taste" scoring and a command palette that finds any title, genre or channel in a keystroke.',
    to: '/app/discover',
    link: 'Browse Discover',
  },
  {
    icon: Tv,
    title: 'A true 10-foot TV interface',
    copy: 'Spatial remote navigation, TV-safe layout and leanback focus states — the same app, native on your couch.',
    to: '/downloads',
    link: 'Get it for TV',
  },
  {
    icon: Captions,
    title: 'Subtitles done right',
    copy: 'Upload your own .srt/.vtt, tune weight, color, background and outline, and nudge sync in quarter-second steps — remembered per title.',
    to: '/app/settings',
    link: 'Subtitle settings',
  },
  {
    icon: FastForward,
    title: 'Built for speed',
    copy: 'Warm CDN connections, prefetching, image discipline and a bundle that stays lean. Elitebox starts fast and stays fast.',
    to: '/updates',
    link: 'See the engineering',
  },
];

export default function Features() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>Features</Eyebrow>
        <h1 className="font-display text-display-xl text-ink max-w-[18ch]">
          Stream like it was built for you.
        </h1>
        <p className="max-w-[64ch] text-body-l text-muted">
          Everything below ships today — no roadmap promises, no placeholders. Each feature links
          straight to where it lives.
        </p>
      </motion.header>

      <div className="grid gap-20 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
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
            <h2 className="font-display text-title-s text-ink">{f.title}</h2>
            <p className="flex-1 text-caption text-muted">{f.copy}</p>
            <Link
              to={f.to}
              className="focusable w-fit rounded-full text-caption font-semibold text-muted transition-colors hover:text-cyan"
            >
              {f.link} →
            </Link>
          </motion.article>
        ))}
      </div>

      <div className="flex flex-col items-center gap-16 pt-32 text-center">
        <h2 className="font-display text-display-l text-ink">Watch & enjoy.</h2>
        <p className="max-w-[52ch] text-body-l text-muted">
          Elitebox makes it a piece of cake — free to start, $4.99 a month when you want everything.
        </p>
        <div className="flex flex-wrap justify-center gap-12">
          <ButtonPrimary to="/app">Open the app</ButtonPrimary>
          <ButtonNeon to="/subscribe">Go Premium</ButtonNeon>
        </div>
      </div>
    </div>
  );
}
