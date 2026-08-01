/**
 * PlayerStats — toggleable live statistics overlay for the player
 * (Stremio parity). Every number is read from the real video element or
 * the active hls.js instance, refreshed once per second while open.
 * Rows without a real source are hidden; dropped frames show an honest
 * "not reported by this browser" note where getVideoPlaybackQuality()
 * is absent (e.g. Safari).
 */
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import type Hls from 'hls.js';
import { useT } from '@/i18n';

interface StatsSnapshot {
  resolution?: string;
  playbackRate?: number;
  bufferedAheadSec?: number;
  frames?: { dropped: number; total: number };
  framesReported: boolean;
  levelBitrate?: number; // bits/s
  bandwidthEstimate?: number; // bits/s
}

function readSnapshot(
  video: HTMLVideoElement | null,
  hls: Hls | null,
): StatsSnapshot {
  const snap: StatsSnapshot = { framesReported: false };
  if (video) {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      snap.resolution = `${video.videoWidth}×${video.videoHeight}`;
    }
    if (Number.isFinite(video.playbackRate)) snap.playbackRate = video.playbackRate;
    /* buffered seconds ahead of the playhead, from the real TimeRanges */
    const t = video.currentTime;
    for (let i = 0; i < video.buffered.length; i += 1) {
      if (video.buffered.start(i) <= t && t <= video.buffered.end(i)) {
        snap.bufferedAheadSec = Math.max(0, video.buffered.end(i) - t);
        break;
      }
    }
    if (typeof video.getVideoPlaybackQuality === 'function') {
      const q = video.getVideoPlaybackQuality();
      snap.frames = { dropped: q.droppedVideoFrames, total: q.totalVideoFrames };
      snap.framesReported = true;
    }
  }
  if (hls) {
    const level = hls.currentLevel >= 0 ? hls.levels?.[hls.currentLevel] : undefined;
    if (level && Number.isFinite(level.bitrate) && level.bitrate > 0) {
      snap.levelBitrate = level.bitrate;
    }
    if (Number.isFinite(hls.bandwidthEstimate) && hls.bandwidthEstimate > 0) {
      snap.bandwidthEstimate = hls.bandwidthEstimate;
    }
  }
  return snap;
}

function fmtBitrate(bitsPerSec: number): string {
  return bitsPerSec >= 1_000_000
    ? `${(bitsPerSec / 1_000_000).toFixed(2)} Mbps`
    : `${Math.round(bitsPerSec / 1_000)} kbps`;
}

export default function PlayerStats({
  open,
  videoRef,
  hlsRef,
}: {
  open: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  hlsRef: RefObject<Hls | null>;
}) {
  const { t } = useT();
  const [snap, setSnap] = useState<StatsSnapshot | null>(null);

  useEffect(() => {
    if (!open) return;
    const tick = () => setSnap(readSnapshot(videoRef.current, hlsRef.current));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [open, videoRef, hlsRef]);

  /* keep rendering the last snapshot while open so the exit animation
     (parent AnimatePresence) can play with real content */
  if (!snap) return null;

  const rows: Array<{ label: string; value: string }> = [];
  if (snap.resolution) rows.push({ label: t('app.player.statsResolution'), value: snap.resolution });
  if (snap.playbackRate !== undefined) {
    rows.push({ label: t('app.player.statsSpeed'), value: `${snap.playbackRate}×` });
  }
  if (snap.bufferedAheadSec !== undefined) {
    rows.push({
      label: t('app.player.statsBuffered'),
      value: t('app.player.statsBufferedValue', { s: snap.bufferedAheadSec.toFixed(1) }),
    });
  }
  if (snap.levelBitrate !== undefined) {
    rows.push({ label: t('app.player.statsBitrate'), value: fmtBitrate(snap.levelBitrate) });
  }
  if (snap.bandwidthEstimate !== undefined) {
    rows.push({ label: t('app.player.statsBandwidth'), value: fmtBitrate(snap.bandwidthEstimate) });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-label={t('app.player.statsTitle')}
      className="glass-3 pointer-events-none absolute left-16 top-[72px] z-30 w-[270px] max-w-[calc(100vw-32px)] rounded-xl p-16 md:left-24"
    >
      <h3 className="mb-10 text-micro uppercase tracking-wider text-muted">
        {t('app.player.statsTitle')}
      </h3>
      <dl className="flex flex-col gap-6">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-12">
            <dt className="text-[12px] text-muted">{row.label}</dt>
            <dd className="font-mono text-[12px] text-ink">{row.value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-12">
          <dt className="text-[12px] text-muted">{t('app.player.statsFrames')}</dt>
          <dd className="text-right font-mono text-[12px] text-ink">
            {snap.framesReported && snap.frames
              ? t('app.player.statsFramesValue', {
                  dropped: snap.frames.dropped,
                  total: snap.frames.total,
                })
              : t('app.player.statsFramesNa')}
          </dd>
        </div>
      </dl>
    </motion.div>
  );
}
