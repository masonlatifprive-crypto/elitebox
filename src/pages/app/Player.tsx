/**
 * Player — /app/player/:type/:id (player.md). Wrapped in SubscriptionGate.
 *
 * The cinematic playback surface: HTML5 video (+ hls.js for .m3u8), glass
 * auto-hiding chrome, resume + per-title memory (speed / tracks / subtitle
 * offset via usePlaybackMemory), WebVTT subtitles with style controls,
 * skip-intro markers, next-episode countdown, touch double-tap seeking,
 * full keyboard map and the signature unified error recovery (auto-retry
 * once after 4s, then Try next source / Lower quality / Retry).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type Hls from 'hls.js';
import {
  AlertTriangle,
  ArrowRight,
  AudioLines,
  Cast,
  Check,
  ChevronLeft,
  CircleHelp,
  ClosedCaption,
  Gauge,
  ListVideo,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RefreshCw,
  RotateCw,
  SkipForward,
  Sparkles,
  SquareArrowOutUpRight,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { addonEngine } from '@/lib/addons/engine';
import { useLibrary, usePlaybackMemory, useSettings } from '@/lib/store';
import SubscriptionGate from '@/components/SubscriptionGate';
import {
  Badge,
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  HealthDot,
  Modal,
  spring,
  toast,
} from '@/components/ui-elite';
import type { MetaItem, MetaType, MetaVideo, StreamSource, StreamSubtitle } from '@/lib/types';
import { useT } from '@/i18n';
import ExternalPlayerMenu from '@/components/ExternalPlayerMenu';
import {
  ensureCastFramework,
  isCastEnvironment,
  onCastStateChange,
  startCasting,
  stopCasting,
  type CastFramework,
  type CastMedia,
} from '@/lib/cast';
import { cn } from '@/lib/utils';

/* ── in-page showcase markers & constants ──────────────────────────────── */

/** Skip-intro regions (seconds) for showcase titles. */
const INTRO_MARKERS: Record<string, { start: number; end: number }> = {
  'big-buck-bunny': { start: 0, end: 18 },
  sintel: { start: 24, end: 54 },
  'tears-of-steel': { start: 0, end: 37 },
  'elephants-dream': { start: 0, end: 42 },
  'cosmos-laundromat': { start: 0, end: 28 },
  'caminandes-series-s01e01': { start: 0, end: 12 },
  'caminandes-series-s01e02': { start: 0, end: 12 },
  'caminandes-series-s01e03': { start: 0, end: 12 },
};

const NEXT_UP_SECONDS = 8;
const AUTO_RETRY_SECONDS = 4;
const VOLUME_KEY = 'elitebox.v1.volume';
const SPEED_PRESETS = [1, 1.25, 1.5, 2];

function fmtClock(totalSec: number): string {
  if (!Number.isFinite(totalSec)) return '--:--';
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    : `${m}:${String(s % 60).padStart(2, '0')}`;
}

function qualityRank(q: string): number {
  const k = q.toUpperCase();
  if (k === '4K') return 3;
  if (k === 'HD') return 2;
  if (k === 'SD') return 1;
  return 0;
}

/* ── WebVTT parsing (all tracks normalized to UTF-8 WebVTT) ────────────── */

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseVttTime(s: string): number {
  const m = s.trim().match(/(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})/);
  if (!m) return 0;
  return (m[1] ? Number(m[1]) * 3600 : 0) + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of text.replace(/\r/g, '').split('\n\n')) {
    const lines = block.split('\n').filter((l) => l.trim().length > 0);
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx === -1) continue;
    const [a, b] = lines[timeIdx].split('-->').map((x) => x.trim().split(/\s+/)[0]);
    const text2 = lines.slice(timeIdx + 1).join('\n');
    if (text2) cues.push({ start: parseVttTime(a), end: parseVttTime(b), text: text2 });
  }
  return cues;
}

/* ── small presentational pieces ───────────────────────────────────────── */

function BufferingRing() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-56 w-56 animate-spin rounded-full border-2 border-white/[.08] border-t-cyan" />
    </div>
  );
}

function CenterFlash({ kind }: { kind: 'play' | 'pause' }) {
  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 0.6 }}
      animate={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <span className="glass-3 flex h-96 w-96 items-center justify-center rounded-full text-ink">
        {kind === 'play' ? (
          <Play size={40} strokeWidth={1.75} className="fill-current" />
        ) : (
          <Pause size={40} strokeWidth={1.75} className="fill-current" />
        )}
      </span>
    </motion.div>
  );
}

/* ── seek bar ──────────────────────────────────────────────────────────── */

function SeekBar({
  current,
  duration,
  buffered,
  marker,
  onSeek,
}: {
  current: number;
  duration: number;
  buffered: number;
  marker?: { start: number; end: number };
  onSeek: (sec: number) => void;
}) {
  const { t } = useT();
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverSec, setHoverSec] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const bufPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  const secAt = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const nearMarker = (sec: number): boolean =>
    Boolean(marker && duration > 0 && Math.abs(sec - marker.start) / duration < 0.02);

  return (
    <div className="relative">
      {/* hover tooltip */}
      {hoverSec !== null && duration > 0 && (
        <div
          className="glass-2 pointer-events-none absolute -top-36 z-10 -translate-x-1/2 rounded-md px-10 py-4 font-mono text-[11px] text-ink"
          style={{ left: `${(hoverSec / duration) * 100}%` }}
        >
          {fmtClock(hoverSec)}
          {nearMarker(hoverSec) && <span className="text-purple"> · {t('app.player.introMarker')}</span>}
        </div>
      )}
      <motion.div
        ref={barRef}
        role="slider"
        aria-label={t('app.player.seekAria')}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        aria-valuetext={t('app.player.seekValue', { current: fmtClock(current), duration: fmtClock(duration) })}
        tabIndex={0}
        initial={false}
        className="focusable group relative flex h-20 cursor-pointer items-center"
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          onSeek(secAt(e.clientX));
        }}
        onPointerMove={(e) => {
          setHoverSec(secAt(e.clientX));
          if (dragging) onSeek(secAt(e.clientX));
        }}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => {
          setHoverSec(null);
          setDragging(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.stopPropagation();
            e.preventDefault();
            onSeek(Math.max(0, current - 10));
          } else if (e.key === 'ArrowRight') {
            e.stopPropagation();
            e.preventDefault();
            onSeek(Math.min(duration, current + 10));
          }
        }}
      >
        <div className="relative h-4 w-full overflow-visible rounded-full bg-white/[.12]">
          {/* buffered */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/[.2] transition-[width] duration-200"
            style={{ width: `${bufPct}%` }}
          />
          {/* intro marker region (hatched purple) */}
          {marker && duration > 0 && (
            <div
              className="absolute inset-y-0 rounded-full opacity-70"
              style={{
                left: `${(marker.start / duration) * 100}%`,
                width: `${((marker.end - marker.start) / duration) * 100}%`,
                background:
                  'repeating-linear-gradient(135deg, rgba(139,124,232,.55) 0 4px, rgba(139,124,232,.15) 4px 8px)',
              }}
            />
          )}
          {/* played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-signature"
            style={{ width: `${pct}%` }}
          />
          {/* chapter tick at marker end */}
          {marker && duration > 0 && (
            <div
              className="absolute -inset-y-2 w-2 rounded-full bg-purple"
              style={{ left: `calc(${(marker.end / duration) * 100}% - 1px)` }}
            />
          )}
          {/* thumb */}
          <div
            className={cn(
              'absolute top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_10px_rgba(124,217,236,.8)] transition-transform duration-150',
              dragging ? 'scale-[1.4]' : 'group-hover:scale-[1.4]',
            )}
            style={{ left: `${pct}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ── next-up countdown card ────────────────────────────────────────────── */

function NextUpCard({
  video,
  art,
  secondsLeft,
  autoplay,
  onPlayNow,
  onDismiss,
}: {
  video: MetaVideo;
  art: string;
  secondsLeft: number;
  autoplay: boolean;
  onPlayNow: () => void;
  onDismiss: () => void;
}) {
  const { t } = useT();
  const R = 15;
  const C = 2 * Math.PI * R;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={spring.smooth}
      className="glass-3 absolute bottom-96 right-24 z-30 flex w-320 max-w-[calc(100vw-48px)] items-center gap-12 rounded-2xl p-16"
    >
      <img src={art} alt="" className="h-64 w-112 rounded-md object-cover ring-1 ring-white/[.1]" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="text-micro uppercase text-muted">{t('app.player.upNext')}</span>
        <span className="truncate text-caption font-semibold text-ink">
          E{video.episode} · {video.title}
        </span>
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={onPlayNow}
            className="focusable rounded-full bg-chrome px-12 py-6 text-micro font-bold uppercase text-deep hover:brightness-110 cursor-pointer"
          >
            {t('app.player.playNow')}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="focusable rounded-full px-12 py-6 text-micro font-semibold uppercase text-muted hover:text-ink cursor-pointer"
          >
            {t('app.player.dismiss')}
          </button>
        </div>
      </div>
      {/* countdown ring */}
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
          <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r={R}
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={autoplay ? C * (1 - secondsLeft / NEXT_UP_SECONDS) : 0}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] text-ink">
          {autoplay ? secondsLeft : <Play size={14} className="fill-current" />}
        </span>
      </div>
    </motion.div>
  );
}

/* ── unified error recovery panel ──────────────────────────────────────── */

export interface PlaybackError {
  cause: string;
  code: string;
  url: string;
  addonName: string;
}

function ErrorPanel({
  detail,
  isLastSource,
  onNext,
  onLower,
  onRetry,
  onBack,
}: {
  detail: PlaybackError;
  isLastSource: boolean;
  onNext: () => void;
  onLower: () => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-16"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={spring.smooth}
        role="alertdialog"
        aria-label={t('app.player.errorAria')}
        className="glass-3 relative w-full max-w-md rounded-2xl p-32"
      >
        {/* one-shot purple pulse ring */}
        <motion.span
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute left-1/2 top-48 h-64 w-64 -translate-x-1/2 rounded-full border-2 border-purple"
        />
        <div className="relative flex flex-col items-center gap-16 text-center">
          <span className="glass-2 flex h-64 w-64 items-center justify-center rounded-full">
            <AlertTriangle size={30} strokeWidth={1.75} className="text-purple" />
          </span>
          <h2 className="font-display text-title text-ink">{t('app.player.errorTitle')}</h2>
          <p className="text-caption text-muted">{detail.cause}</p>
          <div className="flex w-full flex-col gap-12">
            <ButtonPrimary onClick={onNext}>{t('app.player.tryNext')}</ButtonPrimary>
            <ButtonNeon onClick={onLower}>{t('app.player.lowerQuality')}</ButtonNeon>
            <ButtonGhost onClick={onRetry}>
              <RefreshCw size={14} strokeWidth={1.75} />
              {t('app.player.retry')}
            </ButtonGhost>
            {isLastSource && <ButtonGhost onClick={onBack}>{t('app.player.backToTitle')}</ButtonGhost>}
          </div>
          <details className="w-full text-left">
            <summary className="focusable cursor-pointer rounded text-micro uppercase text-muted hover:text-ink">
              {t('app.player.errorDetails')}
            </summary>
            <pre className="mt-8 max-h-144 overflow-auto rounded-md bg-black/40 p-12 font-mono text-[11px] leading-relaxed text-muted whitespace-pre-wrap break-all">
              {`${t('app.player.errorLabelError')}:  ${detail.code}\n${t('app.player.errorLabelAddon')}:  ${detail.addonName}\n${t('app.player.errorLabelSource')}: ${detail.url}`}
            </pre>
          </details>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── right-side sheet ──────────────────────────────────────────────────── */

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <>
      <div className="absolute inset-0 z-30" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={spring.smooth}
        className="glass-3 absolute right-0 top-0 z-30 flex h-full w-[360px] max-w-[90vw] flex-col overflow-y-auto p-24"
        role="dialog"
        aria-label={title}
      >
        <div className="mb-16 flex items-center justify-between">
          <h3 className="font-display text-title text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('app.player.closePanel')}
            className="focusable rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06] cursor-pointer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </motion.div>
    </>
  );
}

/* ── shortcuts overlay content ─────────────────────────────────────────── */

const SHORTCUTS: Array<[string, string]> = [
  ['Space / K', 'app.player.scPlayPause'],
  ['F', 'app.player.scFullscreen'],
  ['← / →', 'app.player.scSeek'],
  ['↑ / ↓', 'app.player.scVolume'],
  ['M', 'app.player.scMute'],
  ['C', 'app.player.scSubtitles'],
  ['?', 'app.player.scOverlay'],
  ['Esc', 'app.player.scBack'],
];

function ShortcutsTable() {
  const { t } = useT();
  const half = Math.ceil(SHORTCUTS.length / 2);
  const columns = [SHORTCUTS.slice(0, half), SHORTCUTS.slice(half)];
  return (
    <div className="grid grid-cols-1 gap-x-32 sm:grid-cols-2">
      {columns.map((col, ci) => (
        <table key={ci} className="w-full font-mono text-[12px]">
          <tbody>
            {col.map(([key, actionKey]) => (
              <tr key={key} className="border-b border-white/[.06] last:border-b-0">
                <td className="py-10 pr-16 text-cyan">{key}</td>
                <td className="py-10 text-muted">{t(actionKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

/* ── the player itself ─────────────────────────────────────────────────── */

type PanelKind = 'subs' | 'speed' | 'audio' | 'sources' | 'episodes' | 'external' | null;
type SubSize = 'S' | 'M' | 'L' | 'XL';
type SubColor = 'ink' | 'cyan' | 'yellow';
type SubBg = 'none' | 'scrim' | 'solid';
type SubWeight = 'normal' | 'semibold' | 'bold';

interface AudioTrackShim {
  id: string;
  label: string;
  language: string;
  enabled: boolean;
}

const SUB_SIZE_CLASS: Record<SubSize, string> = {
  S: 'text-[13px]',
  M: 'text-[16px]',
  L: 'text-[20px]',
  XL: 'text-[26px]',
};
const SUB_COLOR_CLASS: Record<SubColor, string> = {
  ink: 'text-ink',
  cyan: 'text-cyan',
  yellow: 'text-warn',
};
const SUB_WEIGHT_CLASS: Record<SubWeight, string> = {
  normal: 'font-normal',
  semibold: 'font-semibold',
  bold: 'font-bold',
};
const SUB_OUTLINE_STYLE =
  '0 1px 2px rgba(0,0,0,.9), 0 0 6px rgba(0,0,0,.75), 1px 0 2px rgba(0,0,0,.9), -1px 0 2px rgba(0,0,0,.9)';

const MEDIA_ERROR_NAMES: Record<number, string> = {
  1: 'MEDIA_ERR_ABORTED',
  2: 'MEDIA_ERR_NETWORK',
  3: 'MEDIA_ERR_DECODE',
  4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
};

function PlayerInner() {
  const { t } = useT();
  const { type = 'movie', id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  /* ── data ──────────────────────────────────────────────────────────── */
  const [resolved, setResolved] = useState<{ meta: MetaItem; video?: MetaVideo } | null | undefined>(
    undefined,
  );
  const [streams, setStreams] = useState<StreamSource[] | null>(null);
  const srcParam = Number.parseInt(searchParams.get('src') ?? '0', 10);
  const srcIdx = streams && streams.length > 0 ? Math.min(Math.max(0, srcParam || 0), streams.length - 1) : 0;
  const source = streams?.[srcIdx];

  const setProgress = useLibrary((s) => s.setProgress);
  const setMemory = usePlaybackMemory((s) => s.setMemory);
  const getMemory = usePlaybackMemory((s) => s.getMemory);
  const autoplayNext = useSettings((s) => s.settings.playback.autoplayNext);
  const subSettings = useSettings((s) => s.settings.subtitles);
  const patchSettings = useSettings((s) => s.patchSettings);
  /* ambient defaults true; older persisted settings predate the flag */
  const playbackSettings = useSettings((s) => s.settings.playback);
  const ambient = playbackSettings.ambient ?? true;

  useEffect(() => {
    let cancelled = false;
    setResolved(undefined);
    setStreams(null);
    (async () => {
      const mt = type as MetaType;
      const direct = await addonEngine.getMeta(mt, id);
      if (direct) {
        if (!cancelled) setResolved({ meta: direct });
        return;
      }
      if (mt === 'series') {
        const series = await addonEngine.getCatalog('series');
        for (const s of series) {
          const v = s.videos?.find((x) => x.id === id);
          if (v) {
            if (!cancelled) setResolved({ meta: s, video: v });
            return;
          }
        }
      }
      if (!cancelled) setResolved(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  useEffect(() => {
    if (!resolved) return;
    let cancelled = false;
    addonEngine.getStreams(type as MetaType, id).then((s) => {
      if (!cancelled) setStreams(s);
    });
    return () => {
      cancelled = true;
    };
  }, [resolved, type, id]);

  /* ── playback state ────────────────────────────────────────────────── */
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState<number>(() => {
    const raw = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.8;
  });
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flash, setFlash] = useState<{ kind: 'play' | 'pause'; key: number } | null>(null);
  const [panel, setPanel] = useState<PanelKind>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [pipSupported] = useState(
    () => typeof document !== 'undefined' && Boolean(document.pictureInPictureEnabled),
  );
  const [pipActive, setPipActive] = useState(false);
  /* chromecast — hidden entirely outside cast-capable environments */
  const [castEnv] = useState(() => isCastEnvironment());
  const [castActive, setCastActive] = useState(false);
  const [castBusy, setCastBusy] = useState(false);
  const castFrameworkRef = useRef<CastFramework | null>(null);
  const castCleanupRef = useRef<(() => void) | null>(null);
  const castMediaRef = useRef<CastMedia | null>(null);
  const [error, setError] = useState<PlaybackError | null>(null);
  const [autoRetryIn, setAutoRetryIn] = useState<number | null>(null);

  /* subtitles */
  const [subTrackId, setSubTrackId] = useState<string>('off');
  const [subCues, setSubCues] = useState<Cue[] | null>(null);
  const [subOffset, setSubOffset] = useState(0);
  const [subSize, setSubSize] = useState<SubSize>(() =>
    subSettings.size === 'small' ? 'S' : subSettings.size === 'large' ? 'L' : 'M',
  );
  const [subColor, setSubColor] = useState<SubColor>(() => subSettings.color ?? 'ink');
  const [subBg, setSubBg] = useState<SubBg>(() => subSettings.bg ?? 'scrim');
  const [subWeight, setSubWeight] = useState<SubWeight>(() => subSettings.weight ?? 'semibold');
  const [subOutline, setSubOutline] = useState<boolean>(() => subSettings.outline ?? true);
  const [subLoading, setSubLoading] = useState(false);
  const [uploadedSubs, setUploadedSubs] = useState<StreamSubtitle[]>([]);
  const [audioRev, setAudioRev] = useState(0);

  /* one-shot refs */
  const pendingSeekRef = useRef<number | null>(null);
  const resumeCheckedRef = useRef(false);
  const memoryAppliedRef = useRef(false);
  const retriedRef = useRef(false);
  const recoveredRef = useRef(false);
  const switchedRef = useRef(false);
  const currentTimeRef = useRef(0);
  const [audioTrackId, setAudioTrackId] = useState<string | undefined>(undefined);

  const isLive = Boolean(resolved?.meta.live) || source?.quality.toUpperCase() === 'LIVE' || duration === Infinity;

  /* reset one-shots per route id */
  useEffect(() => {
    resumeCheckedRef.current = false;
    memoryAppliedRef.current = false;
    retriedRef.current = false;
    recoveredRef.current = false;
    switchedRef.current = false;
    pendingSeekRef.current = null;
    setError(null);
    setAutoRetryIn(null);
    setSubCues(null);
    setSubTrackId('off');
    setSubOffset(0);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
  }, [id]);

  /* ── failure funnel (auto-retry once after 4s, then panel) ─────────── */
  const failRef = useRef<(code: string, cause: string) => void>(() => {});
  failRef.current = (code, cause) => {
    if (!source) return;
    if (!retriedRef.current) {
      retriedRef.current = true;
      setAutoRetryIn(AUTO_RETRY_SECONDS);
      return;
    }
    // fast failover: hop to the next source instead of parking on the panel.
    // switchSource preserves position and re-arms the panel on a further failure.
    if (streams && streams.length > 1) {
      switchSource((srcIdx + 1) % streams.length, 'next');
      return;
    }
    setError({ cause, code, url: source.url, addonName: source.addonName });
  };

  useEffect(() => {
    if (autoRetryIn === null) return;
    if (autoRetryIn <= 0) {
      setAutoRetryIn(null);
      const v = videoRef.current;
      if (v) {
        v.load();
        v.play().catch(() => {});
      }
      return;
    }
    const t = window.setTimeout(() => setAutoRetryIn((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [autoRetryIn]);

  /* ── attach source (hls.js for .m3u8, native otherwise) ────────────── */
  const sourceUrl = source?.url;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    setBuffering(true);
    let cancelled = false;
    if (sourceUrl.endsWith('.m3u8')) {
      // hls.js is heavy — code-split it out of the player route chunk.
      (async () => {
        const { default: HlsCtor } = await import('hls.js');
        if (cancelled || !videoRef.current) return;
        if (HlsCtor.isSupported()) {
          let hlsRecovered = false; // one in-place recovery per attached source
          const hls = new HlsCtor({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 60,
            maxMaxBufferLength: 300,
            maxBufferHole: 0.25,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 6,
            maxStarvationDelay: 2,
            startLevel: -1, // ABR auto — fastest safe start level
            startFragPrefetch: true, // next fragment is already on its way
            testBandwidth: true,
            abrMaxWithRealBitrate: true,
            capLevelToPlayerSize: true,
            abrEwmaFastLive: 3,
            abrEwmaSlowLive: 9,
            fragLoadingMaxRetry: 4,
            fragLoadingRetryDelay: 500,
            manifestLoadingMaxRetry: 2,
            manifestLoadingRetryDelay: 500,
            levelLoadingMaxRetry: 4,
          });
          hlsRef.current = hls;
          hls.loadSource(sourceUrl);
          hls.attachMedia(video);
          hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
            if (!data.fatal) return;
            // recover in place once — v.load() alone cannot restart hls.js
            if (!hlsRecovered && data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
              hlsRecovered = true;
              hls.startLoad();
              return;
            }
            if (!hlsRecovered && data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
              hlsRecovered = true;
              hls.recoverMediaError();
              return;
            }
            failRef.current(
              `hls:${data.type}/${data.details}`,
              t('app.player.causeStreamStopped'),
            );
          });
        } else {
          // Safari plays HLS natively.
          video.src = sourceUrl;
          video.load();
        }
      })();
    } else {
      video.src = sourceUrl;
      video.load();
    }
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [sourceUrl, t]);

  /* ── resume + progress persistence (5s / pause / unload, idempotent) ── */
  const saveProgress = useCallback(() => {
    const v = videoRef.current;
    if (!v || !resolved || resolved.meta.live) return;
    if (!Number.isFinite(v.duration) || v.duration <= 0) return;
    setProgress({
      id,
      type: resolved.meta.type,
      progressSec: v.currentTime,
      durationSec: v.duration,
    });
  }, [id, resolved, setProgress]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(saveProgress, 5000);
    return () => window.clearInterval(t);
  }, [playing, saveProgress]);

  useEffect(() => {
    window.addEventListener('beforeunload', saveProgress);
    window.addEventListener('pagehide', saveProgress);
    return () => {
      window.removeEventListener('beforeunload', saveProgress);
      window.removeEventListener('pagehide', saveProgress);
      saveProgress(); // unmount save
    };
  }, [saveProgress]);

  /* ── video element events ──────────────────────────────────────────── */
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setBuffering(false);
    setAudioRev((r) => r + 1);
    if (!memoryAppliedRef.current) {
      memoryAppliedRef.current = true;
      const mem = getMemory(id);
      if (mem) {
        v.playbackRate = mem.speed;
        setSpeed(mem.speed);
        setSubOffset(mem.subOffsetSec);
        if (mem.subTrack) setSubTrackId(mem.subTrack);
        if (mem.audioTrack) setAudioTrackId(mem.audioTrack);
      }
    }
    if (pendingSeekRef.current !== null) {
      const pending = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (Number.isFinite(v.duration) && v.duration > 0) {
        v.currentTime = Math.min(pending, Math.max(0, v.duration - 0.5));
      }
      if (switchedRef.current) {
        switchedRef.current = false;
        toast(t('app.player.toastSwitched', { time: fmtClock(pending) }));
      }
    } else if (!resumeCheckedRef.current) {
      resumeCheckedRef.current = true;
      const entry = useLibrary.getState().continueWatching.find((e) => e.id === id);
      if (
        entry &&
        Number.isFinite(v.duration) &&
        entry.progressSec > 5 &&
        entry.progressSec < v.duration * 0.95
      ) {
        v.currentTime = entry.progressSec;
        toast(t('app.player.toastResumed', { time: fmtClock(entry.progressSec) }));
      }
    }
    v.play().catch(() => {
      /* autoplay blocked — chrome stays visible, user presses play */
    });
  };

  const onVideoError = () => {
    if (hlsRef.current) return; // hls.js reports its own fatal errors
    const v = videoRef.current;
    const code = v?.error ? (MEDIA_ERROR_NAMES[v.error.code] ?? `MEDIA_ERR_${v.error.code}`) : 'UNKNOWN';
    failRef.current(code, t('app.player.causeStreamStopped'));
  };

  const seek = useCallback((sec: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    v.currentTime = Math.min(Math.max(0, sec), v.duration);
    currentTimeRef.current = v.currentTime;
    setCurrentTime(v.currentTime);
  }, []);

  /* ── progressive seeking (Stremio-style): repeated arrow presses accumulate
     into one debounced jump — 280ms of quiet commits the total. The preview
     pill shows the accumulated delta + the target timestamp meanwhile. ── */
  const seekAccumRef = useRef(0);
  const seekCommitTimer = useRef<number | undefined>(undefined);
  const [seekPreview, setSeekPreview] = useState<{ delta: number; target: number } | null>(null);

  const progressiveSeek = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
      seekAccumRef.current += delta;
      const target = Math.min(Math.max(0, v.currentTime + seekAccumRef.current), v.duration);
      setSeekPreview({ delta: seekAccumRef.current, target });
      window.clearTimeout(seekCommitTimer.current);
      seekCommitTimer.current = window.setTimeout(() => {
        const total = seekAccumRef.current;
        seekAccumRef.current = 0;
        setSeekPreview(null);
        if (total !== 0) {
          const cur = videoRef.current?.currentTime ?? 0;
          seek(cur + total);
        }
      }, 280);
    },
    [seek],
  );

  useEffect(
    () => () => {
      window.clearTimeout(seekCommitTimer.current);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || error) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [error]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      rootRef.current?.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  /* volume / speed application */
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.volume = volume;
      v.muted = muted;
    }
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume, muted]);

  const applySpeed = (s: number) => {
    const clamped = Math.min(2, Math.max(0.5, s));
    setSpeed(clamped);
    if (videoRef.current) videoRef.current.playbackRate = clamped;
    setMemory(id, { speed: clamped });
  };

  /* ── subtitles ─────────────────────────────────────────────────────── */
  /* Source-provided tracks plus the user's own uploaded .srt/.vtt files. */
  const allSubTracks = useMemo<StreamSubtitle[]>(
    () => [...(source?.subtitles ?? []), ...uploadedSubs],
    [source, uploadedSubs],
  );

  const selectSubTrack = (trackUrl: string) => {
    setSubTrackId(trackUrl);
    setMemory(id, { subTrack: trackUrl === 'off' ? undefined : trackUrl });
  };

  /* Upload a local subtitle file (user-owned, stays on-device). */
  const uploadSubtitle = (file: File) => {
    if (!/\.(srt|vtt)$/i.test(file.name)) {
      toast.error(t('app.player.toastSubFileType'));
      return;
    }
    const url = URL.createObjectURL(file);
    const track: StreamSubtitle = { lang: 'upload', url };
    setUploadedSubs((prev) => [...prev, { ...track, lang: `upload · ${file.name}` }]);
    selectSubTrack(url);
    toast(t('app.player.toastSubLoaded', { name: file.name }));
  };

  useEffect(() => {
    if (subTrackId === 'off') {
      setSubCues(null);
      return;
    }
    const track = allSubTracks.find((t) => t.url === subTrackId);
    if (!track) {
      setSubCues(null);
      return;
    }
    let cancelled = false;
    setSubLoading(true);
    fetch(track.url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setSubCues(parseVtt(text));
      })
      .catch(() => {
        if (!cancelled) {
          setSubCues(null);
          setSubTrackId('off');
          toast.error(t('app.player.toastSubFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subTrackId, allSubTracks, t]);

  const adjustSubOffset = (delta: number) => {
    setSubOffset((o) => {
      const next = Math.round((o + delta) * 100) / 100;
      setMemory(id, { subOffsetSec: next });
      return next;
    });
  };
  const resetSubOffset = () => {
    setSubOffset(0);
    setMemory(id, { subOffsetSec: 0 });
    toast(t('app.player.toastSyncReset'));
  };

  const cycleSubtitles = useCallback(() => {
    const first = allSubTracks[0];
    setSubTrackId((cur) => {
      const next = cur === 'off' && first ? first.url : 'off';
      setMemory(id, { subTrack: next === 'off' ? undefined : next });
      return next;
    });
  }, [allSubTracks, id, setMemory]);

  const applySubSize = (s: SubSize) => {
    setSubSize(s);
    patchSettings({
      subtitles: { ...subSettings, size: s === 'S' ? 'small' : s === 'M' ? 'normal' : 'large' },
    });
  };
  const applySubColor = (c: SubColor) => {
    setSubColor(c);
    patchSettings({ subtitles: { ...subSettings, color: c } });
  };
  const applySubBg = (b: SubBg) => {
    setSubBg(b);
    patchSettings({ subtitles: { ...subSettings, bg: b } });
  };
  const applySubWeight = (w: SubWeight) => {
    setSubWeight(w);
    patchSettings({ subtitles: { ...subSettings, weight: w } });
  };
  const applySubOutline = (on: boolean) => {
    setSubOutline(on);
    patchSettings({ subtitles: { ...subSettings, outline: on } });
  };

  const activeCue =
    subCues?.find((c) => currentTime >= c.start + subOffset && currentTime < c.end + subOffset) ?? null;

  /* ── audio tracks ──────────────────────────────────────────────────── */
  const audioTracks = useMemo<AudioTrackShim[]>(() => {
    const v = videoRef.current as (HTMLVideoElement & { audioTracks?: ArrayLike<AudioTrackShim> }) | null;
    const list = v?.audioTracks;
    if (!list || list.length === 0) return [];
    return Array.from({ length: list.length }, (_, i) => list[i]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRev, panel]);

  const selectAudioTrack = (track: AudioTrackShim) => {
    const v = videoRef.current as (HTMLVideoElement & { audioTracks?: ArrayLike<AudioTrackShim> }) | null;
    const list = v?.audioTracks;
    if (!list) return;
    for (let i = 0; i < list.length; i++) list[i].enabled = list[i].id === track.id;
    setAudioTrackId(track.id);
    setMemory(id, { audioTrack: track.id });
    setAudioRev((r) => r + 1);
  };

  /* ── sources ───────────────────────────────────────────────────────── */
  const sourceGroups = useMemo(() => {
    const map = new Map<string, Array<{ s: StreamSource; i: number }>>();
    (streams ?? []).forEach((s, i) => {
      const arr = map.get(s.addonId) ?? [];
      arr.push({ s, i });
      map.set(s.addonId, arr);
    });
    return [...map.values()].map((rows) => ({ addonName: rows[0].s.addonName, addonId: rows[0].s.addonId, rows }));
  }, [streams]);

  const switchSource = useCallback(
    (idx: number, reason: 'next' | 'lower' | 'manual') => {
      if (!streams || idx === srcIdx || idx < 0 || idx >= streams.length) return;
      pendingSeekRef.current = currentTimeRef.current;
      switchedRef.current = reason === 'manual';
      recoveredRef.current = reason !== 'manual';
      retriedRef.current = false;
      setError(null);
      setPanel(null);
      setSearchParams({ src: String(idx) }, { replace: true });
    },
    [streams, srcIdx, setSearchParams],
  );

  const tryNextSource = () => {
    if (!streams || streams.length <= 1) {
      // nothing else to try — plain retry
      setError(null);
      const v = videoRef.current;
      v?.load();
      v?.play().catch(() => {});
      return;
    }
    switchSource((srcIdx + 1) % streams.length, 'next');
  };

  const lowerQuality = () => {
    if (!streams || streams.length <= 1) return;
    let best = -1;
    let bestRank = Infinity;
    streams.forEach((s, i) => {
      if (i === srcIdx) return;
      const r = qualityRank(s.quality);
      if (r < bestRank) {
        bestRank = r;
        best = i;
      }
    });
    if (best >= 0) switchSource(best, 'lower');
  };

  const retryCurrent = () => {
    setError(null);
    retriedRef.current = true; // a further failure re-opens the panel
    const v = videoRef.current;
    v?.load();
    v?.play().catch(() => {});
  };

  const reloadStreams = () => {
    setStreams(null);
    addonEngine.getStreams(type as MetaType, id).then(setStreams);
  };

  /* ── chrome auto-hide (3s idle) ────────────────────────────────────── */
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeVisibleRef = useRef(true);
  chromeVisibleRef.current = chromeVisible;
  const idleTimer = useRef<number>(0);
  const poke = useCallback(() => {
    setChromeVisible(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setChromeVisible(false), 3000);
  }, []);
  useEffect(() => {
    poke();
    return () => window.clearTimeout(idleTimer.current);
  }, [poke]);
  useEffect(() => {
    const keep = !playing || panel !== null || error !== null || shortcutsOpen;
    if (keep) {
      setChromeVisible(true);
      window.clearTimeout(idleTimer.current);
    } else {
      poke();
    }
  }, [playing, panel, error, shortcutsOpen, poke]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(t);
  }, [flash]);

  /* ── next-up (series) ──────────────────────────────────────────────── */
  const nextVideo = useMemo(() => {
    if (!resolved?.video || !resolved.meta.videos) return undefined;
    const idx = resolved.meta.videos.findIndex((v) => v.id === resolved.video?.id);
    return idx >= 0 ? resolved.meta.videos[idx + 1] : undefined;
  }, [resolved]);

  const [nextUpIn, setNextUpIn] = useState<number | null>(null);
  const [nextUpDismissed, setNextUpDismissed] = useState(false); // session-scoped
  const progressRatio = duration > 0 && Number.isFinite(duration) ? currentTime / duration : 0;

  useEffect(() => {
    if (!nextVideo || nextUpDismissed || isLive || nextUpIn !== null) return;
    if (progressRatio >= 0.9) setNextUpIn(NEXT_UP_SECONDS);
  }, [progressRatio, nextVideo, nextUpDismissed, isLive, nextUpIn]);

  const advanceNext = useCallback(() => {
    if (!nextVideo) return;
    setNextUpIn(null);
    saveProgress();
    navigate(`/app/player/series/${nextVideo.id}`);
  }, [nextVideo, navigate, saveProgress]);

  useEffect(() => {
    if (nextUpIn === null || !autoplayNext) return;
    if (nextUpIn <= 0) {
      advanceNext();
      return;
    }
    const t = window.setTimeout(() => setNextUpIn((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [nextUpIn, autoplayNext, advanceNext]);

  const nextArt = nextVideo
    ? `/art/backdrop-caminandes-${nextVideo.episode ?? 1}.jpg`
    : undefined;

  /* ── picture-in-picture ────────────────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !pipSupported) return;
    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    v.addEventListener('enterpictureinpicture', onEnter);
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      v.removeEventListener('enterpictureinpicture', onEnter);
      v.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [pipSupported]);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {
      toast.error(t('app.player.toastPipBlocked'));
    }
  }, [t]);

  /* ── chromecast ────────────────────────────────────────────────────── */
  useEffect(() => {
    /* release the cast-state listener when the player unmounts; the
       session itself is left to the browser's cast dialog on purpose */
    return () => {
      castCleanupRef.current?.();
      castCleanupRef.current = null;
    };
  }, []);

  const toggleCast = useCallback(async () => {
    if (castBusy) return;
    setCastBusy(true);
    try {
      const framework = castFrameworkRef.current ?? (await ensureCastFramework());
      castFrameworkRef.current = framework;
      if (!castCleanupRef.current) {
        castCleanupRef.current = onCastStateChange(framework, (state) => {
          const connected = state === 'CONNECTED';
          setCastActive(connected);
          if (connected) videoRef.current?.pause(); // the TV takes over
        });
      }
      if (castActive) {
        stopCasting(framework);
        toast(t('app.player.toastCastStopped'));
        return;
      }
      const media = castMediaRef.current;
      if (!media) return;
      const deviceName = await startCasting(framework, media);
      toast(t('app.player.toastCastingTo', { device: deviceName }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      /* user dismissing the device picker rejects — that's not an error */
      if (!/cancel/i.test(message)) {
        toast.error(message ? t('app.player.toastCastFailedReason', { message }) : t('app.player.toastCastFailed'));
      }
    } finally {
      setCastBusy(false);
    }
  }, [castBusy, castActive, t]);

  /* ── keyboard map ──────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      /* ? toggles the shortcuts overlay — works whether it's open or closed */
      if (e.key === '?') {
        if (document.querySelector('[data-modal-open]') && !shortcutsOpen) return;
        setShortcutsOpen((v) => !v);
        return;
      }
      if (document.querySelector('[data-modal-open]')) return;
      if (
        (e.key === ' ' || e.key === 'Enter') &&
        target &&
        (target.tagName === 'BUTTON' || target.tagName === 'A')
      ) {
        return; // let focused controls activate natively
      }
      const tv = document.documentElement.classList.contains('tv-mode');
      const v = videoRef.current;
      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          poke();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          setMuted((m) => !m);
          poke();
          break;
        case 'c':
        case 'C':
          cycleSubtitles();
          poke();
          break;
        case 'Escape':
          if (tv) return; // tvnav owns back navigation in TV mode
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          else if (panel) setPanel(null);
          else navigate(-1);
          break;
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (tv || !v || !Number.isFinite(v.duration)) break;
          e.preventDefault();
          const delta = (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 60 : 10);
          progressiveSeek(delta);
          poke();
          break;
        }
        case 'ArrowUp':
        case 'ArrowDown': {
          if (tv) break;
          e.preventDefault();
          setVolume((vol) => Math.min(1, Math.max(0, vol + (e.key === 'ArrowUp' ? 0.1 : -0.1))));
          setMuted(false);
          poke();
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, progressiveSeek, toggleFullscreen, navigate, panel, poke, cycleSubtitles, shortcutsOpen]);

  /* ── touch: double-tap ±10s, tap toggles chrome ────────────────────── */
  const lastTapRef = useRef<{ t: number; x: number } | null>(null);
  const tapTimerRef = useRef<number>(0);
  const recentTouchRef = useRef(0);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; label: string }>>([]);

  const onStageTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    recentTouchRef.current = Date.now();
    const touch = e.changedTouches[0];
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || !touch) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && now - last.t < 320 && Math.abs(last.x - x) < 80) {
      window.clearTimeout(tapTimerRef.current);
      lastTapRef.current = null;
      const left = x < rect.width / 2;
      seek((videoRef.current?.currentTime ?? 0) + (left ? -10 : 10));
      const ripple = { id: now, x, y, label: left ? '−10s' : '+10s' };
      setRipples((r) => [...r, ripple]);
      window.setTimeout(() => setRipples((r) => r.filter((x2) => x2.id !== ripple.id)), 650);
      poke();
    } else {
      lastTapRef.current = { t: now, x };
      tapTimerRef.current = window.setTimeout(() => {
        if (chromeVisibleRef.current) {
          window.clearTimeout(idleTimer.current);
          setChromeVisible(false);
        } else {
          poke();
        }
      }, 300);
    }
  };

  const onStageClick = () => {
    if (Date.now() - recentTouchRef.current < 500) return; // touch already handled
    togglePlay();
  };

  const cast = () => {
    const v = videoRef.current as (HTMLVideoElement & { remote?: { prompt(): Promise<void> } }) | null;
    if (v?.remote) {
      v.remote.prompt().catch(() => {
        toast.error(t('app.player.toastCastUnavailable'));
      });
    } else {
      toast.error(t('app.player.toastCastUnavailable'));
    }
  };

  /* ── render ────────────────────────────────────────────────────────── */
  if (resolved === undefined) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-deep">
        <Loader2 size={32} className="animate-spin text-cyan" />
      </div>
    );
  }

  if (resolved === null) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-16 bg-deep p-16 text-center">
        <h1 className="font-display text-display-l text-ink">{t('app.detail.notFoundTitle')}</h1>
        <p className="max-w-[46ch] text-caption text-muted">
          {t('app.player.unresolvable')}
        </p>
        <div className="flex gap-12">
          <ButtonPrimary onClick={() => navigate(-1)}>{t('app.player.goBack')}</ButtonPrimary>
          <ButtonGhost to="/app/discover">{t('app.detail.backToDiscover')}</ButtonGhost>
        </div>
      </div>
    );
  }

  const { meta, video } = resolved;
  const marker = INTRO_MARKERS[id];
  const inIntro = marker !== undefined && currentTime >= marker.start && currentTime < marker.end;
  const episodeLabel = video
    ? `S${String(video.season ?? 1).padStart(2, '0')} E${String(video.episode ?? 1).padStart(2, '0')} · ${video.title}`
    : undefined;

  /* what the receiver should play if the user hits cast right now */
  castMediaRef.current = source
    ? {
        url: source.url,
        title: meta.name,
        subtitle: episodeLabel ?? (meta.year ? String(meta.year) : undefined),
        poster: meta.backdrop ?? meta.poster,
        currentTime,
        live: isLive,
      }
    : null;

  /* title handed to external players (Android intents display it) */
  const externalTitle = episodeLabel ? `${meta.name} · ${episodeLabel}` : meta.name;

  const chromeAnim = reduceMotion
    ? { opacity: chromeVisible ? 1 : 0 }
    : { opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : 8 };

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed inset-0 z-[60] select-none overflow-hidden bg-deep',
        !chromeVisible && playing && 'cursor-none',
      )}
      onPointerMove={poke}
      onPointerDown={poke}
    >
      {/* ambient mode: blurred title art + lunar halo behind the frame */}
      <AnimatePresence>
        {ambient && (
          <motion.div
            key="ambient-halo"
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={meta.backdrop ?? meta.poster}
              alt=""
              className="h-full w-full scale-125 object-cover opacity-20 blur-[90px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(900px 460px at 50% 62%, rgba(124,217,236,.08), transparent 70%)',
              }}
            />
            {/* soft lunar halo (ambient mode) */}
            <div
              className="absolute inset-0 blur-[40px]"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(196,211,245,.14), transparent 65%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* stage */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0"
        onClick={onStageClick}
        onTouchEnd={onStageTouchEnd}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          playsInline
          preload="auto"
          poster={meta.backdrop ?? meta.poster}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            currentTimeRef.current = t;
            // timeupdate fires ~4x/s; 0.5s quantization halves full-tree
            // re-renders with no visible seek/subtitle difference
            setCurrentTime((prev) => (Math.abs(t - prev) >= 0.5 ? t : prev));
          }}
          onProgress={(e) => {
            const v = e.currentTarget;
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onPlay={() => {
            setPlaying(true);
            setFlash({ kind: 'play', key: Date.now() });
          }}
          onPause={() => {
            setPlaying(false);
            setFlash({ kind: 'pause', key: Date.now() });
            saveProgress();
          }}
          onPlaying={() => {
            setBuffering(false);
            if (recoveredRef.current) {
              recoveredRef.current = false;
              toast(t('app.player.toastRecovered'));
            }
          }}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onError={onVideoError}
          onEnded={() => {
            saveProgress();
            if (nextVideo && autoplayNext && !nextUpDismissed) advanceNext();
          }}
        />
      </motion.div>

      {/* subtitle overlay */}
      {activeCue && subTrackId !== 'off' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-128 z-20 flex justify-center px-24">
          <span
            className={cn(
              'max-w-[70ch] text-center font-sans leading-snug whitespace-pre-line',
              SUB_SIZE_CLASS[subSize],
              SUB_COLOR_CLASS[subColor],
              SUB_WEIGHT_CLASS[subWeight],
              subBg === 'scrim' && 'rounded-md bg-black/50 px-12 py-4',
              subBg === 'solid' && 'rounded-md bg-black/90 px-12 py-4',
            )}
            style={subOutline ? { textShadow: SUB_OUTLINE_STYLE } : undefined}
          >
            {activeCue.text}
          </span>
        </div>
      )}

      {/* center feedback */}
      {buffering && !error && <BufferingRing />}
      <AnimatePresence>
        {flash && !reduceMotion && <CenterFlash key={flash.key} kind={flash.kind} />}
      </AnimatePresence>

      {/* progressive-seek preview pill (accumulated delta → target time) */}
      <AnimatePresence>
        {seekPreview && (
          <motion.div
            key="seek-preview"
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute left-1/2 top-[18%] z-30 -translate-x-1/2 rounded-full bg-deep/80 px-16 py-8 font-mono text-[13px] text-cyan ring-1 ring-cyan/40 backdrop-blur-sm"
          >
            {seekPreview.delta > 0 ? '+' : '−'}
            {Math.abs(seekPreview.delta)}s{' '}
            <ArrowRight size={12} strokeWidth={1.75} className="inline text-muted" aria-hidden />{' '}
            {fmtClock(seekPreview.target)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* double-tap ripples */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0.9, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="glass-3 pointer-events-none absolute z-20 flex h-72 w-72 items-center justify-center rounded-full font-mono text-[13px] text-cyan"
          style={{ left: r.x - 36, top: r.y - 36 }}
        >
          {r.label}
        </motion.span>
      ))}

      {/* auto-retry countdown chip */}
      {autoRetryIn !== null && (
        <div className="glass-2 absolute left-1/2 top-24 z-30 flex -translate-x-1/2 items-center gap-8 rounded-full px-16 py-8">
          <Loader2 size={14} className="animate-spin text-cyan" />
          <span className="font-mono text-[12px] text-muted">
            {t('app.player.retryingIn', { s: autoRetryIn })}
          </span>
        </div>
      )}

      {/* skip intro */}
      <AnimatePresence>
        {inIntro && !error && (
          <motion.button
            key="skip-intro"
            type="button"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            transition={spring.snappy}
            onClick={() => marker && seek(marker.end)}
            className="focusable glass-3 absolute bottom-128 right-24 z-30 flex items-center gap-8 rounded-full px-20 py-12 text-caption font-semibold text-ink hover:shadow-glow-neon cursor-pointer"
          >
            <SkipForward size={16} strokeWidth={1.75} className="text-cyan" />
            {t('app.player.skipIntro')}
          </motion.button>
        )}
      </AnimatePresence>

      {/* next-up countdown */}
      <AnimatePresence>
        {nextVideo && nextUpIn !== null && nextArt && (
          <NextUpCard
            key="next-up"
            video={nextVideo}
            art={nextArt}
            secondsLeft={nextUpIn}
            autoplay={autoplayNext}
            onPlayNow={advanceNext}
            onDismiss={() => {
              setNextUpDismissed(true);
              setNextUpIn(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* top bar */}
      <motion.div
        animate={chromeAnim}
        transition={{ duration: 0.3 }}
        className={cn(
          'absolute inset-x-0 top-0 z-30 flex items-center gap-12 bg-gradient-to-b from-deep/85 to-transparent px-16 md:px-24 pb-32 pt-16',
          !chromeVisible && 'pointer-events-none',
        )}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('app.player.back')}
          className="focusable glass-2 flex h-40 w-40 items-center justify-center rounded-full text-ink hover:text-cyan cursor-pointer"
        >
          <ChevronLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-title text-ink">{meta.name}</span>
          <span className="truncate text-caption text-muted">
            {episodeLabel ?? [source?.quality, source?.addonName].filter(Boolean).join(' · ')}
          </span>
        </div>
        {meta.type === 'series' && meta.videos && meta.videos.length > 0 && (
          <button
            type="button"
            onClick={() => setPanel(panel === 'episodes' ? null : 'episodes')}
            aria-label={t('app.detail.episodes')}
            className="focusable glass-2 flex h-40 w-40 items-center justify-center rounded-full text-ink hover:text-cyan cursor-pointer"
          >
            <ListVideo size={18} strokeWidth={1.75} />
          </button>
        )}
        <button
          type="button"
          onClick={cast}
          aria-label={t('app.player.cast')}
          className="focusable glass-2 flex h-40 w-40 items-center justify-center rounded-full text-ink hover:text-cyan cursor-pointer"
        >
          <Cast size={18} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setShortcutsOpen((v) => !v)}
          aria-label={t('app.player.shortcutsAria')}
          aria-pressed={shortcutsOpen}
          className="focusable glass-2 flex h-40 w-40 items-center justify-center rounded-full text-ink hover:text-cyan cursor-pointer"
        >
          <CircleHelp size={18} strokeWidth={1.75} />
        </button>
      </motion.div>

      {/* bottom deck */}
      <motion.div
        animate={chromeAnim}
        transition={{ duration: 0.3 }}
        className={cn(
          'absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-deep/90 to-transparent px-16 md:px-24 pb-16 pt-32',
          !chromeVisible && 'pointer-events-none',
        )}
      >
        <div className="mx-auto max-w-4xl">
          {isLive ? (
            <div className="mb-8 flex items-center gap-8">
              <Badge kind="LIVE" />
              <span className="font-mono text-[12px] text-muted">{t('app.player.broadcastingNow')}</span>
            </div>
          ) : (
            <SeekBar
              current={currentTime}
              duration={duration}
              buffered={buffered}
              marker={marker}
              onSeek={seek}
            />
          )}
          <div className="glass-3 mt-8 flex items-center gap-8 rounded-[20px] px-16 md:px-24 py-12">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? t('app.player.pause') : t('app.player.play')}
              className="focusable flex h-40 w-40 items-center justify-center rounded-full text-ink transition-transform hover:scale-110 hover:text-cyan active:scale-90 cursor-pointer"
            >
              {playing ? (
                <Pause size={24} strokeWidth={1.75} className="fill-current" />
              ) : (
                <Play size={24} strokeWidth={1.75} className="fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => seek(currentTime - 10)}
              aria-label={t('app.player.back10')}
              disabled={isLive}
              className="focusable flex h-40 w-40 items-center justify-center rounded-full text-muted transition-transform hover:scale-110 hover:text-cyan active:scale-90 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw size={20} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => seek(currentTime + 10)}
              aria-label={t('app.player.forward10')}
              disabled={isLive}
              className="focusable flex h-40 w-40 items-center justify-center rounded-full text-muted transition-transform hover:scale-110 hover:text-cyan active:scale-90 cursor-pointer disabled:opacity-40"
            >
              <RotateCw size={20} strokeWidth={1.75} />
            </button>
            {/* volume */}
            <div className="group flex items-center">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? t('app.player.unmute') : t('app.player.mute')}
                className="focusable flex h-40 w-40 items-center justify-center rounded-full text-muted hover:text-cyan cursor-pointer"
              >
                {muted || volume === 0 ? (
                  <VolumeX size={20} strokeWidth={1.75} />
                ) : (
                  <Volume2 size={20} strokeWidth={1.75} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(false);
                }}
                aria-label={t('app.player.volume')}
                className="w-0 cursor-pointer accent-[#7CD9EC] opacity-0 transition-all duration-200 group-hover:w-80 group-hover:opacity-100 group-focus-within:w-80 group-focus-within:opacity-100"
              />
            </div>
            <span className="hidden font-mono text-[12px] text-muted sm:block">
              {isLive ? 'LIVE' : `${fmtClock(currentTime)} / ${fmtClock(duration)}`}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setPanel(panel === 'subs' ? null : 'subs')}
              aria-label={t('app.player.subtitles')}
              aria-pressed={subTrackId !== 'off'}
              className={cn(
                'focusable relative flex h-40 w-40 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer',
                subTrackId !== 'off' ? 'text-cyan' : 'text-muted hover:text-cyan',
              )}
            >
              <ClosedCaption size={20} strokeWidth={1.75} />
              {subTrackId !== 'off' && (
                <span className="absolute bottom-6 h-4 w-4 rounded-full bg-cyan" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === 'speed' ? null : 'speed')}
              aria-label={t('app.player.speedAria')}
              className="focusable flex h-40 items-center gap-6 rounded-full px-8 font-mono text-[12px] text-muted hover:text-cyan cursor-pointer"
            >
              <Gauge size={18} strokeWidth={1.75} />
              {speed}×
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === 'audio' ? null : 'audio')}
              aria-label={t('app.player.audioAria')}
              className="focusable hidden h-40 w-40 items-center justify-center rounded-full text-muted hover:text-cyan sm:flex cursor-pointer"
            >
              <AudioLines size={20} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === 'sources' ? null : 'sources')}
              aria-label={t('app.player.qualityAria')}
              className="focusable flex h-40 items-center gap-6 rounded-full px-8 font-mono text-[12px] text-muted hover:text-cyan cursor-pointer"
            >
              {source?.quality ?? '—'}
              <ChevronLeft size={14} strokeWidth={1.75} className="-rotate-90" />
            </button>
            {pipSupported && (
              <button
                type="button"
                onClick={() => void togglePiP()}
                aria-label={pipActive ? t('app.player.pipExit') : t('app.player.pipEnter')}
                aria-pressed={pipActive}
                className={cn(
                  'focusable flex h-40 w-40 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer',
                  pipActive ? 'text-cyan' : 'text-muted hover:text-cyan',
                )}
              >
                <PictureInPicture2 size={20} strokeWidth={1.75} />
              </button>
            )}
            {castEnv && (
              <button
                type="button"
                onClick={() => void toggleCast()}
                disabled={castBusy}
                aria-label={castActive ? t('app.player.castStop') : t('app.player.castToTv')}
                aria-pressed={castActive}
                title={castActive ? t('app.player.castStop') : t('app.player.castToTv')}
                className={cn(
                  'focusable flex h-40 w-40 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-50',
                  castActive ? 'text-cyan' : 'text-muted hover:text-cyan',
                )}
              >
                {castBusy ? (
                  <Loader2 size={20} strokeWidth={1.75} className="animate-spin" />
                ) : (
                  <Cast size={20} strokeWidth={1.75} />
                )}
              </button>
            )}
            {source && (
              <button
                type="button"
                onClick={() => setPanel(panel === 'external' ? null : 'external')}
                aria-label={t('app.player.externalOpen')}
                aria-pressed={panel === 'external'}
                title={t('app.player.externalOpen')}
                className={cn(
                  'focusable flex h-44 w-44 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer',
                  panel === 'external' ? 'text-cyan' : 'text-muted hover:text-cyan',
                )}
              >
                <SquareArrowOutUpRight size={20} strokeWidth={1.75} />
              </button>
            )}
            <button
              type="button"
              onClick={() => patchSettings({ playback: { ...playbackSettings, ambient: !ambient } })}
              aria-label={t('app.player.ambient')}
              aria-pressed={ambient}
              title={t('app.player.ambient')}
              className={cn(
                'focusable flex h-40 w-40 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer',
                ambient ? 'text-cyan' : 'text-muted hover:text-cyan',
              )}
            >
              <Sparkles size={20} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? t('app.player.fullscreenExit') : t('app.player.fullscreen')}
              className="focusable flex h-40 w-40 items-center justify-center rounded-full text-muted transition-transform hover:scale-110 hover:text-cyan active:scale-90 cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize size={20} strokeWidth={1.75} />
              ) : (
                <Maximize size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* right sheets */}
      <AnimatePresence>
        {panel === 'subs' && (
          <Sheet key="subs" title={t('app.player.subtitles')} onClose={() => setPanel(null)}>
            <ul className="flex flex-col gap-8">
              <li>
                <button
                  type="button"
                  onClick={() => selectSubTrack('off')}
                  className={cn(
                    'focusable flex w-full items-center justify-between rounded-lg px-12 py-10 text-left text-caption cursor-pointer',
                    subTrackId === 'off' ? 'bg-white/[.08] text-ink' : 'text-muted hover:bg-white/[.05]',
                  )}
                >
                  {t('app.player.subsOff')}
                  {subTrackId === 'off' && <Check size={16} strokeWidth={1.75} className="text-cyan" />}
                </button>
              </li>
              {allSubTracks.map((t) => (
                <li key={t.url}>
                  <button
                    type="button"
                    onClick={() => selectSubTrack(t.url)}
                    className={cn(
                      'focusable flex w-full items-center justify-between rounded-lg px-12 py-10 text-left text-caption cursor-pointer',
                      subTrackId === t.url ? 'bg-white/[.08] text-ink' : 'text-muted hover:bg-white/[.05]',
                    )}
                  >
                    <span>
                      <span className="mr-8 font-mono text-[11px] uppercase text-cyan">{t.lang}</span>
                      WebVTT
                    </span>
                    {subTrackId === t.url && <Check size={16} strokeWidth={1.75} className="text-cyan" />}
                  </button>
                </li>
              ))}
            </ul>
            {allSubTracks.length === 0 && (
              <p className="mt-8 text-caption text-muted">{t('app.player.noSubTracks')}</p>
            )}
            {subLoading && <p className="mt-8 font-mono text-[11px] text-muted">{t('app.player.loadingTrack')}</p>}

            <h4 className="mb-8 mt-16 text-micro uppercase text-muted">{t('app.player.ownFile')}</h4>
            <label
              className="focusable glass-1 flex cursor-pointer items-center justify-center gap-8 rounded-lg px-12 py-10 text-caption text-ink hover:text-cyan"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.click();
                }
              }}
            >
              <Upload size={14} strokeWidth={1.75} />
              {t('app.player.loadSubFile')}
              <input
                type="file"
                accept=".srt,.vtt,text/vtt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadSubtitle(f);
                  e.target.value = '';
                }}
              />
            </label>

            <h4 className="mb-8 mt-24 text-micro uppercase text-muted">{t('app.player.style')}</h4>
            <div
              className={cn(
                'mb-16 rounded-lg bg-black/40 p-16 text-center',
                SUB_SIZE_CLASS[subSize],
                SUB_COLOR_CLASS[subColor],
                SUB_WEIGHT_CLASS[subWeight],
                subBg === 'scrim' && 'bg-black/50',
                subBg === 'solid' && 'bg-black/90',
              )}
              style={subOutline ? { textShadow: SUB_OUTLINE_STYLE } : undefined}
            >
              {t('app.player.stylePreview')}
            </div>
            <div className="mb-12 flex items-center gap-8">
              {(['S', 'M', 'L', 'XL'] as SubSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applySubSize(s)}
                  aria-pressed={subSize === s}
                  className={cn(
                    'focusable flex-1 rounded-full py-8 font-mono text-[12px] cursor-pointer',
                    subSize === s ? 'bg-chrome text-deep font-bold' : 'glass-1 text-muted hover:text-ink',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mb-12 flex items-center gap-8">
              {(['ink', 'cyan', 'yellow'] as SubColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => applySubColor(c)}
                  aria-pressed={subColor === c}
                  aria-label={t('app.player.colorAria', { color: t(`app.player.color_${c}`) })}
                  className={cn(
                    'focusable h-28 w-28 rounded-full ring-2 cursor-pointer',
                    subColor === c ? 'ring-cyan' : 'ring-white/[.15]',
                    c === 'ink' ? 'bg-[#F4F2FF]' : c === 'cyan' ? 'bg-[#7CD9EC]' : 'bg-[#FFE066]',
                  )}
                />
              ))}
              <div className="ml-auto flex gap-6">
                {(['none', 'scrim', 'solid'] as SubBg[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => applySubBg(b)}
                    aria-pressed={subBg === b}
                    className={cn(
                      'focusable rounded-full px-10 py-6 text-micro uppercase cursor-pointer',
                      subBg === b ? 'bg-white/[.12] text-ink' : 'text-muted hover:text-ink',
                    )}
                  >
                    {t(`app.player.bg_${b}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-12 flex items-center gap-8">
              <span className="text-micro uppercase text-muted">{t('app.player.weight')}</span>
              {(['normal', 'semibold', 'bold'] as SubWeight[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => applySubWeight(w)}
                  aria-pressed={subWeight === w}
                  className={cn(
                    'focusable flex-1 rounded-full py-6 text-micro uppercase cursor-pointer',
                    subWeight === w ? 'bg-white/[.12] text-ink' : 'glass-1 text-muted hover:text-ink',
                  )}
                >
                  {t(w === 'semibold' ? 'app.player.weightSemi' : `app.player.weight_${w}`)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => applySubOutline(!subOutline)}
                aria-pressed={subOutline}
                className={cn(
                  'focusable rounded-full px-10 py-6 text-micro uppercase cursor-pointer',
                  subOutline ? 'bg-white/[.12] text-ink' : 'glass-1 text-muted hover:text-ink',
                )}
              >
                {t('app.player.outline')}
              </button>
            </div>
            <div className="flex flex-col gap-10">
              <div className="flex items-center justify-between">
                <span className="text-caption text-muted">{t('app.player.syncOffset')}</span>
                <span className="font-mono text-[12px] text-cyan">
                  {subOffset >= 0 ? '+' : ''}
                  {subOffset.toFixed(2)}s
                </span>
              </div>
              <div className="flex items-center gap-8">
                {[-1, -0.25, 0.25, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => adjustSubOffset(d)}
                    aria-label={t(d > 0 ? 'app.player.offsetPlus' : 'app.player.offsetMinus', { s: Math.abs(d) })}
                    className="focusable glass-1 flex-1 rounded-full px-8 py-6 font-mono text-[12px] text-ink cursor-pointer"
                  >
                    {d > 0 ? `+${d}` : `−${Math.abs(d)}`}s
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetSubOffset}
                disabled={subOffset === 0}
                className="focusable glass-1 rounded-full px-12 py-6 text-micro uppercase text-muted hover:text-ink cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {t('app.player.resetSync')}
              </button>
            </div>
            <p className="mt-16 text-micro uppercase text-muted/70">
              {t('app.player.subsNormalized')}
            </p>
          </Sheet>
        )}

        {panel === 'speed' && (
          <Sheet key="speed" title={t('app.player.speedAria')} onClose={() => setPanel(null)}>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.25}
              value={speed}
              onChange={(e) => applySpeed(Number(e.target.value))}
              aria-label={t('app.player.speedAria')}
              className="w-full cursor-pointer accent-[#7CD9EC]"
            />
            <div className="mt-8 flex justify-between font-mono text-[11px] text-muted">
              <span>0.5×</span>
              <span className="text-cyan">{speed}×</span>
              <span>2×</span>
            </div>
            <div className="mt-16 flex gap-8">
              {SPEED_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => applySpeed(p)}
                  aria-pressed={speed === p}
                  className={cn(
                    'focusable flex-1 rounded-full py-10 font-mono text-[12px] cursor-pointer',
                    speed === p ? 'bg-chrome font-bold text-deep' : 'glass-1 text-muted hover:text-ink',
                  )}
                >
                  {p}×
                </button>
              ))}
            </div>
            <p className="mt-24 text-micro uppercase text-muted/70">{t('app.player.speedRemembered')}</p>
          </Sheet>
        )}

        {panel === 'audio' && (
          <Sheet key="audio" title={t('app.player.audioAria')} onClose={() => setPanel(null)}>
            {audioTracks.length <= 1 ? (
              <p className="text-caption text-muted">{t('app.player.singleAudio')}</p>
            ) : (
              <ul className="flex flex-col gap-8">
                {audioTracks.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectAudioTrack(t)}
                      className={cn(
                        'focusable flex w-full items-center justify-between rounded-lg px-12 py-10 text-left text-caption cursor-pointer',
                        (audioTrackId ?? audioTracks.find((x) => x.enabled)?.id) === t.id
                          ? 'bg-white/[.08] text-ink'
                          : 'text-muted hover:bg-white/[.05]',
                      )}
                    >
                      <span>
                        {t.label || t.language || t.id}
                        <span className="ml-8 font-mono text-[11px] uppercase text-muted">{t.language}</span>
                      </span>
                      {(audioTrackId ?? audioTracks.find((x) => x.enabled)?.id) === t.id && (
                        <Check size={16} strokeWidth={1.75} className="text-cyan" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>
        )}

        {panel === 'sources' && (
          <Sheet key="sources" title={t('app.player.sourcesTitle')} onClose={() => setPanel(null)}>
            {sourceGroups.map((g) => (
              <div key={g.addonId} className="mb-16">
                <div className="mb-8 flex items-center gap-8">
                  <span className="text-caption font-semibold text-ink">{g.addonName}</span>
                  <HealthDot
                    status={addonEngine.health(g.addonId).status}
                    latencyMs={addonEngine.health(g.addonId).latencyMs}
                  />
                </div>
                <ul className="flex flex-col gap-6">
                  {g.rows.map(({ s, i }) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => switchSource(i, 'manual')}
                        className={cn(
                          'focusable flex w-full items-center gap-10 rounded-lg px-12 py-10 text-left cursor-pointer',
                          i === srcIdx ? 'bg-white/[.08] ring-1 ring-cyan/40' : 'hover:bg-white/[.05]',
                        )}
                      >
                        {['HD', '4K', 'LIVE'].includes(s.quality.toUpperCase()) ? (
                          <Badge kind={s.quality.toUpperCase() as 'HD' | '4K' | 'LIVE'} />
                        ) : (
                          <span className="glass-1 inline-flex items-center rounded-md px-8 py-2 text-micro uppercase text-muted">
                            {s.quality}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-caption text-ink">{s.title}</span>
                        {i === srcIdx && <span className="font-mono text-[11px] text-cyan">{t('app.player.playingTag')}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-micro uppercase text-muted/70">
              {t('app.player.sourcesPreserveNote')}
            </p>
            {source && (
              <>
                <h4 className="mb-8 mt-24 text-micro uppercase text-muted">{t('app.player.externalOpen')}</h4>
                <ExternalPlayerMenu
                  streamUrl={source.url}
                  title={externalTitle}
                  onDone={() => setPanel(null)}
                />
              </>
            )}
          </Sheet>
        )}

        {panel === 'external' && source && (
          <Sheet key="external" title={t('app.player.externalOpen')} onClose={() => setPanel(null)}>
            <p className="mb-16 text-caption text-muted">
              {t('app.player.externalBody')}
            </p>
            <ExternalPlayerMenu
              streamUrl={source.url}
              title={externalTitle}
              onDone={() => setPanel(null)}
            />
          </Sheet>
        )}

        {panel === 'episodes' && meta.videos && (
          <Sheet key="episodes" title={t('app.detail.episodes')} onClose={() => setPanel(null)}>
            <ul className="flex flex-col gap-8">
              {meta.videos.map((v) => {
                const current = v.id === id;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPanel(null);
                        if (!current) navigate(`/app/player/series/${v.id}`);
                      }}
                      className={cn(
                        'focusable flex w-full items-center gap-12 rounded-lg border-l-2 px-12 py-10 text-left cursor-pointer',
                        current
                          ? 'border-cyan bg-white/[.08]'
                          : 'border-transparent text-muted hover:bg-white/[.05]',
                      )}
                    >
                      <span className="font-mono text-[11px] text-muted">
                        E{String(v.episode ?? 0).padStart(2, '0')}
                      </span>
                      <span className={cn('flex-1 truncate text-caption', current ? 'text-ink' : '')}>
                        {v.title}
                      </span>
                      {current && <span className="font-mono text-[11px] text-cyan">{t('app.player.nowTag')}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Sheet>
        )}
      </AnimatePresence>

      {/* unified error recovery */}
      <AnimatePresence>
        {error && (
          <ErrorPanel
            key="error"
            detail={error}
            isLastSource={!streams || srcIdx >= streams.length - 1}
            onNext={tryNextSource}
            onLower={lowerQuality}
            onRetry={retryCurrent}
            onBack={() => navigate(`/app/detail/${type}/${id}`)}
          />
        )}
      </AnimatePresence>

      {/* no streams at all */}
      {streams !== null && streams.length === 0 && !error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-16">
          <div className="glass-3 flex w-full max-w-md flex-col items-center gap-16 rounded-2xl p-32 text-center">
            <AlertTriangle size={28} strokeWidth={1.75} className="text-purple" />
            <h2 className="font-display text-title text-ink">{t('app.player.noSourcesTitle')}</h2>
            <p className="text-caption text-muted">
              {t('app.player.noSourcesCaption')}
            </p>
            <div className="flex w-full flex-col gap-12">
              <ButtonPrimary onClick={reloadStreams}>{t('app.player.retry')}</ButtonPrimary>
              <ButtonGhost onClick={() => navigate(`/app/detail/${type}/${id}`)}>{t('app.player.backToTitle')}</ButtonGhost>
            </div>
          </div>
        </div>
      )}

      {/* shortcuts overlay (?) */}
      <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title={t('app.player.shortcutsTitle')}>
        <ShortcutsTable />
      </Modal>
    </div>
  );
}

export default function Player() {
  return (
    <SubscriptionGate>
      <PlayerInner />
    </SubscriptionGate>
  );
}
