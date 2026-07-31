/**
 * /updates — release notes + live local service status (addon health read
 * from the on-device engine: real probes, not a status theater).
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, GitCommitHorizontal, HeartPulse } from 'lucide-react';
import { addonEngine } from '@/lib/addons/engine';
import type { AddonHealth } from '@/lib/types';
import { Eyebrow, GlassPanel, HealthDot } from '@/components/ui-elite';

interface ReleaseNote {
  version: string;
  date: string;
  highlights: string[];
}

const RELEASES: ReleaseNote[] = [
  {
    version: '1.0.0-rc',
    date: 'July 2026',
    highlights: [
      'Living Tree hero — the animated Elitebox mark above the headline, calm under reduced motion',
      'Upcoming & Originals: honest coming-soon premieres with watchlist tracking and the new Release Calendar',
      'Addon engine hardened: Manifest 2.0 declarations, HTTPS enforcement, piracy blocklist, reliability scoring',
      'Player: progressive seek with on-screen target preview, per-title subtitle sync, source failover',
      'Legal pages, developer guide, downloads matrix and these notes go live',
    ],
  },
  {
    version: '0.9.0',
    date: 'July 2026',
    highlights: [
      'Unified lunar design system across marketing and app',
      'Discover smart collections, Command Palette (Ctrl+K), spatial TV navigation',
      'Library: favorites, watchlist, watched marks and continue-watching across profiles',
      'Addon manager with circuit-breaker health monitor and install-by-URL previews',
    ],
  },
  {
    version: '0.8.0',
    date: 'July 2026',
    highlights: [
      'First public web build: showcase catalog of CC-BY open movies, series and open live channels',
      'hls.js player with adaptive playback, subtitle offset sync and keyboard shortcuts',
      'Profiles with PIN lock, stats dashboard, data export/import',
    ],
  },
];

function LiveStatus() {
  const [health, setHealth] = useState<Record<string, AddonHealth>>({});
  useEffect(() => {
    const read = () => setHealth(addonEngine.healthAll());
    read();
    const t = setInterval(read, 5000);
    return () => clearInterval(t);
  }, []);
  const rows = addonEngine.list().map((a) => ({ addon: a, h: health[a.id] }));
  return (
    <GlassPanel className="flex flex-col gap-12 rounded-xl p-24">
      <div className="flex items-center gap-10">
        <HeartPulse size={18} strokeWidth={1.75} className="text-cyan" />
        <h2 className="font-display text-title-s text-ink">Live status — this device</h2>
      </div>
      <p className="text-caption text-muted">
        Real-time health of your installed addons, measured by actual probes from your browser.
        Refreshing every 5 seconds.
      </p>
      <div className="flex flex-col gap-8">
        {rows.map(({ addon, h }) => (
          <div key={addon.id} className="flex items-center justify-between gap-12 border-t border-white/[.06] pt-8">
            <span className="text-caption text-ink">{addon.name}</span>
            <span className="flex items-center gap-10">
              {h && (
                <span className="font-mono text-[11px] text-muted">
                  {Math.round(h.successRate * 100)}% · circuit {h.circuit}
                </span>
              )}
              {h ? (
                <HealthDot status={h.status} latencyMs={h.latencyMs} />
              ) : (
                <Activity size={14} strokeWidth={1.75} className="text-muted" />
              )}
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export default function Updates() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[880px] flex-col gap-48 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>Updates</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">Release notes & status.</h1>
        <p className="max-w-[64ch] text-body text-muted">
          What shipped, when — plus a live read of your addon health, measured on this device.
        </p>
      </motion.header>

      <LiveStatus />

      <div className="flex flex-col gap-24">
        {RELEASES.map((r) => (
          <motion.article
            key={r.version}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass-2 flex flex-col gap-12 rounded-xl p-24"
          >
            <div className="flex flex-wrap items-center gap-12">
              <span className="glass-1 flex h-32 w-32 items-center justify-center rounded-lg text-cyan">
                <GitCommitHorizontal size={16} strokeWidth={1.75} />
              </span>
              <span className="font-mono text-caption text-cyan">v{r.version}</span>
              <span className="text-caption text-muted">{r.date}</span>
            </div>
            <ul className="flex flex-col gap-6">
              {r.highlights.map((h) => (
                <li key={h} className="text-caption text-muted">
                  · {h}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
