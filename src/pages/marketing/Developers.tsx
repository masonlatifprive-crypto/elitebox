/**
 * /developers — the Elitebox addon developer guide. Documents the protocol
 * exactly as the shipped engine implements it: endpoints, timeouts,
 * circuit-breaker behavior, Manifest 2.0 declarations, and the safety screen.
 */
import { motion } from 'framer-motion';
import { Braces, Gauge, ShieldCheck, Timer, Wrench } from 'lucide-react';
import { Eyebrow, GlassPanel } from '@/components/ui-elite';

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
  {
    icon: Braces,
    title: 'The protocol',
    body: [
      'Elitebox addons are small JSON services. The app discovers your addon from a single manifest URL, then calls resource endpoints under the same base:',
      'GET /manifest.json — identity, resources, catalogs, declarations',
      'GET /catalog/{type}/{id}.json — poster grids; extras ride the path, e.g. /catalog/movie/top/search=batman.json or …/genre=sci-fi/skip=40.json',
      'GET /meta/{type}/{id}.json — one title, full detail',
      'GET /stream/{type}/{id}.json — playable sources for a title',
      'GET /subtitles/{type}/{id}.json — subtitle tracks (optional)',
    ],
  },
  {
    icon: Timer,
    title: 'How Elitebox calls you',
    body: [
      'Every request runs with a 5-second timeout. Answer promptly or the call is dropped and counted against the addon.',
      'Search is only requested from catalogs that declare the search extra. Catalog browsing uses the first catalog you declare per type — declare them deliberately.',
      'Elitebox never sends user identity, account data or watch history to addon endpoints. Design your addon to work without them.',
    ],
  },
  {
    icon: Gauge,
    title: 'Circuit breaker and health',
    body: [
      'Three consecutive failures open the circuit for 60 seconds: your addon is benched with a visible countdown, then a single half-open probe decides recovery. The addon manager shows your live latency, success rate and a reliability score computed from real probes.',
      'Keep p99 latency under ~800 ms to stay in the green band, and return valid JSON even for empty results ({ "metas": [] }).',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Safety screen (enforced)',
    body: [
      'HTTPS is required for hosted addons; plain HTTP is accepted only for localhost development.',
      'Manifests must include a valid id and name. Known piracy sources are hard-blocked at install time — Elitebox does not run addons associated with copyright-infringing indexes.',
      'The Manifest 2.0 declarations — permissions, privacy, legal — are optional but shown to users in the install preview when present. Declaring them builds trust.',
    ],
  },
  {
    icon: Wrench,
    title: 'Test locally in 60 seconds',
    body: [
      'Serve a manifest from any static server, e.g. `npx serve ./addon` or `python3 -m http.server` with the JSON files laid out by the routes above.',
      'Open Elitebox → Addons → Install by URL, paste http://localhost:<port>/manifest.json, and watch the preview show your resources and catalogs. Install, then browse Discover and Search — your catalog appears alongside the builtin showcase.',
      'Watch the health strip while you develop: forced failures (kill the server) show the breaker benching and recovering your addon in real time.',
    ],
  },
];

export default function Developers() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>Developers</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">Build an Elitebox addon.</h1>
        <p className="max-w-[64ch] text-body text-muted">
          One JSON manifest, four optional endpoints, and your catalog sits next to everything
          else your users watch — with health monitoring, honest reliability scoring and a
          safety screen that keeps the ecosystem clean.
        </p>
      </motion.header>

      <GlassPanel className="overflow-x-auto rounded-xl p-24">
        <span className="mb-12 block text-micro uppercase text-muted">manifest.json — complete example</span>
        <pre className="font-mono text-[12.5px] leading-relaxed text-cyan/90">{MANIFEST}</pre>
      </GlassPanel>

      <div className="grid gap-20 md:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <motion.section
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: (i % 2) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="glass-2 flex flex-col gap-12 rounded-xl p-24"
          >
            <span className="glass-1 flex h-40 w-40 items-center justify-center rounded-lg text-cyan">
              <s.icon size={19} strokeWidth={1.75} />
            </span>
            <h2 className="font-display text-title-s text-ink">{s.title}</h2>
            <div className="flex flex-col gap-8">
              {s.body.map((line) => (
                <p key={line.slice(0, 24)} className="text-caption text-muted">
                  {line}
                </p>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
