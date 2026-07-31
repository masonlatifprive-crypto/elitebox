/**
 * Settings — `/app/settings` (design settings.md).
 * Every control mutates a real store or runs a real probe:
 *  - contract settings (appearance/playback/subtitles/cache) → `useSettings`
 *  - extended prefs (TV mode, reduced motion, resume threshold, subtitle
 *    color/offset, addon timeout, circuit sensitivity) → a persisted zustand
 *    store local to this page
 *  - diagnostics run real checks (network, endpoint latency timing,
 *    localStorage R/W, HLS via MediaSource, addon engine health, storage
 *    estimate). Export/Import/Reset use the store's own config contract.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Activity,
  CheckCircle2,
  Copy,
  Download,
  Gauge,
  HardDrive,
  Info,
  Loader2,
  MonitorPlay,
  Palette,
  Play,
  Puzzle,
  RefreshCw,
  ShieldCheck,
  Subtitles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import {
  ButtonDanger,
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  GlassPanel,
  Modal,
  spring,
  toast,
} from '@/components/ui-elite';
import { addonEngine } from '@/lib/addons/engine';
import { DEFAULT_PROFILE_ID, useLibrary, useProfiles, useSettings } from '@/lib/store';
import { clearErrorLog, readErrorLog, type ErrorEntry } from '@/lib/errorlog';
import { detectTV } from '@/lib/tvnav';
import { cn } from '@/lib/utils';

/* ── extended prefs (persisted, this device) ───────────────────────────── */

interface ExtPrefs {
  tvMode: boolean;
  reduceMotion: boolean;
  resumeThresholdPct: number;
  subtitleColor: 'ink' | 'cyan' | 'yellow';
  subtitleOffsetPx: number;
  addonTimeoutMs: number;
  circuitSensitivity: 'relaxed' | 'balanced' | 'strict';
}

interface ExtPrefsState extends ExtPrefs {
  patch: (p: Partial<ExtPrefs>) => void;
}

const REDUCE_MOTION_STYLE_ID = 'elitebox-reduce-motion-style';
const REDUCE_MOTION_CSS = `
html.elite-reduce-motion *, html.elite-reduce-motion *::before, html.elite-reduce-motion *::after {
  animation-duration: 150ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 150ms !important;
  scroll-behavior: auto !important;
}`;

function applyReduceMotionClass(on: boolean): void {
  document.documentElement.classList.toggle('elite-reduce-motion', on);
  let tag = document.getElementById(REDUCE_MOTION_STYLE_ID);
  if (on && !tag) {
    tag = document.createElement('style');
    tag.id = REDUCE_MOTION_STYLE_ID;
    tag.textContent = REDUCE_MOTION_CSS;
    document.head.appendChild(tag);
  }
}

const useExtPrefs = create<ExtPrefsState>()(
  persist(
    (set) => ({
      tvMode: false,
      reduceMotion: false,
      resumeThresholdPct: 20,
      subtitleColor: 'cyan',
      subtitleOffsetPx: 48,
      addonTimeoutMs: 5000,
      circuitSensitivity: 'balanced',
      patch: (p) => set(p),
    }),
    {
      name: 'elitebox.v1.extprefs',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.tvMode) document.documentElement.classList.add('tv-mode');
          applyReduceMotionClass(state.reduceMotion);
        }
      },
    },
  ),
);

/* ── shared controls ───────────────────────────────────────────────────── */

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-16 border-b border-white/[.06] py-16 last:border-b-0">
      <div className="flex min-w-200 flex-1 flex-col gap-4">
        <span className="text-caption font-semibold text-ink">{label}</span>
        {desc && <span className="text-caption text-muted">{desc}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function EliteSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focusable relative h-24 w-44 shrink-0 rounded-full cursor-pointer transition-colors duration-200',
        checked ? 'bg-signature' : 'bg-white/[.10]',
      )}
    >
      <motion.span
        layout
        transition={spring.snappy}
        className={cn('absolute top-2 h-20 w-20 rounded-full bg-white shadow', checked ? 'right-2' : 'left-2')}
      />
    </button>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="glass-1 flex gap-4 rounded-full p-4">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'focusable relative rounded-full px-12 py-6 text-micro uppercase cursor-pointer transition-colors',
            value === o.value ? 'text-deep' : 'text-muted hover:text-ink',
          )}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-full bg-chrome" transition={spring.snappy} />
          )}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function SliderControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-12">
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focusable w-144 cursor-pointer accent-cyan max-md:w-96"
      />
      <span className="w-72 text-right font-mono text-[12px] text-cyan">{format(value)}</span>
    </div>
  );
}

function SelectControl<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        const opt = options.find((o) => String(o.value) === raw);
        if (opt) onChange(opt.value);
      }}
      className="focusable glass-1 cursor-pointer rounded-lg px-12 py-8 text-caption text-ink"
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)} className="bg-navy text-ink">
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── diagnostics ───────────────────────────────────────────────────────── */

interface DiagRow {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'ok' | 'fail';
  detail: string;
}

const DIAG_DEFS: Array<{ id: string; label: string }> = [
  { id: 'network', label: 'Network interface' },
  { id: 'latency', label: 'Public endpoint latency' },
  { id: 'storage-rw', label: 'Local storage read/write' },
  { id: 'hls', label: 'HLS playback support' },
  { id: 'addons', label: 'Addon engine health' },
  { id: 'storage-est', label: 'Storage estimate' },
];

function eliteboxStorageBytes(): number {
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('elitebox.')) {
      bytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2; // UTF-16
    }
  }
  return bytes;
}

async function runDiagCheck(id: string): Promise<{ ok: boolean; detail: string }> {
  switch (id) {
    case 'network':
      return navigator.onLine
        ? { ok: true, detail: 'online' }
        : { ok: false, detail: 'offline — checks below may fail' };
    case 'latency': {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const started = performance.now();
      try {
        await fetch(
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          { method: 'HEAD', cache: 'no-store', signal: ctrl.signal },
        );
        return { ok: true, detail: `${Math.round(performance.now() - started)}ms to stream mirror` };
      } catch {
        return { ok: false, detail: 'unreachable within 6s' };
      } finally {
        clearTimeout(timer);
      }
    }
    case 'storage-rw': {
      try {
        const probe = `probe-${Date.now()}`;
        localStorage.setItem('elitebox.v1.diag', probe);
        const read = localStorage.getItem('elitebox.v1.diag');
        localStorage.removeItem('elitebox.v1.diag');
        if (read !== probe) return { ok: false, detail: 'read-back mismatch' };
        return { ok: true, detail: `ok · ${(eliteboxStorageBytes() / 1024).toFixed(1)} KB used by Elitebox` };
      } catch {
        return { ok: false, detail: 'localStorage unavailable or full' };
      }
    }
    case 'hls': {
      const native =
        typeof document !== 'undefined' &&
        document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';
      let mse = false;
      if (typeof MediaSource !== 'undefined') {
        mse = MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
      }
      if (mse) return { ok: true, detail: native ? 'hls.js (MSE) + native' : 'hls.js via MSE' };
      if (native) return { ok: true, detail: 'native only' };
      return { ok: false, detail: 'none — HLS playback unavailable' };
    }
    case 'addons': {
      const all = addonEngine.healthAll();
      const ids = Object.keys(all);
      const okCount = ids.filter((k) => all[k].status === 'ok').length;
      return {
        ok: okCount === ids.length,
        detail: `${okCount}/${ids.length} healthy · ${ids.filter((k) => all[k].circuit === 'open').length} benched`,
      };
    }
    case 'storage-est': {
      if (!navigator.storage?.estimate) return { ok: false, detail: 'estimate API unavailable' };
      const est = await navigator.storage.estimate();
      const usedMb = ((est.usage ?? 0) / 1048576).toFixed(1);
      const quotaGb = ((est.quota ?? 0) / 1073741824).toFixed(1);
      return { ok: true, detail: `${usedMb} MB used of ${quotaGb} GB` };
    }
    default:
      return { ok: false, detail: 'unknown check' };
  }
}

/* ── sections nav ──────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'playback', label: 'Playback', icon: Play },
  { id: 'subtitles', label: 'Subtitles', icon: Subtitles },
  { id: 'addons', label: 'Addons', icon: Puzzle },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'storage', label: 'Storage & Cache', icon: HardDrive },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
  { id: 'configuration', label: 'Configuration', icon: Download },
  { id: 'about', label: 'About', icon: Info },
] as const;

const OPEN_CONTENT_CREDITS = [
  'Big Buck Bunny · Sintel · Tears of Steel · Elephants Dream — Blender Foundation, CC-BY 3.0',
  'Cosmos Laundromat · Caminandes 1–3 · Agent 327 · Sprite Fright — Blender Studio, CC-BY',
  'Charge · Wing It — Blender Studio open films, CC-BY',
  'Demo streams hosted by the Blender Foundation and public sample mirrors',
];

/* ── page ──────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, patchSettings, exportConfig, importConfig, resetAll } = useSettings();
  const prefs = useExtPrefs();
  const profiles = useProfiles((s) => s.profiles);
  const activeProfileId = useProfiles((s) => s.activeProfileId);
  const profile = profiles.find((p) => p.id === (activeProfileId ?? DEFAULT_PROFILE_ID));

  const [storageBytes, setStorageBytes] = useState(() => eliteboxStorageBytes());
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [diag, setDiag] = useState<DiagRow[] | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [errorEntries, setErrorEntries] = useState<ErrorEntry[] | null>(null);
  const historyPaused = useLibrary((s) => s.historyPaused);
  const setHistoryPaused = useLibrary((s) => s.setHistoryPaused);
  const fileRef = useRef<HTMLInputElement>(null);

  // Apply TV / reduced-motion classes whenever prefs change. The spatial-nav
  // hook also manages `html.tv-mode`, so re-assert after shell effects settle;
  // turning the pref off falls back to hardware auto-detection.
  const location = useLocation();
  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle('tv-mode', prefs.tvMode || detectTV());
      applyReduceMotionClass(prefs.reduceMotion);
    };
    apply();
    const t = setTimeout(apply, 80);
    return () => clearTimeout(t);
  }, [prefs.tvMode, prefs.reduceMotion, location.pathname]);

  useEffect(() => {
    let alive = true;
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then((e) => {
        if (alive) setEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0 });
      });
    }
    return () => {
      alive = false;
    };
  }, []);

  const refreshStorage = useCallback(() => setStorageBytes(eliteboxStorageBytes()), []);

  const runDiagnostics = useCallback(async () => {
    setDiagRunning(true);
    const rows: DiagRow[] = DIAG_DEFS.map((d) => ({ ...d, status: 'pending', detail: 'queued' }));
    setDiag([...rows]);
    for (let i = 0; i < DIAG_DEFS.length; i++) {
      rows[i] = { ...rows[i], status: 'running', detail: 'running…' };
      setDiag([...rows]);
      const r = await runDiagCheck(DIAG_DEFS[i].id);
      rows[i] = { ...rows[i], status: r.ok ? 'ok' : 'fail', detail: r.detail };
      setDiag([...rows]);
      await new Promise((res) => setTimeout(res, 150));
    }
    setDiagRunning(false);
  }, []);

  const copyDiagnostics = useCallback(() => {
    if (!diag) return;
    const report = {
      app: 'elitebox',
      version: '1.0.0',
      at: new Date().toISOString(),
      userAgent: navigator.userAgent,
      checks: diag.map((d) => ({ id: d.id, status: d.status, detail: d.detail })),
    };
    void navigator.clipboard
      .writeText(JSON.stringify(report, null, 2))
      .then(() => toast('Diagnostics copied — attach it to any bug report'))
      .catch(() => toast.error('Clipboard unavailable in this browser'));
  }, [diag]);

  const doExport = useCallback(() => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elitebox-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast(`Configuration exported (${(blob.size / 1024).toFixed(1)} KB)`);
  }, [exportConfig]);

  const doImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const ok = importConfig(String(reader.result ?? ''));
        if (ok) {
          toast('Configuration imported');
          refreshStorage();
        } else {
          toast.error('Import failed — not a valid Elitebox config file');
        }
      };
      reader.onerror = () => toast.error('Could not read that file');
      reader.readAsText(file);
    },
    [importConfig, refreshStorage],
  );

  const subtitlePreviewStyle = useMemo(() => {
    const sizeMap = { small: '0.875rem', normal: '1.125rem', large: '1.5rem' } as const;
    const colorMap = {
      ink: 'var(--ink)',
      cyan: 'var(--cyan)',
      yellow: 'var(--warn)',
    } as const;
    return {
      fontSize: sizeMap[settings.subtitles.size],
      color: colorMap[prefs.subtitleColor],
      bottom: `${prefs.subtitleOffsetPx}px`,
      textShadow: '0 2px 8px rgba(0,0,0,.8)',
    } as const;
  }, [settings.subtitles.size, prefs.subtitleColor, prefs.subtitleOffsetPx]);

  const storagePct = estimate && estimate.quota > 0 ? Math.min(100, (estimate.usage / estimate.quota) * 100) : null;

  return (
    <div className="flex flex-col gap-32">
      {/* ── S0 header ── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center gap-16"
      >
        <h1 className="font-display text-display-xl text-ink max-md:text-[2.25rem]">Settings</h1>
        {profile && (
          <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-6">
            <img src={profile.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
            <span className="text-caption text-muted">{profile.name}</span>
          </span>
        )}
        <span className="text-micro uppercase text-muted">Saved locally · this device only</span>
      </motion.header>

      <div className="flex gap-32 max-lg:flex-col">
        {/* ── left nav ── */}
        <nav className="shrink-0 lg:sticky lg:top-24 lg:w-220 lg:self-start">
          <div className="glass-1 flex gap-4 overflow-x-auto no-scrollbar rounded-xl p-8 lg:flex-col">
            {SECTIONS.map((s, i) => (
              <motion.a
                key={s.id}
                href={`#${s.id}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring.smooth, delay: i * 0.04 }}
                className="focusable flex shrink-0 items-center gap-12 rounded-lg px-12 py-8 text-caption text-muted hover:text-ink hover:bg-white/[.06]"
              >
                <s.icon size={16} strokeWidth={1.75} className="text-cyan" />
                {s.label}
              </motion.a>
            ))}
          </div>
        </nav>

        {/* ── content ── */}
        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-32">
          {/* ── S1 Appearance ── */}
          <section id="appearance" className="scroll-mt-96">
            <GlassPanel level={2} className="p-24">
              <h2 className="font-display text-title text-ink">Appearance</h2>
              <SettingRow
                label="TV mode"
                desc="10-foot interface: larger scale and focus targets. TVs are auto-detected; force it here. Full effect after reload."
              >
                <EliteSwitch
                  checked={prefs.tvMode}
                  onChange={(v) => {
                    prefs.patch({ tvMode: v });
                    toast(v ? 'TV mode on — reload for full effect' : 'TV mode off');
                  }}
                  label="Toggle TV mode"
                />
              </SettingRow>
              <SettingRow
                label="Reduced motion"
                desc="Cinematic springs become instant fades on this device. Your OS setting is always respected."
              >
                <EliteSwitch
                  checked={prefs.reduceMotion}
                  onChange={(v) => prefs.patch({ reduceMotion: v })}
                  label="Toggle reduced motion"
                />
              </SettingRow>
              <SettingRow label="Ambience particles" desc="The living particle field behind the app.">
                <EliteSwitch
                  checked={settings.appearance.ambience}
                  onChange={(v) => patchSettings({ appearance: { ...settings.appearance, ambience: v } })}
                  label="Toggle ambience particles"
                />
              </SettingRow>
              <SettingRow label="Film grain" desc="Subtle cinematic grain overlay on artwork.">
                <EliteSwitch
                  checked={settings.appearance.grain}
                  onChange={(v) => patchSettings({ appearance: { ...settings.appearance, grain: v } })}
                  label="Toggle film grain"
                />
              </SettingRow>
            </GlassPanel>
          </section>

          {/* ── S2 Playback ── */}
          <section id="playback" className="scroll-mt-96">
            <GlassPanel level={2} className="p-24">
              <h2 className="font-display text-title text-ink">Playback</h2>
              <SettingRow label="Default speed" desc="Applied when a title has no saved speed memory.">
                <SelectControl
                  label="Default playback speed"
                  value={settings.playback.defaultSpeed}
                  options={[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => ({ value: v, label: `${v}×` }))}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, defaultSpeed: v } })}
                />
              </SettingRow>
              <SettingRow label="Autoplay next episode" desc="Roll into the next episode when one exists.">
                <EliteSwitch
                  checked={settings.playback.autoplayNext}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, autoplayNext: v } })}
                  label="Toggle autoplay next episode"
                />
              </SettingRow>
              <SettingRow label="Preferred quality" desc="Auto picks the best source your connection sustains.">
                <SelectControl
                  label="Preferred quality"
                  value={settings.playback.preferredQuality}
                  options={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'HD', label: 'HD' },
                    { value: '4K', label: '4K' },
                    { value: 'SD', label: 'SD (save data)' },
                  ]}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, preferredQuality: v } })}
                />
              </SettingRow>
              <SettingRow
                label="Resume prompt threshold"
                desc="Ask to resume once you're past this point in a title."
              >
                <SliderControl
                  label="Resume prompt threshold"
                  value={prefs.resumeThresholdPct}
                  min={2}
                  max={80}
                  onChange={(v) => prefs.patch({ resumeThresholdPct: v })}
                  format={(v) => `${v}%`}
                />
              </SettingRow>
              <SettingRow label="Hardware acceleration" desc="Use the GPU for decoding when available.">
                <EliteSwitch
                  checked={settings.playback.hardwareAccel}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, hardwareAccel: v } })}
                  label="Toggle hardware acceleration"
                />
              </SettingRow>
              <SettingRow label="Ambient mode" desc="Soft lunar glow behind the video while you watch.">
                <EliteSwitch
                  checked={settings.playback.ambient ?? true}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, ambient: v } })}
                  label="Toggle ambient mode"
                />
              </SettingRow>
            </GlassPanel>
          </section>

          {/* ── S3 Subtitles ── */}
          <section id="subtitles" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-8 p-24">
              <h2 className="font-display text-title text-ink">Subtitles</h2>
              <SettingRow label="Subtitles enabled" desc="Show subtitle tracks when a stream provides them.">
                <EliteSwitch
                  checked={settings.subtitles.enabled}
                  onChange={(v) => patchSettings({ subtitles: { ...settings.subtitles, enabled: v } })}
                  label="Toggle subtitles"
                />
              </SettingRow>
              <SettingRow label="Preferred language" desc="Picked automatically when multiple tracks exist.">
                <SelectControl
                  label="Preferred subtitle language"
                  value={settings.subtitles.preferredLang}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' },
                    { value: 'fr', label: 'Français' },
                    { value: 'de', label: 'Deutsch' },
                    { value: 'pt', label: 'Português' },
                  ]}
                  onChange={(v) => patchSettings({ subtitles: { ...settings.subtitles, preferredLang: v } })}
                />
              </SettingRow>
              <SettingRow label="Size" desc="Scales the subtitle track in the player.">
                <Segmented
                  label="Subtitle size"
                  value={settings.subtitles.size}
                  options={[
                    { value: 'small', label: 'S' },
                    { value: 'normal', label: 'M' },
                    { value: 'large', label: 'L' },
                  ]}
                  onChange={(v) => patchSettings({ subtitles: { ...settings.subtitles, size: v } })}
                />
              </SettingRow>
              <SettingRow label="Color" desc="Ink, cyan or yellow — whichever reads best on your screen.">
                <div className="flex gap-8" role="radiogroup" aria-label="Subtitle color">
                  {(
                    [
                      { value: 'ink', bg: 'var(--ink)', label: 'Ink' },
                      { value: 'cyan', bg: 'var(--cyan)', label: 'Cyan' },
                      { value: 'yellow', bg: '#FFE14D', label: 'Yellow' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={prefs.subtitleColor === c.value}
                      aria-label={`Subtitle color ${c.label}`}
                      onClick={() => prefs.patch({ subtitleColor: c.value })}
                      className={cn(
                        'focusable h-32 w-32 cursor-pointer rounded-full ring-2 ring-offset-2 ring-offset-deep transition-all',
                        prefs.subtitleColor === c.value ? 'ring-cyan scale-110' : 'ring-transparent',
                      )}
                      style={{ background: c.bg }}
                    />
                  ))}
                </div>
              </SettingRow>
              <SettingRow label="Bottom offset" desc="Lift subtitles off the bottom edge of the player.">
                <SliderControl
                  label="Subtitle bottom offset"
                  value={prefs.subtitleOffsetPx}
                  min={0}
                  max={120}
                  step={4}
                  onChange={(v) => prefs.patch({ subtitleOffsetPx: v })}
                  format={(v) => `${v}px`}
                />
              </SettingRow>

              {/* live preview */}
              <div className="relative mt-8 h-160 overflow-hidden rounded-xl ring-1 ring-white/[.08]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(600px 200px at 70% 20%, rgba(139,124,232,.25), transparent 60%), radial-gradient(500px 220px at 20% 90%, rgba(124,217,236,.18), transparent 55%), var(--deep)',
                  }}
                />
                {settings.subtitles.enabled && (
                  <motion.span
                    key={`${settings.subtitles.size}-${prefs.subtitleColor}-${prefs.subtitleOffsetPx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-x-0 text-center font-sans font-semibold"
                    style={subtitlePreviewStyle}
                  >
                    Everything you watch. One place.
                  </motion.span>
                )}
                {!settings.subtitles.enabled && (
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-caption text-muted">
                    Subtitles disabled — enable them to preview
                  </span>
                )}
              </div>
            </GlassPanel>
          </section>

          {/* ── S4 Addons ── */}
          <section id="addons" className="scroll-mt-96">
            <GlassPanel level={2} className="p-24">
              <h2 className="font-display text-title text-ink">Addons</h2>
              <SettingRow label="Request timeout" desc="Shorter = snappier, stricter. Slow addons get benched sooner.">
                <SliderControl
                  label="Addon request timeout"
                  value={prefs.addonTimeoutMs}
                  min={2000}
                  max={10000}
                  step={500}
                  onChange={(v) => prefs.patch({ addonTimeoutMs: v })}
                  format={(v) => `${(v / 1000).toFixed(1)}s`}
                />
              </SettingRow>
              <SettingRow
                label="Circuit-breaker sensitivity"
                desc="How quickly a failing addon is benched. Balanced benches after 3 consecutive failures."
              >
                <Segmented
                  label="Circuit-breaker sensitivity"
                  value={prefs.circuitSensitivity}
                  options={[
                    { value: 'relaxed', label: 'Relaxed' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'strict', label: 'Strict' },
                  ]}
                  onChange={(v) => prefs.patch({ circuitSensitivity: v })}
                />
              </SettingRow>
              <div className="pt-16">
                <ButtonNeon to="/app/addons">
                  <Puzzle size={16} strokeWidth={1.75} />
                  Open Addon Manager
                </ButtonNeon>
              </div>
            </GlassPanel>
          </section>

          {/* ── S4b Privacy ── */}
          <section id="privacy" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-4 p-24">
              <h2 className="font-display text-title text-ink">Privacy</h2>
              <SettingRow
                label="Incognito — pause watch history"
                desc="While on, nothing you play is recorded to Continue Watching. Existing entries are untouched."
              >
                <EliteSwitch
                  checked={historyPaused}
                  onChange={(v) => {
                    setHistoryPaused(v);
                    toast(v ? 'Incognito on — watch history paused' : 'Watch history resumed');
                  }}
                  label="Toggle incognito (pause watch history)"
                />
              </SettingRow>
              <SettingRow
                label="What addons can see"
                desc="Addons receive only the title requests your device makes to them — never your account, identity or watch history."
              >
                <span className="font-mono text-[11px] uppercase text-ok">Enforced by the engine</span>
              </SettingRow>

              <div className="mt-8 flex flex-col gap-10 border-t border-white/[.06] pt-16">
                <div className="flex items-center justify-between gap-12">
                  <div className="flex flex-col gap-2">
                    <span className="text-caption text-ink">On-device error log</span>
                    <span className="text-caption text-muted">
                      Uncaught errors stay in this local ring buffer — nothing is uploaded.
                    </span>
                  </div>
                  <div className="flex gap-8">
                    <ButtonGhost onClick={() => setErrorEntries(readErrorLog())}>
                      Refresh
                    </ButtonGhost>
                    <ButtonGhost
                      onClick={() => {
                        clearErrorLog();
                        setErrorEntries([]);
                        toast('Error log cleared');
                      }}
                      className="text-error hover:text-error"
                    >
                      Clear
                    </ButtonGhost>
                  </div>
                </div>
                {(errorEntries ?? []).length === 0 ? (
                  <span className="font-mono text-[11px] text-muted">No captured errors — clean run.</span>
                ) : (
                  <ul className="flex max-h-192 flex-col gap-6 overflow-y-auto rounded-lg bg-deep/60 p-12">
                    {(errorEntries ?? []).slice(0, 20).map((e) => (
                      <li key={e.id} className="font-mono text-[11px] text-muted">
                        <span className={e.kind === 'error' ? 'text-error' : 'text-warn'}>
                          [{e.kind}]
                        </span>{' '}
                        <span className="text-ink/85">{e.message}</span>
                        {e.source ? ` · ${e.source}` : ''} · {new Date(e.at).toLocaleTimeString()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </GlassPanel>
          </section>

          {/* ── S5 Storage & Cache ── */}
          <section id="storage" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-16 p-24">
              <h2 className="font-display text-title text-ink">Storage & Cache</h2>
              <div className="flex flex-col gap-8">
                <div className="flex items-baseline justify-between">
                  <span className="text-caption text-muted">Elitebox data on this device</span>
                  <span className="font-mono text-[12px] text-cyan">{(storageBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="h-8 w-full overflow-hidden rounded-full bg-white/[.06]">
                  <div
                    className="h-full bg-signature transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, (storageBytes / (5 * 1024 * 1024)) * 100))}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-muted">
                  {estimate
                    ? `browser origin: ${(estimate.usage / 1048576).toFixed(1)} MB of ${(estimate.quota / 1073741824).toFixed(1)} GB quota${
                        storagePct !== null ? ` (${storagePct.toFixed(2)}%)` : ''
                      }`
                    : 'browser storage estimate unavailable'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-12">
                <ButtonGhost
                  onClick={() => {
                    refreshStorage();
                    toast('Storage re-measured');
                  }}
                >
                  <RefreshCw size={14} strokeWidth={1.75} />
                  Re-measure
                </ButtonGhost>
                <ButtonGhost onClick={() => setClearOpen(true)} className="text-error hover:text-error">
                  <Trash2 size={14} strokeWidth={1.75} />
                  Clear all data
                </ButtonGhost>
              </div>
            </GlassPanel>
          </section>

          {/* ── S7 Diagnostics ── */}
          <section id="diagnostics" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-16 p-24">
              <div className="flex flex-wrap items-center gap-16">
                <h2 className="font-display text-title text-ink">Diagnostics</h2>
                <div className="ml-auto flex items-center gap-8">
                  {diag && !diagRunning && (
                    <ButtonGhost onClick={copyDiagnostics}>
                      <Copy size={14} strokeWidth={1.75} />
                      Copy report
                    </ButtonGhost>
                  )}
                  <ButtonPrimary onClick={() => void runDiagnostics()} className={diagRunning ? 'opacity-50 pointer-events-none' : ''}>
                    <Gauge size={16} strokeWidth={1.75} />
                    {diagRunning ? 'Running…' : diag ? 'Re-run diagnostics' : 'Run diagnostics'}
                  </ButtonPrimary>
                </div>
              </div>
              {diag === null ? (
                <p className="text-caption text-muted">
                  Six real checks: network, stream-mirror latency, storage, HLS support, addon
                  health, quota. Nothing is simulated.
                </p>
              ) : (
                <div className="flex flex-col gap-8">
                  {diag.map((row) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-12 rounded-lg bg-white/[.03] px-16 py-12"
                    >
                      {row.status === 'running' || row.status === 'pending' ? (
                        <Loader2 size={16} strokeWidth={1.75} className={cn('shrink-0 text-muted', row.status === 'running' && 'animate-spin text-cyan')} />
                      ) : row.status === 'ok' ? (
                        <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-ok" />
                      ) : (
                        <XCircle size={16} strokeWidth={1.75} className="shrink-0 text-error" />
                      )}
                      <span className="w-200 shrink-0 text-caption text-ink max-md:w-120">{row.label}</span>
                      <span className="font-mono text-[12px] text-muted">{row.detail}</span>
                    </motion.div>
                  ))}
                  <span className="font-mono text-[11px] text-muted">elitebox v1.0.0 · web build</span>
                </div>
              )}
            </GlassPanel>
          </section>

          {/* ── S6 Configuration ── */}
          <section id="configuration" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-8 p-24">
              <h2 className="font-display text-title text-ink">Configuration</h2>
              <SettingRow label="Export configuration" desc="One JSON: profiles, addons, settings, library, progress.">
                <ButtonPrimary onClick={doExport}>
                  <Download size={16} strokeWidth={1.75} />
                  Export
                </ButtonPrimary>
              </SettingRow>
              <SettingRow label="Import configuration" desc="Restore from a previously exported elitebox-config.json.">
                <ButtonNeon onClick={() => fileRef.current?.click()}>
                  <Upload size={16} strokeWidth={1.75} />
                  Import
                </ButtonNeon>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) doImport(f);
                    e.target.value = '';
                  }}
                />
              </SettingRow>
              <div className="mt-8 border-t border-error/30 pt-16">
                <SettingRow label="Reset Elitebox" desc="Wipes everything on this device — profiles, library, addons, settings.">
                  <ButtonDanger onClick={() => setResetOpen(true)}>Reset</ButtonDanger>
                </SettingRow>
              </div>
            </GlassPanel>
          </section>

          {/* ── S8 About ── */}
          <section id="about" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-16 p-24">
              <div className="flex items-center gap-16">
                <LogoMark height={40} glow />
                <div className="flex flex-col gap-4">
                  <span className="font-mono text-caption text-ink">Elitebox v1.0.0</span>
                  <span className="text-caption text-muted">Media control that feels alive.</span>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                <span className="text-micro uppercase text-muted">Open content licenses</span>
                {OPEN_CONTENT_CREDITS.map((line) => (
                  <span key={line} className="text-caption text-muted">
                    {line}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-4 border-t border-white/[.06] pt-16">
                <span className="text-caption text-muted">
                  One codebase — web, desktop, Android and TV. The web app is live today;
                  native builds ship from the same codebase with the v1.0 release.
                </span>
                <span className="font-mono text-[11px] text-muted">
                  <MonitorPlay size={12} strokeWidth={1.75} className="mr-6 inline text-cyan" />
                  platform: web · {navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'}
                </span>
              </div>
            </GlassPanel>
          </section>
        </div>
      </div>

      {/* ── clear data confirm ── */}
      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="Clear all Elitebox data?">
        <div className="flex flex-col gap-16">
          <p className="text-caption text-muted">
            Profiles, libraries, addons and settings on this device are wiped. This cannot be undone
            — export your configuration first if you want a backup.
          </p>
          <div className="flex justify-end gap-12">
            <ButtonGhost onClick={() => setClearOpen(false)}>Cancel</ButtonGhost>
            <ButtonDanger
              onClick={() => {
                resetAll();
                setClearOpen(false);
                refreshStorage();
                toast('All Elitebox data cleared');
                navigate('/app/onboarding');
              }}
            >
              Clear everything
            </ButtonDanger>
          </div>
        </div>
      </Modal>

      {/* ── reset confirm (type RESET) ── */}
      <Modal
        open={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setResetText('');
        }}
        title="Reset Elitebox"
      >
        <div className="flex flex-col gap-16">
          <p className="text-caption text-muted">
            Type <span className="font-mono text-error">RESET</span> to confirm. Everything on this
            device is wiped and you'll land back on onboarding.
          </p>
          <input
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            placeholder="RESET"
            spellCheck={false}
            className="focusable glass-1 w-full rounded-lg px-16 py-12 font-mono text-caption text-ink placeholder:text-muted/60"
          />
          <div className="flex justify-end gap-12">
            <ButtonGhost
              onClick={() => {
                setResetOpen(false);
                setResetText('');
              }}
            >
              Cancel
            </ButtonGhost>
            <ButtonDanger
              className={resetText !== 'RESET' ? 'opacity-50 pointer-events-none' : ''}
              onClick={() => {
                resetAll();
                setResetOpen(false);
                setResetText('');
                toast('Elitebox reset');
                navigate('/app/onboarding');
              }}
            >
              Reset everything
            </ButtonDanger>
          </div>
        </div>
      </Modal>
    </div>
  );
}
