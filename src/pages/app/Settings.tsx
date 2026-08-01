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
  Magnet,
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
import type { EliteSettings } from '@/lib/store';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
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

const DIAG_DEFS: Array<{ id: string; labelKey: string }> = [
  { id: 'network', labelKey: 'app.settings.diagNetwork' },
  { id: 'latency', labelKey: 'app.settings.diagLatency' },
  { id: 'storage-rw', labelKey: 'app.settings.diagStorageRw' },
  { id: 'hls', labelKey: 'app.settings.diagHls' },
  { id: 'addons', labelKey: 'app.settings.diagAddons' },
  { id: 'storage-est', labelKey: 'app.settings.diagStorageEst' },
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

async function runDiagCheck(id: string, t: TFunction): Promise<{ ok: boolean; detail: string }> {
  switch (id) {
    case 'network':
      return navigator.onLine
        ? { ok: true, detail: t('app.settings.diagOnline') }
        : { ok: false, detail: t('app.settings.diagOffline') };
    case 'latency': {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const started = performance.now();
      try {
        await fetch(
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          { method: 'HEAD', cache: 'no-store', signal: ctrl.signal },
        );
        return { ok: true, detail: t('app.settings.diagLatencyOk', { ms: Math.round(performance.now() - started) }) };
      } catch {
        return { ok: false, detail: t('app.settings.diagLatencyFail') };
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
        if (read !== probe) return { ok: false, detail: t('app.settings.diagMismatch') };
        return { ok: true, detail: t('app.settings.diagStorageOk', { kb: (eliteboxStorageBytes() / 1024).toFixed(1) }) };
      } catch {
        return { ok: false, detail: t('app.settings.diagStorageFail') };
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
      if (native) return { ok: true, detail: t('app.settings.diagHlsNative') };
      return { ok: false, detail: t('app.settings.diagHlsNone') };
    }
    case 'addons': {
      const all = addonEngine.healthAll();
      const ids = Object.keys(all);
      const okCount = ids.filter((k) => all[k].status === 'ok').length;
      return {
        ok: okCount === ids.length,
        detail: t('app.settings.diagAddonsDetail', {
          ok: okCount,
          total: ids.length,
          benched: ids.filter((k) => all[k].circuit === 'open').length,
        }),
      };
    }
    case 'storage-est': {
      if (!navigator.storage?.estimate) return { ok: false, detail: t('app.settings.diagEstUnavailable') };
      const est = await navigator.storage.estimate();
      const usedMb = ((est.usage ?? 0) / 1048576).toFixed(1);
      const quotaGb = ((est.quota ?? 0) / 1073741824).toFixed(1);
      return { ok: true, detail: t('app.settings.diagEstDetail', { used: usedMb, quota: quotaGb }) };
    }
    default:
      return { ok: false, detail: t('app.settings.diagUnknown') };
  }
}

/* ── sections nav ──────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'appearance', labelKey: 'app.settings.navAppearance', icon: Palette },
  { id: 'playback', labelKey: 'app.settings.navPlayback', icon: Play },
  { id: 'streaming', labelKey: 'app.settings.navStreaming', icon: Magnet },
  { id: 'subtitles', labelKey: 'app.settings.navSubtitles', icon: Subtitles },
  { id: 'addons', labelKey: 'app.settings.navAddons', icon: Puzzle },
  { id: 'privacy', labelKey: 'app.settings.navPrivacy', icon: ShieldCheck },
  { id: 'storage', labelKey: 'app.settings.navStorage', icon: HardDrive },
  { id: 'diagnostics', labelKey: 'app.settings.navDiagnostics', icon: Activity },
  { id: 'configuration', labelKey: 'app.settings.navConfiguration', icon: Download },
  { id: 'about', labelKey: 'app.settings.navAbout', icon: Info },
] as const;

/** Honest one-liners per torrent profile — what each mode really does. */
const TORRENT_PROFILE_DESC: Record<EliteSettings['streaming']['torrentProfile'], string> = {
  off: 'app.settings.torrentDescOff',
  metadata: 'app.settings.torrentDescMetadata',
  desktop: 'app.settings.torrentDescDesktop',
};

const OPEN_CONTENT_CREDITS = [
  'Big Buck Bunny · Sintel · Tears of Steel · Elephants Dream — Blender Foundation, CC-BY 3.0',
  'Cosmos Laundromat · Caminandes 1–3 · Agent 327 · Sprite Fright — Blender Studio, CC-BY',
  'Charge · Wing It — Blender Studio open films, CC-BY',
  'Demo streams hosted by the Blender Foundation and public sample mirrors',
];

/* ── page ──────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useT();
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
    const rows: DiagRow[] = DIAG_DEFS.map((d) => ({ id: d.id, label: t(d.labelKey), status: 'pending', detail: t('app.settings.diagQueued') }));
    setDiag([...rows]);
    for (let i = 0; i < DIAG_DEFS.length; i++) {
      rows[i] = { ...rows[i], status: 'running', detail: t('app.settings.diagRunning') };
      setDiag([...rows]);
      const r = await runDiagCheck(DIAG_DEFS[i].id, t);
      rows[i] = { ...rows[i], status: r.ok ? 'ok' : 'fail', detail: r.detail };
      setDiag([...rows]);
      await new Promise((res) => setTimeout(res, 150));
    }
    setDiagRunning(false);
  }, [t]);

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
      .then(() => toast(t('app.settings.toastDiagCopied')))
      .catch(() => toast.error(t('app.magnet.clipboardUnavailable')));
  }, [diag, t]);

  const doExport = useCallback(() => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elitebox-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast(t('app.settings.toastExported', { kb: (blob.size / 1024).toFixed(1) }));
  }, [exportConfig, t]);

  const doImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const ok = importConfig(String(reader.result ?? ''));
        if (ok) {
          toast(t('app.settings.toastImported'));
          refreshStorage();
        } else {
          toast.error(t('app.settings.toastImportFailed'));
        }
      };
      reader.onerror = () => toast.error(t('app.settings.toastReadFailed'));
      reader.readAsText(file);
    },
    [importConfig, refreshStorage, t],
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
        <h1 className="font-display text-display-xl text-ink max-md:text-[2.25rem]">{t('app.rail.settings')}</h1>
        {profile && (
          <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-6">
            <img src={profile.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
            <span className="text-caption text-muted">{profile.name}</span>
          </span>
        )}
        <span className="text-micro uppercase text-muted">{t('app.settings.savedLocally')}</span>
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
                {t(s.labelKey)}
              </motion.a>
            ))}
          </div>
        </nav>

        {/* ── content ── */}
        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-32">
          {/* ── S1 Appearance ── */}
          <section id="appearance" className="scroll-mt-96">
            <GlassPanel level={2} className="p-24">
              <h2 className="font-display text-title text-ink">{t('app.settings.navAppearance')}</h2>
              <SettingRow label={t('common.settings.language')} desc={t('common.settings.languageDesc')}>
                <SelectControl
                  label={t('common.settings.language')}
                  value={settings.general.language}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'nl', label: 'Nederlands' },
                  ]}
                  onChange={(v) => patchSettings({ general: { ...settings.general, language: v } })}
                />
              </SettingRow>
              <SettingRow
                label={t('app.settings.tvMode')}
                desc={t('app.settings.tvModeDesc')}
              >
                <EliteSwitch
                  checked={prefs.tvMode}
                  onChange={(v) => {
                    prefs.patch({ tvMode: v });
                    toast(v ? t('app.settings.toastTvOn') : t('app.palette.tvOff'));
                  }}
                  label={t('app.settings.tvModeToggle')}
                />
              </SettingRow>
              <SettingRow
                label={t('app.settings.reducedMotion')}
                desc={t('app.settings.reducedMotionDesc')}
              >
                <EliteSwitch
                  checked={prefs.reduceMotion}
                  onChange={(v) => prefs.patch({ reduceMotion: v })}
                  label={t('app.settings.reducedMotionToggle')}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.ambience')} desc={t('app.settings.ambienceDesc')}>
                <EliteSwitch
                  checked={settings.appearance.ambience}
                  onChange={(v) => patchSettings({ appearance: { ...settings.appearance, ambience: v } })}
                  label={t('app.settings.ambienceToggle')}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.grain')} desc={t('app.settings.grainDesc')}>
                <EliteSwitch
                  checked={settings.appearance.grain}
                  onChange={(v) => patchSettings({ appearance: { ...settings.appearance, grain: v } })}
                  label={t('app.settings.grainToggle')}
                />
              </SettingRow>
            </GlassPanel>
          </section>

          {/* ── S2 Playback ── */}
          <section id="playback" className="scroll-mt-96">
            <GlassPanel level={2} className="p-24">
              <h2 className="font-display text-title text-ink">{t('app.settings.navPlayback')}</h2>
              <SettingRow label={t('app.settings.defaultSpeed')} desc={t('app.settings.defaultSpeedDesc')}>
                <SelectControl
                  label={t('app.settings.defaultSpeedAria')}
                  value={settings.playback.defaultSpeed}
                  options={[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => ({ value: v, label: `${v}×` }))}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, defaultSpeed: v } })}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.autoplayNext')} desc={t('app.settings.autoplayNextDesc')}>
                <EliteSwitch
                  checked={settings.playback.autoplayNext}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, autoplayNext: v } })}
                  label={t('app.settings.autoplayNextToggle')}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.preferredQuality')} desc={t('app.settings.preferredQualityDesc')}>
                <SelectControl
                  label={t('app.settings.preferredQualityAria')}
                  value={settings.playback.preferredQuality}
                  options={[
                    { value: 'auto', label: t('app.settings.qualityAuto') },
                    { value: 'HD', label: 'HD' },
                    { value: '4K', label: '4K' },
                    { value: 'SD', label: t('app.settings.qualitySd') },
                  ]}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, preferredQuality: v } })}
                />
              </SettingRow>
              <SettingRow
                label={t('app.settings.resumeThreshold')}
                desc={t('app.settings.resumeThresholdDesc')}
              >
                <SliderControl
                  label={t('app.settings.resumeThresholdAria')}
                  value={prefs.resumeThresholdPct}
                  min={2}
                  max={80}
                  onChange={(v) => prefs.patch({ resumeThresholdPct: v })}
                  format={(v) => `${v}%`}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.hwAccel')} desc={t('app.settings.hwAccelDesc')}>
                <EliteSwitch
                  checked={settings.playback.hardwareAccel}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, hardwareAccel: v } })}
                  label={t('app.settings.hwAccelToggle')}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.ambientMode')} desc={t('app.settings.ambientModeDesc')}>
                <EliteSwitch
                  checked={settings.playback.ambient ?? true}
                  onChange={(v) => patchSettings({ playback: { ...settings.playback, ambient: v } })}
                  label={t('app.settings.ambientModeToggle')}
                />
              </SettingRow>
            </GlassPanel>
          </section>

          {/* ── S2b Streaming ── */}
          <section id="streaming" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-8 p-24">
              <h2 className="font-display text-title text-ink">{t('app.settings.navStreaming')}</h2>
              <SettingRow
                label={t('app.settings.torrentProfile')}
                desc={t('app.settings.torrentProfileDesc')}
              >
                <SelectControl
                  label={t('app.settings.torrentProfileAria')}
                  value={settings.streaming.torrentProfile}
                  options={[
                    { value: 'off', label: t('app.settings.torrentOptOff') },
                    { value: 'metadata', label: t('app.settings.torrentOptMetadata') },
                    { value: 'desktop', label: t('app.settings.torrentOptDesktop') },
                  ]}
                  onChange={(v) => {
                    patchSettings({ streaming: { ...settings.streaming, torrentProfile: v } });
                    toast(
                      v === 'off'
                        ? t('app.settings.toastTorrentOff')
                        : v === 'metadata'
                          ? t('app.settings.toastTorrentMetadata')
                          : t('app.settings.toastTorrentDesktop'),
                    );
                  }}
                />
              </SettingRow>
              <p className="text-caption text-muted">
                {t(TORRENT_PROFILE_DESC[settings.streaming.torrentProfile])}
              </p>
              <SettingRow
                label={t('app.settings.cacheLimit')}
                desc={t('app.settings.cacheLimitDesc')}
              >
                <SliderControl
                  label={t('app.settings.cacheLimitAria')}
                  value={settings.streaming.maxCacheGb}
                  min={1}
                  max={16}
                  onChange={(v) => patchSettings({ streaming: { ...settings.streaming, maxCacheGb: v } })}
                  format={(v) => `${v} GB`}
                />
              </SettingRow>
              <div className="mt-8 flex items-start gap-8 rounded-xl border border-cyan/25 bg-[rgba(124,217,236,.05)] p-12">
                <ShieldCheck size={14} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                <p className="text-caption text-muted">{t('app.magnet.legal.settingsNote')}</p>
              </div>
            </GlassPanel>
          </section>

          {/* ── S3 Subtitles ── */}
          <section id="subtitles" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-8 p-24">
              <h2 className="font-display text-title text-ink">{t('app.settings.navSubtitles')}</h2>
              <SettingRow label={t('app.settings.subsEnabled')} desc={t('app.settings.subsEnabledDesc')}>
                <EliteSwitch
                  checked={settings.subtitles.enabled}
                  onChange={(v) => patchSettings({ subtitles: { ...settings.subtitles, enabled: v } })}
                  label={t('app.settings.subsEnabledToggle')}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.subsLang')} desc={t('app.settings.subsLangDesc')}>
                <SelectControl
                  label={t('app.settings.subsLangAria')}
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
              <SettingRow label={t('app.settings.subsSize')} desc={t('app.settings.subsSizeDesc')}>
                <Segmented
                  label={t('app.settings.subsSizeAria')}
                  value={settings.subtitles.size}
                  options={[
                    { value: 'small', label: 'S' },
                    { value: 'normal', label: 'M' },
                    { value: 'large', label: 'L' },
                  ]}
                  onChange={(v) => patchSettings({ subtitles: { ...settings.subtitles, size: v } })}
                />
              </SettingRow>
              <SettingRow label={t('app.settings.subsColor')} desc={t('app.settings.subsColorDesc')}>
                <div className="flex gap-8" role="radiogroup" aria-label={t('app.settings.subsColorAria')}>
                  {(
                    [
                      { value: 'ink', bg: 'var(--ink)', labelKey: 'app.settings.colorInk' },
                      { value: 'cyan', bg: 'var(--cyan)', labelKey: 'app.settings.colorCyan' },
                      { value: 'yellow', bg: '#FFE14D', labelKey: 'app.settings.colorYellow' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={prefs.subtitleColor === c.value}
                      aria-label={t('app.settings.subsColorOptionAria', { color: t(c.labelKey) })}
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
              <SettingRow label={t('app.settings.bottomOffset')} desc={t('app.settings.bottomOffsetDesc')}>
                <SliderControl
                  label={t('app.settings.bottomOffsetAria')}
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
                    {t('app.player.stylePreview')}
                  </motion.span>
                )}
                {!settings.subtitles.enabled && (
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-caption text-muted">
                    {t('app.settings.previewDisabled')}
                  </span>
                )}
              </div>
            </GlassPanel>
          </section>

          {/* ── S4 Addons ── */}
          <section id="addons" className="scroll-mt-96">
            <GlassPanel level={2} className="p-24">
              <h2 className="font-display text-title text-ink">{t('app.settings.navAddons')}</h2>
              <SettingRow label={t('app.settings.timeout')} desc={t('app.settings.timeoutDesc')}>
                <SliderControl
                  label={t('app.settings.timeoutAria')}
                  value={prefs.addonTimeoutMs}
                  min={2000}
                  max={10000}
                  step={500}
                  onChange={(v) => prefs.patch({ addonTimeoutMs: v })}
                  format={(v) => `${(v / 1000).toFixed(1)}s`}
                />
              </SettingRow>
              <SettingRow
                label={t('app.settings.circuit')}
                desc={t('app.settings.circuitDesc')}
              >
                <Segmented
                  label={t('app.settings.circuitAria')}
                  value={prefs.circuitSensitivity}
                  options={[
                    { value: 'relaxed', label: t('app.settings.circuitRelaxed') },
                    { value: 'balanced', label: t('app.settings.circuitBalanced') },
                    { value: 'strict', label: t('app.settings.circuitStrict') },
                  ]}
                  onChange={(v) => prefs.patch({ circuitSensitivity: v })}
                />
              </SettingRow>
              <div className="pt-16">
                <ButtonNeon to="/app/addons">
                  <Puzzle size={16} strokeWidth={1.75} />
                  {t('app.settings.openManager')}
                </ButtonNeon>
              </div>
            </GlassPanel>
          </section>

          {/* ── S4b Privacy ── */}
          <section id="privacy" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-4 p-24">
              <h2 className="font-display text-title text-ink">{t('app.settings.navPrivacy')}</h2>
              <SettingRow
                label={t('app.settings.incognito')}
                desc={t('app.settings.incognitoDesc')}
              >
                <EliteSwitch
                  checked={historyPaused}
                  onChange={(v) => {
                    setHistoryPaused(v);
                    toast(v ? t('app.settings.toastIncognitoOn') : t('app.settings.toastIncognitoOff'));
                  }}
                  label={t('app.settings.incognitoToggle')}
                />
              </SettingRow>
              <SettingRow
                label={t('app.settings.addonVisibility')}
                desc={t('app.settings.addonVisibilityDesc')}
              >
                <span className="font-mono text-[11px] uppercase text-ok">{t('app.settings.enforcedBadge')}</span>
              </SettingRow>

              <div className="mt-8 flex flex-col gap-10 border-t border-white/[.06] pt-16">
                <div className="flex items-center justify-between gap-12">
                  <div className="flex flex-col gap-2">
                    <span className="text-caption text-ink">{t('app.settings.errorLogTitle')}</span>
                    <span className="text-caption text-muted">
                      {t('app.settings.errorLogDesc')}
                    </span>
                  </div>
                  <div className="flex gap-8">
                    <ButtonGhost onClick={() => setErrorEntries(readErrorLog())}>
                      {t('app.settings.refresh')}
                    </ButtonGhost>
                    <ButtonGhost
                      onClick={() => {
                        clearErrorLog();
                        setErrorEntries([]);
                        toast(t('app.settings.toastLogCleared'));
                      }}
                      className="text-error hover:text-error"
                    >
                      {t('app.settings.clear')}
                    </ButtonGhost>
                  </div>
                </div>
                {(errorEntries ?? []).length === 0 ? (
                  <span className="font-mono text-[11px] text-muted">{t('app.settings.errorLogEmpty')}</span>
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
              <h2 className="font-display text-title text-ink">{t('app.settings.navStorage')}</h2>
              <div className="flex flex-col gap-8">
                <div className="flex items-baseline justify-between">
                  <span className="text-caption text-muted">{t('app.settings.dataOnDevice')}</span>
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
                    ? `${t('app.settings.estimateLine', {
                        used: (estimate.usage / 1048576).toFixed(1),
                        quota: (estimate.quota / 1073741824).toFixed(1),
                      })}${storagePct !== null ? ` (${storagePct.toFixed(2)}%)` : ''}`
                    : t('app.settings.estimateUnavailable')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-12">
                <ButtonGhost
                  onClick={() => {
                    refreshStorage();
                    toast(t('app.settings.toastMeasured'));
                  }}
                >
                  <RefreshCw size={14} strokeWidth={1.75} />
                  {t('app.settings.reMeasure')}
                </ButtonGhost>
                <ButtonGhost onClick={() => setClearOpen(true)} className="text-error hover:text-error">
                  <Trash2 size={14} strokeWidth={1.75} />
                  {t('app.settings.clearAllData')}
                </ButtonGhost>
              </div>
            </GlassPanel>
          </section>

          {/* ── S7 Diagnostics ── */}
          <section id="diagnostics" className="scroll-mt-96">
            <GlassPanel level={2} className="flex flex-col gap-16 p-24">
              <div className="flex flex-wrap items-center gap-16">
                <h2 className="font-display text-title text-ink">{t('app.settings.navDiagnostics')}</h2>
                <div className="ml-auto flex items-center gap-8">
                  {diag && !diagRunning && (
                    <ButtonGhost onClick={copyDiagnostics}>
                      <Copy size={14} strokeWidth={1.75} />
                      {t('app.settings.copyReport')}
                    </ButtonGhost>
                  )}
                  <ButtonPrimary onClick={() => void runDiagnostics()} className={diagRunning ? 'opacity-50 pointer-events-none' : ''}>
                    <Gauge size={16} strokeWidth={1.75} />
                    {diagRunning ? t('app.settings.running') : diag ? t('app.settings.rerunDiag') : t('app.settings.runDiag')}
                  </ButtonPrimary>
                </div>
              </div>
              {diag === null ? (
                <p className="text-caption text-muted">
                  {t('app.settings.diagIdle')}
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
              <h2 className="font-display text-title text-ink">{t('app.settings.navConfiguration')}</h2>
              <SettingRow label={t('app.settings.exportConfig')} desc={t('app.settings.exportConfigDesc')}>
                <ButtonPrimary onClick={doExport}>
                  <Download size={16} strokeWidth={1.75} />
                  {t('app.settings.export')}
                </ButtonPrimary>
              </SettingRow>
              <SettingRow label={t('app.settings.importConfig')} desc={t('app.settings.importConfigDesc')}>
                <ButtonNeon onClick={() => fileRef.current?.click()}>
                  <Upload size={16} strokeWidth={1.75} />
                  {t('app.settings.import')}
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
                <SettingRow label={t('app.settings.resetRow')} desc={t('app.settings.resetRowDesc')}>
                  <ButtonDanger onClick={() => setResetOpen(true)}>{t('app.settings.reset')}</ButtonDanger>
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
                  <span className="text-caption text-muted">{t('app.settings.aboutTagline')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                <span className="text-micro uppercase text-muted">{t('app.settings.licenses')}</span>
                {OPEN_CONTENT_CREDITS.map((line) => (
                  <span key={line} className="text-caption text-muted">
                    {line}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-4 border-t border-white/[.06] pt-16">
                <span className="text-caption text-muted">
                  {t('app.settings.aboutPlatforms')}
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
      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title={t('app.settings.clearTitle')}>
        <div className="flex flex-col gap-16">
          <p className="text-caption text-muted">
            {t('app.settings.clearBody')}
          </p>
          <div className="flex justify-end gap-12">
            <ButtonGhost onClick={() => setClearOpen(false)}>{t('app.profiles.cancel')}</ButtonGhost>
            <ButtonDanger
              onClick={() => {
                resetAll();
                setClearOpen(false);
                refreshStorage();
                toast(t('app.settings.toastDataCleared'));
                navigate('/app/onboarding');
              }}
            >
              {t('app.settings.clearEverything')}
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
        title={t('app.settings.resetRow')}
      >
        <div className="flex flex-col gap-16">
          <p className="text-caption text-muted">
            {t('app.settings.resetBody1')}{' '}
            <span className="font-mono text-error">RESET</span>{' '}
            {t('app.settings.resetBody2')}
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
              {t('app.profiles.cancel')}
            </ButtonGhost>
            <ButtonDanger
              className={resetText !== 'RESET' ? 'opacity-50 pointer-events-none' : ''}
              onClick={() => {
                resetAll();
                setResetOpen(false);
                setResetText('');
                toast(t('app.settings.toastReset'));
                navigate('/app/onboarding');
              }}
            >
              {t('app.settings.resetEverything')}
            </ButtonDanger>
          </div>
        </div>
      </Modal>
    </div>
  );
}
