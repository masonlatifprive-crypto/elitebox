/**
 * Addons — `/app/addons` (design addons.md).
 * The Addon Manager: install by manifest URL with permission preview,
 * enable/disable, reorder, remove with confirm, and the live Addon Health
 * Monitor (latency, success rate, circuit breaker with BENCHED countdown +
 * Recover). Directory section is honest: the builtin Showcase plus category
 * slots explaining that community addons install via manifest URL.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Clapperboard,
  Flag,
  GripVertical,
  Loader2,
  Puzzle,
  Radio,
  RefreshCw,
  Archive,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Tv,
} from 'lucide-react';
import { addonBlockReason, addonEngine, addonTorrentHint, manifestUrlForTransport } from '@/lib/addons/engine';
import type { OfficialAddonEntry } from '@/lib/addons/engine';
import { useReports } from '@/lib/reports';
import { useAddons } from '@/lib/store';
import type { AddonHealth, AddonInfo } from '@/lib/types';
import {
  ButtonDanger,
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  EmptyState,
  GlassPanel,
  HealthDot,
  Modal,
  spring,
  toast,
} from '@/components/ui-elite';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
import { cn } from '@/lib/utils';

/* ── icon path repair: scaffold manifest uses .png, shipped art is .jpg ── */

function iconSrc(icon: string): string {
  if (icon.startsWith('/art/addon-icon-')) return icon.replace(/\.png$/, '.jpg');
  return icon;
}

/* ── enable switch (spring thumb, focusable) ───────────────────────────── */

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
        className={cn(
          'absolute top-2 h-20 w-20 rounded-full bg-white shadow',
          checked ? 'right-2' : 'left-2',
        )}
      />
    </button>
  );
}

/* ── success-rate mini bar ─────────────────────────────────────────────── */

function SuccessBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  return (
    <span className="flex items-center gap-8" title={`${pct}% success`}>
      <span className="h-4 w-40 overflow-hidden rounded-full bg-white/[.08]">
        <span
          className={cn('block h-full rounded-full', pct >= 90 ? 'bg-ok' : pct >= 60 ? 'bg-warn' : 'bg-error')}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="font-mono text-[11px] text-muted">{pct}%</span>
    </span>
  );
}

/* ── install-by-URL modal ──────────────────────────────────────────────── */

interface ManifestPreview {
  url: string;
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  resources: string[];
  origin: string;
  catalogs: Array<{ id: string; type: string; name?: string; searchable: boolean }>;
  permissions: string[];
  privacy?: { receivesUserId?: boolean; receivesWatchHistory?: boolean; receivesRegion?: boolean };
  legal?: { copyrightSafe?: boolean; contentRightsDeclared?: boolean; allowsCopyrightedPiracy?: boolean };
  torrentHint: boolean;
}

type InstallPhase =
  | { kind: 'input' }
  | { kind: 'fetching' }
  | { kind: 'preview'; manifest: ManifestPreview }
  | { kind: 'installing'; manifest: ManifestPreview }
  | { kind: 'error'; message: string };

async function fetchManifestPreview(url: string, t: TFunction): Promise<ManifestPreview> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(t('app.addons.errInvalidUrl'));
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(t('app.addons.errHttpOnly'));
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(url, { signal: ctrl.signal });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.name === 'AbortError'
        ? t('app.addons.errTimeout', { host: parsed.host })
        : t('app.addons.errUnreachable', { host: parsed.host }),
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(t('app.addons.errHttpStatus', { status: res.status }));
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(t('app.addons.errNotJson'));
  }
  const m = json as {
    id?: unknown; name?: unknown; version?: unknown; description?: unknown;
    logo?: unknown; icon?: unknown; resources?: unknown; catalogs?: unknown;
    permissions?: unknown;
    privacy?: { receivesUserId?: boolean; receivesWatchHistory?: boolean; receivesRegion?: boolean };
    legal?: { copyrightSafe?: boolean; contentRightsDeclared?: boolean; allowsCopyrightedPiracy?: boolean };
  };
  if (typeof m.id !== 'string' || !m.id || typeof m.name !== 'string' || !m.name) {
    throw new Error(t('app.addons.errInvalidManifest'));
  }
  const blocked = addonBlockReason(url, m.id, m.name);
  if (blocked) throw new Error(blocked);
  const resources = Array.isArray(m.resources)
    ? m.resources
        .map((r) => (typeof r === 'string' ? r : ((r as { name?: unknown })?.name as string | undefined) ?? ''))
        .filter(Boolean)
    : [];
  const catalogs = (Array.isArray(m.catalogs) ? m.catalogs : [])
    .map((c): ManifestPreview['catalogs'][number] | undefined => {
      if (!c || typeof c !== 'object') return undefined;
      const cc = c as { id?: unknown; type?: unknown; name?: unknown; extra?: unknown; extraSupported?: unknown };
      if (typeof cc.id !== 'string' || typeof cc.type !== 'string') return undefined;
      const extras = [
        ...(Array.isArray(cc.extra) ? cc.extra : []),
        ...(Array.isArray(cc.extraSupported) ? cc.extraSupported : []),
      ].map((e) => (typeof e === 'string' ? e : ((e as { name?: unknown })?.name as string | undefined) ?? ''));
      return {
        id: cc.id,
        type: cc.type,
        name: typeof cc.name === 'string' ? cc.name : undefined,
        searchable: extras.includes('search'),
      };
    })
    .filter((c): c is ManifestPreview['catalogs'][number] => Boolean(c));
  return {
    url,
    id: m.id,
    name: m.name,
    version: typeof m.version === 'string' ? m.version : '0.0.0',
    description: typeof m.description === 'string' ? m.description : '',
    icon: typeof m.logo === 'string' ? m.logo : typeof m.icon === 'string' ? m.icon : '/art/addon-icon-cinema.jpg',
    resources,
    origin: parsed.origin,
    catalogs,
    permissions: Array.isArray(m.permissions)
      ? m.permissions.filter((p): p is string => typeof p === 'string')
      : [],
    privacy: m.privacy && typeof m.privacy === 'object' ? m.privacy : undefined,
    legal: m.legal && typeof m.legal === 'object' ? m.legal : undefined,
    torrentHint: addonTorrentHint(url, m.id, m.name, typeof m.description === 'string' ? m.description : ''),
  };
}

function InstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<InstallPhase>({ kind: 'input' });

  useEffect(() => {
    if (open) {
      setUrl('');
      setPhase({ kind: 'input' });
    }
  }, [open]);

  const fetchPreview = async () => {
    setPhase({ kind: 'fetching' });
    try {
      const manifest = await fetchManifestPreview(url.trim(), t);
      setPhase({ kind: 'preview', manifest });
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const install = async (manifest: ManifestPreview) => {
    setPhase({ kind: 'installing', manifest });
    try {
      const info = await addonEngine.install(manifest.url);
      toast(t('app.addons.toastInstalled', { name: info.name }));
      onClose();
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const preview = phase.kind === 'preview' || phase.kind === 'installing' ? phase.manifest : undefined;

  return (
    <Modal open={open} onClose={onClose} title={t('app.addons.installTitle')}>
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-16"
          >
            <p className="text-caption text-muted">
              {t('app.addons.installIntro')}
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim()) void fetchPreview();
              }}
              placeholder="https://…/manifest.json"
              spellCheck={false}
              className={cn(
                'focusable glass-1 w-full rounded-lg px-16 py-12 font-mono text-caption text-ink placeholder:text-muted/60 outline-none',
                phase.kind === 'fetching' && 'border-cyan',
                phase.kind === 'error' && 'border-error',
              )}
            />
            {phase.kind === 'error' && (
              <p className="rounded-lg border border-error/40 bg-error/10 px-12 py-8 font-mono text-[12px] text-error">
                {phase.message}
              </p>
            )}
            <div className="flex justify-end gap-12">
              <ButtonGhost onClick={onClose}>{t('app.addons.cancel')}</ButtonGhost>
              <ButtonPrimary onClick={() => void fetchPreview()} className={!url.trim() || phase.kind === 'fetching' ? 'opacity-50 pointer-events-none' : ''}>
                {phase.kind === 'fetching' ? t('app.addons.fetching') : t('app.addons.validate')}
              </ButtonPrimary>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-16"
          >
            <div className="flex items-center gap-16">
              <img
                src={iconSrc(preview.icon)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/art/addon-icon-cinema.jpg';
                }}
                alt=""
                className="h-56 w-56 rounded-lg object-cover ring-1 ring-white/[.08]"
              />
              <div className="flex min-w-0 flex-col gap-4">
                <span className="font-display text-title text-ink line-clamp-1">{preview.name}</span>
                <span className="font-mono text-micro uppercase text-muted">
                  v{preview.version} · {preview.id}
                </span>
              </div>
            </div>
            {preview.description && <p className="text-caption text-muted">{preview.description}</p>}

            <div className="flex flex-col gap-8">
              <span className="text-micro uppercase text-muted">{t('app.addons.resourcesLabel')}</span>
              <div className="flex flex-wrap gap-8">
                {preview.resources.length === 0 ? (
                  <span className="text-caption text-muted">{t('app.addons.noneDeclared')}</span>
                ) : (
                  preview.resources.map((r) => (
                    <span key={r} className="glass-1 rounded-full px-12 py-4 text-micro uppercase text-cyan">
                      {r}
                    </span>
                  ))
                )}
              </div>
              {preview.catalogs.length > 0 && (
                <div className="flex flex-wrap gap-8">
                  {preview.catalogs.map((c) => (
                    <span
                      key={`${c.type}/${c.id}`}
                      className="rounded-full border border-white/[.08] px-12 py-4 font-mono text-[11px] text-muted"
                    >
                      {c.type}/{c.id}
                      {c.searchable ? ` · ${t('app.addons.searchableTag')}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-8">
              <span className="text-micro uppercase text-muted">{t('app.addons.permissionsLabel')}</span>
              {[
                t('app.addons.permOrigin', { origin: preview.origin }),
                t('app.addons.permBreaker'),
                t('app.addons.permRemovable'),
                preview.permissions.length > 0
                  ? t('app.addons.permDeclares', { count: preview.permissions.length, list: preview.permissions.join(', ') })
                  : t('app.addons.permDeclaresNone'),
                preview.privacy &&
                (preview.privacy.receivesUserId || preview.privacy.receivesWatchHistory || preview.privacy.receivesRegion)
                  ? t('app.addons.privacyReceives', {
                      items: [
                        preview.privacy.receivesUserId && t('app.addons.privacyUserId'),
                        preview.privacy.receivesWatchHistory && t('app.addons.privacyHistory'),
                        preview.privacy.receivesRegion && t('app.addons.privacyRegion'),
                      ]
                        .filter(Boolean)
                        .join(', '),
                    })
                  : t('app.addons.privacyNone'),
              ].map((line) => (
                <div key={line} className="flex items-start gap-8">
                  <ShieldCheck size={16} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                  <span className="text-caption text-ink">{line}</span>
                </div>
              ))}
              {preview.legal && (
                <div className="flex items-start gap-8">
                  <ShieldCheck size={16} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                  <span className="text-caption text-ink">
                    {preview.legal.allowsCopyrightedPiracy
                      ? t('app.addons.legalPiracy')
                      : preview.legal.copyrightSafe || preview.legal.contentRightsDeclared
                        ? t('app.addons.legalSafe')
                        : t('app.addons.legalNone')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-8 rounded-lg border border-warn/40 bg-warn/10 px-12 py-10">
              <ShieldAlert size={16} strokeWidth={1.75} className="mt-2 shrink-0 text-warn" />
              <span className="text-caption text-ink">
                {t('app.addons.communityWarn')}
                {preview.torrentHint && ` ${t('app.addons.communityTorrentWarn')}`}
              </span>
            </div>

            <div className="flex justify-end gap-12">
              <ButtonGhost onClick={() => setPhase({ kind: 'input' })}>{t('app.addons.back')}</ButtonGhost>
              <ButtonPrimary
                onClick={() => void install(preview)}
                className={phase.kind === 'installing' ? 'opacity-50 pointer-events-none' : ''}
              >
                {phase.kind === 'installing' ? t('app.addons.installing') : t('app.addons.install')}
              </ButtonPrimary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

/* ── installed addon row ───────────────────────────────────────────────── */

function AddonRow({
  addon,
  health,
  index,
  total,
  onMove,
  onRemove,
}: {
  addon: AddonInfo;
  health: AddonHealth | undefined;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { t } = useT();
  const enabled = useAddons((s) => Boolean(s.enabled[addon.id]));
  const [recovering, setRecovering] = useState(false);
  const benched = health?.circuit === 'open';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={spring.smooth}
      className={cn('glass-2 flex flex-col gap-12 rounded-xl p-16', !enabled && 'opacity-55')}
    >
      <div className="flex items-center gap-16">
        <GripVertical size={18} strokeWidth={1.75} className="shrink-0 text-muted/50" aria-hidden />
        <img
          src={iconSrc(addon.icon)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/art/addon-icon-cinema.jpg';
          }}
          alt=""
          className="h-40 w-40 shrink-0 rounded-lg object-cover ring-1 ring-white/[.08]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-8">
            <span className="text-caption font-semibold text-ink">{addon.name}</span>
            <span className="font-mono text-micro text-muted">v{addon.version}</span>
            {addon.builtin && (
              <span className="rounded-full bg-signature px-8 py-1 text-micro uppercase text-deep">{t('app.addons.builtIn')}</span>
            )}
          </div>
          <span className="text-caption text-muted line-clamp-2">{addon.description}</span>
          <div className="flex flex-wrap gap-6">
            {addon.resources.map((r) => (
              <span key={r} className="glass-1 rounded-full px-8 py-1 text-micro uppercase text-muted">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* health cluster */}
        <div className="flex shrink-0 flex-col items-end gap-6 max-md:hidden">
          {health && <HealthDot status={health.status} latencyMs={health.latencyMs} />}
          {health && <SuccessBar rate={health.successRate} />}
          {benched ? (
            <span className="font-mono text-[11px] text-error">
              {t('app.addons.benchedTag', { s: health.retryInSec ?? 0 })}
            </span>
          ) : (
            health && (
              <span className="font-mono text-[11px] text-muted">
                {t('app.addons.circuitTag', { state: health.circuit })}
              </span>
            )
          )}
        </div>

        <EliteSwitch
          checked={enabled}
          onChange={(v) => {
            addonEngine.setEnabled(addon.id, v);
            toast(v ? t('app.addons.toastEnabled', { name: addon.name }) : t('app.addons.toastDisabled', { name: addon.name }));
          }}
          label={t(enabled ? 'app.addons.disableAria' : 'app.addons.enableAria', { name: addon.name })}
        />
      </div>

      {/* second line: mobile health + actions */}
      <div className="flex flex-wrap items-center gap-12 border-t border-white/[.06] pt-12">
        <div className="flex items-center gap-12 md:hidden">
          {health && <HealthDot status={health.status} latencyMs={health.latencyMs} />}
          {health && <SuccessBar rate={health.successRate} />}
          {benched && (
            <span className="font-mono text-[11px] text-error">{t('app.addons.benchedTag', { s: health.retryInSec ?? 0 })}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={t('app.addons.moveUpAria', { name: addon.name })}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="focusable glass-1 flex h-32 w-32 items-center justify-center rounded-full text-muted hover:text-cyan cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowUp size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={t('app.addons.moveDownAria', { name: addon.name })}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="focusable glass-1 flex h-32 w-32 items-center justify-center rounded-full text-muted hover:text-cyan cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowDown size={14} strokeWidth={1.75} />
          </button>
        </div>
        {benched && (
          <ButtonNeon
            onClick={() => {
              setRecovering(true);
              void addonEngine.recover(addon.id).then((h) => {
                setRecovering(false);
                if (h.status === 'ok') toast(t('app.addons.toastRecovered', { name: addon.name }));
                else toast.error(t('app.addons.toastProbeFailed', { name: addon.name, status: h.status }));
              });
            }}
            className="px-16 py-6 text-micro"
          >
            {recovering ? t('app.detail.probing') : t('app.addons.recoverNow')}
          </ButtonNeon>
        )}
        <div className="ml-auto flex items-center gap-4">
          {!addon.builtin && (
            <span
              className="font-mono text-[11px] text-muted"
              title={t('app.addons.relTitle')}
            >
              REL {addonEngine.reliability(addon.id)}
            </span>
          )}
          {!addon.builtin && (
            <ButtonGhost
              onClick={() => {
                useReports.getState().addReport({
                  kind: 'addon',
                  subjectId: addon.id,
                  subjectName: addon.name,
                  note: 'User-flagged from the addon manager.',
                });
                toast(t('app.addons.toastReported'));
              }}
              className="text-muted hover:text-warn"
              aria-label={t('app.addons.reportAria', { name: addon.name })}
            >
              <Flag size={14} strokeWidth={1.75} />
              {t('app.addons.report')}
            </ButtonGhost>
          )}
          {addon.builtin ? (
            <span className="text-micro uppercase text-muted" title={t('app.addons.bundledTitle')}>
              {t('app.addons.bundled')}
            </span>
          ) : (
            <ButtonGhost onClick={onRemove} className="text-error hover:text-error">
              <Trash2 size={14} strokeWidth={1.75} />
              {t('app.addons.remove')}
            </ButtonGhost>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── directory slot cards (honest — no fake remote addons) ─────────────── */

const DIRECTORY_SLOTS = [
  {
    icon: '/art/addon-icon-cinema.jpg',
    glyph: Clapperboard,
    nameKey: 'app.addons.dirCinemaName',
    textKey: 'app.addons.dirCinemaText',
  },
  {
    icon: '/art/addon-icon-live.jpg',
    glyph: Tv,
    nameKey: 'app.addons.dirLiveName',
    textKey: 'app.addons.dirLiveText',
  },
  {
    icon: '/art/addon-icon-archive.jpg',
    glyph: Archive,
    nameKey: 'app.addons.dirArchiveName',
    textKey: 'app.addons.dirArchiveText',
  },
  {
    icon: '/art/addon-icon-radio.jpg',
    glyph: Radio,
    nameKey: 'app.addons.dirRadioName',
    textKey: 'app.addons.dirRadioText',
  },
  {
    icon: '/art/addon-icon-docs.jpg',
    glyph: FileText,
    nameKey: 'app.addons.dirBuildName',
    textKey: 'app.addons.dirBuildText',
  },
];

/* ── official community directory (live addon_catalog resource) ────────── */

type OfficialPhase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; addons: OfficialAddonEntry[] };

function OfficialCard({ entry, index }: { entry: OfficialAddonEntry; index: number }) {
  const { t } = useT();
  const installed = useAddons((s) => s.installed.some((a) => a.id === entry.manifest.id));
  const [logoOk, setLogoOk] = useState(Boolean(entry.manifest.logo));
  const [installing, setInstalling] = useState(false);

  const install = async () => {
    setInstalling(true);
    try {
      /* transportUrl is the addon base for some entries and already the
         manifest URL for others — the engine helper resolves both. The same
         blocklist / HTTPS-only rules apply as for install-by-URL. */
      const info = await addonEngine.install(manifestUrlForTransport(entry.transportUrl));
      toast(t('app.addons.toastInstalled', { name: info.name }));
    } catch (err) {
      toast.error(
        t('app.addons.officialInstallFailed', {
          name: entry.manifest.name,
          reason: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      setInstalling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ ...spring.smooth, delay: index * 0.05 }}
      className="glass-2 flex flex-col gap-12 rounded-xl p-16"
    >
      <div className="flex items-center gap-12">
        {logoOk && entry.manifest.logo ? (
          <img
            src={entry.manifest.logo}
            onError={() => setLogoOk(false)}
            alt=""
            className="h-48 w-48 shrink-0 rounded-lg object-cover ring-1 ring-white/[.08]"
          />
        ) : (
          <span className="glass-1 flex h-48 w-48 shrink-0 items-center justify-center rounded-lg">
            <Puzzle size={20} strokeWidth={1.75} className="text-cyan" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-caption font-semibold text-ink line-clamp-1">{entry.manifest.name}</span>
          <span className="font-mono text-micro text-muted">v{entry.manifest.version}</span>
        </div>
      </div>
      {entry.manifest.description && (
        <p className="text-caption text-muted line-clamp-3">{entry.manifest.description}</p>
      )}
      {entry.manifest.resources.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {entry.manifest.resources.map((r) => (
            <span key={r} className="glass-1 rounded-full px-8 py-1 text-micro uppercase text-muted">
              {r}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto pt-4">
        {installed ? (
          <span className="inline-flex items-center gap-6 text-micro uppercase text-ok">
            <Check size={14} strokeWidth={1.75} />
            {t('app.addons.officialInstalled')}
          </span>
        ) : (
          <ButtonNeon
            onClick={() => void install()}
            disabled={installing}
            className="w-fit px-16 py-8 text-micro"
          >
            {installing ? t('app.addons.installing') : t('app.addons.install')}
          </ButtonNeon>
        )}
      </div>
    </motion.div>
  );
}

function OfficialDirectory() {
  const { t } = useT();
  const [phase, setPhase] = useState<OfficialPhase>({ kind: 'loading' });
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setPhase({ kind: 'loading' });
    try {
      const addons = await addonEngine.getAddonCatalog();
      if (aliveRef.current) setPhase({ kind: 'ready', addons });
    } catch (err) {
      if (aliveRef.current) {
        setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-title text-ink">{t('app.addons.officialTitle')}</h2>
        <p className="max-w-[68ch] text-caption text-muted">{t('app.addons.officialNote')}</p>
      </div>

      {phase.kind === 'loading' && (
        <div className="glass-1 flex items-center gap-12 rounded-xl px-16 py-20">
          <Loader2 size={16} strokeWidth={1.75} className="shrink-0 animate-spin text-cyan" />
          <span className="text-caption text-muted">{t('app.addons.officialLoading')}</span>
        </div>
      )}

      {phase.kind === 'error' && (
        <div className="glass-1 flex flex-wrap items-center gap-16 rounded-xl border border-error/40 px-16 py-16">
          <AlertTriangle size={18} strokeWidth={1.75} className="shrink-0 text-error" />
          <div className="flex min-w-200 flex-1 flex-col gap-4">
            <span className="text-caption font-semibold text-ink">{t('app.addons.officialErrorTitle')}</span>
            <span className="text-caption text-muted">{t('app.addons.officialErrorBody')}</span>
            <span className="font-mono text-[11px] text-error line-clamp-1">{phase.message}</span>
          </div>
          <ButtonGhost onClick={() => void load()}>
            <RefreshCw size={14} strokeWidth={1.75} />
            {t('app.addons.officialRetry')}
          </ButtonGhost>
        </div>
      )}

      {phase.kind === 'ready' && phase.addons.length === 0 && (
        <EmptyState
          icon={Puzzle}
          title={t('app.addons.officialEmptyTitle')}
          caption={t('app.addons.officialEmptyCaption')}
          action={
            <ButtonGhost onClick={() => void load()}>
              <RefreshCw size={14} strokeWidth={1.75} />
              {t('app.addons.officialRetry')}
            </ButtonGhost>
          }
        />
      )}

      {phase.kind === 'ready' && phase.addons.length > 0 && (
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {phase.addons.map((entry, i) => (
            <OfficialCard key={entry.manifest.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function AddonsPage() {
  const { t } = useT();
  const installed = useAddons((s) => s.installed);
  const [health, setHealth] = useState<Record<string, AddonHealth>>(() => addonEngine.healthAll());
  const [installOpen, setInstallOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AddonInfo | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<number>(() => Date.now());
  const aliveRef = useRef(true);

  // Live health monitor: read the engine telemetry snapshot continuously so
  // BENCHED countdowns tick; probes themselves happen on re-check / recover.
  useEffect(() => {
    aliveRef.current = true;
    const tick = () => {
      if (aliveRef.current) setHealth(addonEngine.healthAll());
    };
    const fast = setInterval(tick, 1000);
    return () => {
      aliveRef.current = false;
      clearInterval(fast);
    };
  }, [installed]);

  const overview = useMemo(() => {
    const values = installed.map((a) => health[a.id]).filter((h): h is AddonHealth => Boolean(h));
    const healthy = values.filter((h) => h.status === 'ok').length;
    const degraded = values.filter((h) => h.status === 'degraded').length;
    const benched = values.filter((h) => h.circuit === 'open').length;
    const latencies = values.map((h) => h.latencyMs).filter((v): v is number => v !== undefined && v > 0);
    const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : undefined;
    return { healthy, degraded, benched, avg };
  }, [installed, health]);

  const recheckAll = useCallback(async () => {
    setRechecking(true);
    // Probe every remote addon whose circuit is not open. Benched addons stay
    // benched until explicitly recovered — honest circuit semantics.
    const targets = installed.filter((a) => !a.builtin && addonEngine.health(a.id).circuit !== 'open');
    await Promise.all(targets.map((a) => addonEngine.recover(a.id).catch(() => undefined)));
    if (aliveRef.current) {
      setHealth(addonEngine.healthAll());
      setLastCheck(Date.now());
      setRechecking(false);
      toast(targets.length === 0 ? t('app.addons.toastRefreshed') : t('app.addons.toastRechecked', { count: targets.length }));
    }
  }, [installed, t]);

  const move = (index: number, dir: -1 | 1) => {
    const ids = installed.map((a) => a.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    addonEngine.reorder(ids);
  };

  return (
    <div className="flex flex-col gap-32">
      {/* ── S1 header ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center gap-16"
      >
        <h1 className="font-display text-display-xl text-ink max-md:text-[2.25rem]">{t('app.addons.title')}</h1>
        <div className="ml-auto flex items-center gap-12">
          <ButtonPrimary onClick={() => setInstallOpen(true)}>{t('app.addons.installByUrl')}</ButtonPrimary>
          <ButtonNeon to="/store">
            <Store size={16} strokeWidth={1.75} />
            {t('app.addons.browseStore')}
          </ButtonNeon>
        </div>
      </motion.div>

      {/* ── S1 health overview strip ── */}
      <GlassPanel level={2} className="flex flex-wrap items-center gap-24 px-24 py-16">
        <div className="flex items-center gap-8">
          <span className="h-8 w-8 rounded-full bg-ok shadow-[0_0_8px_rgba(124,217,236,.7)]" />
          <span className="font-display text-title text-ink">{overview.healthy}</span>
          <span className="text-micro uppercase text-muted">{t('app.addons.healthy')}</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="h-8 w-8 rounded-full bg-warn shadow-[0_0_8px_rgba(255,184,77,.7)]" />
          <span className="font-display text-title text-ink">{overview.degraded}</span>
          <span className="text-micro uppercase text-muted">{t('app.addons.degraded')}</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="h-8 w-8 rounded-full bg-error shadow-[0_0_8px_rgba(255,77,109,.7)]" />
          <span className="font-display text-title text-ink">{overview.benched}</span>
          <span className="text-micro uppercase text-muted">{t('app.addons.benched')}</span>
        </div>
        <div className="flex items-center gap-8">
          <Activity size={16} strokeWidth={1.75} className="text-cyan" />
          <span className="font-mono text-caption text-ink">
            {overview.avg !== undefined ? `${overview.avg}ms` : '—'}
          </span>
          <span className="text-micro uppercase text-muted">{t('app.addons.avgLatency')}</span>
        </div>
        <div className="ml-auto flex items-center gap-12">
          <span className="font-mono text-[11px] text-muted">
            {t('app.addons.lastCheck', { time: new Date(lastCheck).toLocaleTimeString() })}
          </span>
          <ButtonGhost onClick={() => void recheckAll()} className={rechecking ? 'opacity-50 pointer-events-none' : ''}>
            <RefreshCw size={14} strokeWidth={1.75} className={rechecking ? 'animate-spin' : ''} />
            {rechecking ? t('app.detail.probing') : t('app.addons.recheckAll')}
          </ButtonGhost>
        </div>
      </GlassPanel>

      {/* ── S3 installed list ── */}
      <section className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-title text-ink">{t('app.addons.installed')}</h2>
          <p className="text-caption text-muted">
            {t('app.addons.installedNote')}
          </p>
        </div>
        {installed.length === 0 ? (
          <EmptyState
            icon={Puzzle}
            title={t('app.addons.emptyTitle')}
            caption={t('app.addons.emptyCaption')}
            action={<ButtonPrimary onClick={() => setInstallOpen(true)}>{t('app.addons.installByUrl')}</ButtonPrimary>}
          />
        ) : (
          <div className="flex max-w-4xl flex-col gap-12">
            <AnimatePresence>
              {installed.map((addon, i) => (
                <AddonRow
                  key={addon.id}
                  addon={addon}
                  health={health[addon.id]}
                  index={i}
                  total={installed.length}
                  onMove={(dir) => move(i, dir)}
                  onRemove={() => setRemoveTarget(addon)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── S3b official directory (live) ── */}
      <OfficialDirectory />

      {/* ── S4 directory ── */}
      <section className="flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-title text-ink">{t('app.addons.directory')}</h2>
          <p className="max-w-[68ch] text-caption text-muted">
            {t('app.addons.directoryNote')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {/* builtin showcase card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={spring.smooth}
            className="glass-2 flex flex-col gap-12 rounded-xl p-16"
          >
            <div className="flex items-center gap-12">
              <img
                src="/art/addon-icon-showcase.jpg"
                alt=""
                className="h-48 w-48 rounded-lg object-cover ring-1 ring-white/[.08]"
              />
              <div className="flex flex-col gap-4">
                <span className="text-caption font-semibold text-ink">Elitebox Showcase</span>
                <span className="rounded-full bg-signature px-8 py-1 text-micro uppercase text-deep w-fit">
                  {t('app.addons.builtIn')}
                </span>
              </div>
            </div>
            <p className="text-caption text-muted">
              {t('app.addons.showcaseBody')}
            </p>
            <span className="text-micro uppercase text-ok">{t('app.addons.showcaseStatus')}</span>
          </motion.div>

          {DIRECTORY_SLOTS.map((slot, i) => (
            <motion.div
              key={slot.nameKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ ...spring.smooth, delay: (i + 1) * 0.06 }}
              className="glass-1 flex flex-col gap-12 rounded-xl p-16"
            >
              <div className="flex items-center gap-12">
                <img
                  src={slot.icon}
                  alt=""
                  className="h-48 w-48 rounded-lg object-cover ring-1 ring-white/[.08]"
                />
                <div className="flex flex-col gap-4">
                  <span className="text-caption font-semibold text-ink">{t(slot.nameKey)}</span>
                  <slot.glyph size={16} strokeWidth={1.75} className="text-cyan" />
                </div>
              </div>
              <p className="text-caption text-muted">{t(slot.textKey)}</p>
              <ButtonNeon onClick={() => setInstallOpen(true)} className="w-fit px-16 py-8 text-micro">
                {t('app.addons.installByUrl')}
              </ButtonNeon>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── S5 protocol strip ── */}
      <p className="glass-2 rounded-xl px-16 py-12 font-mono text-caption text-muted">
        {t('app.addons.protocolNote')}{' '}
        <span className="text-cyan">{t('app.addons.protocolHighlight')}</span>
      </p>

      {/* ── install modal ── */}
      <InstallModal open={installOpen} onClose={() => setInstallOpen(false)} />

      {/* ── remove confirm ── */}
      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={removeTarget ? t('app.addons.removeTitle', { name: removeTarget.name }) : undefined}
      >
        <div className="flex flex-col gap-16">
          <p className="text-caption text-muted">
            {t('app.addons.removeBody')}
          </p>
          <div className="flex justify-end gap-12">
            <ButtonGhost onClick={() => setRemoveTarget(null)}>{t('app.addons.keepIt')}</ButtonGhost>
            <ButtonDanger
              onClick={() => {
                if (removeTarget) {
                  addonEngine.remove(removeTarget.id);
                  toast(t('app.addons.toastRemoved', { name: removeTarget.name }));
                }
                setRemoveTarget(null);
              }}
            >
              {t('app.addons.removeAddon')}
            </ButtonDanger>
          </div>
        </div>
      </Modal>
    </div>
  );
}
