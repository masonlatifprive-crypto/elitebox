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
  ArrowDown,
  ArrowUp,
  Clapperboard,
  Flag,
  GripVertical,
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
import { addonBlockReason, addonEngine, addonTorrentHint } from '@/lib/addons/engine';
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

async function fetchManifestPreview(url: string): Promise<ManifestPreview> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('That is not a valid URL. Include the full https:// address.');
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('Only http/https manifest URLs are supported.');
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(url, { signal: ctrl.signal });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.name === 'AbortError'
        ? `No response from ${parsed.host} within 8s — host unreachable or too slow.`
        : `Could not reach ${parsed.host}. Check the URL and your connection.`,
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Host responded HTTP ${res.status} — no manifest at that URL.`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error('The URL responded, but the body is not valid JSON.');
  }
  const m = json as {
    id?: unknown; name?: unknown; version?: unknown; description?: unknown;
    logo?: unknown; icon?: unknown; resources?: unknown; catalogs?: unknown;
    permissions?: unknown;
    privacy?: { receivesUserId?: boolean; receivesWatchHistory?: boolean; receivesRegion?: boolean };
    legal?: { copyrightSafe?: boolean; contentRightsDeclared?: boolean; allowsCopyrightedPiracy?: boolean };
  };
  if (typeof m.id !== 'string' || !m.id || typeof m.name !== 'string' || !m.name) {
    throw new Error('Invalid manifest: missing required "id" or "name" fields.');
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
      const manifest = await fetchManifestPreview(url.trim());
      setPhase({ kind: 'preview', manifest });
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const install = async (manifest: ManifestPreview) => {
    setPhase({ kind: 'installing', manifest });
    try {
      const info = await addonEngine.install(manifest.url);
      toast(`Addon installed: ${info.name}`);
      onClose();
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const preview = phase.kind === 'preview' || phase.kind === 'installing' ? phase.manifest : undefined;

  return (
    <Modal open={open} onClose={onClose} title="Install addon by URL">
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
              Paste an addon manifest URL (JSON). Elitebox validates it, shows exactly what it can
              do, then installs.
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
              <ButtonGhost onClick={onClose}>Cancel</ButtonGhost>
              <ButtonPrimary onClick={() => void fetchPreview()} className={!url.trim() || phase.kind === 'fetching' ? 'opacity-50 pointer-events-none' : ''}>
                {phase.kind === 'fetching' ? 'Fetching…' : 'Validate manifest'}
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
              <span className="text-micro uppercase text-muted">Resources it provides</span>
              <div className="flex flex-wrap gap-8">
                {preview.resources.length === 0 ? (
                  <span className="text-caption text-muted">None declared</span>
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
                      {c.searchable ? ' · searchable' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-8">
              <span className="text-micro uppercase text-muted">Permissions, in plain language</span>
              {[
                `Fetches catalogs, metadata and streams from ${preview.origin} only.`,
                'Every request runs with a timeout and an automatic circuit breaker.',
                'Can be disabled, reordered or removed at any time from this page.',
                preview.permissions.length > 0
                  ? `Declares ${preview.permissions.length} permission${preview.permissions.length === 1 ? '' : 's'}: ${preview.permissions.join(', ')}.`
                  : 'Declares no special permissions.',
                preview.privacy &&
                (preview.privacy.receivesUserId || preview.privacy.receivesWatchHistory || preview.privacy.receivesRegion)
                  ? `Privacy: this addon may receive ${
                      [
                        preview.privacy.receivesUserId && 'your user id',
                        preview.privacy.receivesWatchHistory && 'your watch history',
                        preview.privacy.receivesRegion && 'your region',
                      ]
                        .filter(Boolean)
                        .join(', ')
                    }. Elitebox never sends identity or history to addon endpoints regardless.`
                  : 'Privacy: declares no access to your identity, watch history or region.',
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
                      ? 'Legal declaration: this addon states it may serve copyrighted content without rights — install at your own risk. Elitebox blocks known piracy addons outright.'
                      : preview.legal.copyrightSafe || preview.legal.contentRightsDeclared
                        ? 'Legal declaration: the addon states its content is copyright-safe and rights are declared.'
                        : 'Legal declaration: the addon declares no content-rights status.'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-8 rounded-lg border border-warn/40 bg-warn/10 px-12 py-10">
              <ShieldAlert size={16} strokeWidth={1.75} className="mt-2 shrink-0 text-warn" />
              <span className="text-caption text-ink">
                Community addon — not verified by Elitebox. Known piracy sources are blocked
                automatically; anything else installs at your discretion.
                {preview.torrentHint &&
                  ' This manifest mentions torrent-style sourcing — only install it if you know it serves content you have the legal right to access.'}
              </span>
            </div>

            <div className="flex justify-end gap-12">
              <ButtonGhost onClick={() => setPhase({ kind: 'input' })}>Back</ButtonGhost>
              <ButtonPrimary
                onClick={() => void install(preview)}
                className={phase.kind === 'installing' ? 'opacity-50 pointer-events-none' : ''}
              >
                {phase.kind === 'installing' ? 'Installing…' : 'Install'}
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
              <span className="rounded-full bg-signature px-8 py-1 text-micro uppercase text-deep">Built-in</span>
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
              BENCHED {health.retryInSec ?? 0}s
            </span>
          ) : (
            health && (
              <span className="font-mono text-[11px] text-muted">
                circuit {health.circuit}
              </span>
            )
          )}
        </div>

        <EliteSwitch
          checked={enabled}
          onChange={(v) => {
            addonEngine.setEnabled(addon.id, v);
            toast(v ? `${addon.name} enabled` : `${addon.name} disabled`);
          }}
          label={`${enabled ? 'Disable' : 'Enable'} ${addon.name}`}
        />
      </div>

      {/* second line: mobile health + actions */}
      <div className="flex flex-wrap items-center gap-12 border-t border-white/[.06] pt-12">
        <div className="flex items-center gap-12 md:hidden">
          {health && <HealthDot status={health.status} latencyMs={health.latencyMs} />}
          {health && <SuccessBar rate={health.successRate} />}
          {benched && (
            <span className="font-mono text-[11px] text-error">BENCHED {health.retryInSec ?? 0}s</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={`Move ${addon.name} up`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="focusable glass-1 flex h-32 w-32 items-center justify-center rounded-full text-muted hover:text-cyan cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowUp size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={`Move ${addon.name} down`}
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
                if (h.status === 'ok') toast(`${addon.name} recovered — probe ok`);
                else toast.error(`${addon.name} probe failed, still ${h.status}`);
              });
            }}
            className="px-16 py-6 text-micro"
          >
            {recovering ? 'Probing…' : 'Recover now'}
          </ButtonNeon>
        )}
        <div className="ml-auto flex items-center gap-4">
          {!addon.builtin && (
            <span
              className="font-mono text-[11px] text-muted"
              title="Reliability score from real probe telemetry (success rate + circuit state)"
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
                toast('Report noted — stored on this device for review');
              }}
              className="text-muted hover:text-warn"
              aria-label={`Report an issue with ${addon.name}`}
            >
              <Flag size={14} strokeWidth={1.75} />
              Report
            </ButtonGhost>
          )}
          {addon.builtin ? (
            <span className="text-micro uppercase text-muted" title="The Showcase addon is bundled with Elitebox">
              Bundled — cannot remove
            </span>
          ) : (
            <ButtonGhost onClick={onRemove} className="text-error hover:text-error">
              <Trash2 size={14} strokeWidth={1.75} />
              Remove
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
    name: 'Cinema catalogs',
    text: 'Community movie and series indexes install instantly from a manifest URL.',
  },
  {
    icon: '/art/addon-icon-live.jpg',
    glyph: Tv,
    name: 'Live TV sources',
    text: 'IPTV and broadcast addons plug in the same way — one JSON manifest.',
  },
  {
    icon: '/art/addon-icon-archive.jpg',
    glyph: Archive,
    name: 'Archives & classics',
    text: 'Public-domain and open-license archives, health-checked like everything else.',
  },
  {
    icon: '/art/addon-icon-radio.jpg',
    glyph: Radio,
    name: 'Radio & audio',
    text: 'Stream addons can serve audio-only stations alongside video.',
  },
  {
    icon: '/art/addon-icon-docs.jpg',
    glyph: FileText,
    name: 'Build your own',
    text: 'Four resources — catalog, meta, stream, subtitles — documented openly.',
  },
];

/* ── page ──────────────────────────────────────────────────────────────── */

export default function AddonsPage() {
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
      toast(targets.length === 0 ? 'Health snapshot refreshed' : `Re-checked ${targets.length} addon${targets.length > 1 ? 's' : ''}`);
    }
  }, [installed]);

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
        <h1 className="font-display text-display-xl text-ink max-md:text-[2.25rem]">Addons</h1>
        <div className="ml-auto flex items-center gap-12">
          <ButtonPrimary onClick={() => setInstallOpen(true)}>Install by URL</ButtonPrimary>
          <ButtonNeon to="/store">
            <Store size={16} strokeWidth={1.75} />
            Browse Store
          </ButtonNeon>
        </div>
      </motion.div>

      {/* ── S1 health overview strip ── */}
      <GlassPanel level={2} className="flex flex-wrap items-center gap-24 px-24 py-16">
        <div className="flex items-center gap-8">
          <span className="h-8 w-8 rounded-full bg-ok shadow-[0_0_8px_rgba(124,217,236,.7)]" />
          <span className="font-display text-title text-ink">{overview.healthy}</span>
          <span className="text-micro uppercase text-muted">Healthy</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="h-8 w-8 rounded-full bg-warn shadow-[0_0_8px_rgba(255,184,77,.7)]" />
          <span className="font-display text-title text-ink">{overview.degraded}</span>
          <span className="text-micro uppercase text-muted">Degraded</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="h-8 w-8 rounded-full bg-error shadow-[0_0_8px_rgba(255,77,109,.7)]" />
          <span className="font-display text-title text-ink">{overview.benched}</span>
          <span className="text-micro uppercase text-muted">Benched</span>
        </div>
        <div className="flex items-center gap-8">
          <Activity size={16} strokeWidth={1.75} className="text-cyan" />
          <span className="font-mono text-caption text-ink">
            {overview.avg !== undefined ? `${overview.avg}ms` : '—'}
          </span>
          <span className="text-micro uppercase text-muted">Avg latency</span>
        </div>
        <div className="ml-auto flex items-center gap-12">
          <span className="font-mono text-[11px] text-muted">
            last check {new Date(lastCheck).toLocaleTimeString()}
          </span>
          <ButtonGhost onClick={() => void recheckAll()} className={rechecking ? 'opacity-50 pointer-events-none' : ''}>
            <RefreshCw size={14} strokeWidth={1.75} className={rechecking ? 'animate-spin' : ''} />
            {rechecking ? 'Probing…' : 'Re-check all'}
          </ButtonGhost>
        </div>
      </GlassPanel>

      {/* ── S3 installed list ── */}
      <section className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-title text-ink">Installed</h2>
          <p className="text-caption text-muted">
            Order decides catalog priority — the top addon answers first. Use the arrows to rearrange.
          </p>
        </div>
        {installed.length === 0 ? (
          <EmptyState
            icon={Puzzle}
            title="No addons installed."
            caption="Addons bring catalogs, metadata and streams. Install one from a manifest URL."
            action={<ButtonPrimary onClick={() => setInstallOpen(true)}>Install by URL</ButtonPrimary>}
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

      {/* ── S4 directory ── */}
      <section className="flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-title text-ink">Directory</h2>
          <p className="max-w-[68ch] text-caption text-muted">
            Elitebox ships with the built-in Showcase catalog. Everything else is community-made and
            installs from a manifest URL — validated and permission-previewed before it ever runs.
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
                  Built-in
                </span>
              </div>
            </div>
            <p className="text-caption text-muted">
              Open-content catalog — Blender Studio films, Caminandes and open live channels. Works
              fully offline.
            </p>
            <span className="text-micro uppercase text-ok">Installed · always available</span>
          </motion.div>

          {DIRECTORY_SLOTS.map((slot, i) => (
            <motion.div
              key={slot.name}
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
                  <span className="text-caption font-semibold text-ink">{slot.name}</span>
                  <slot.glyph size={16} strokeWidth={1.75} className="text-cyan" />
                </div>
              </div>
              <p className="text-caption text-muted">{slot.text}</p>
              <ButtonNeon onClick={() => setInstallOpen(true)} className="w-fit px-16 py-8 text-micro">
                Install by URL
              </ButtonNeon>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── S5 protocol strip ── */}
      <p className="glass-2 rounded-xl px-16 py-12 font-mono text-caption text-muted">
        One JSON manifest · four resources · documented openly.{' '}
        <span className="text-cyan">Every addon is health-checked.</span>
      </p>

      {/* ── install modal ── */}
      <InstallModal open={installOpen} onClose={() => setInstallOpen(false)} />

      {/* ── remove confirm ── */}
      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={removeTarget ? `Remove ${removeTarget.name}?` : undefined}
      >
        <div className="flex flex-col gap-16">
          <p className="text-caption text-muted">
            The addon is uninstalled from this profile. Its catalogs and streams disappear
            immediately; reinstalling takes one manifest URL.
          </p>
          <div className="flex justify-end gap-12">
            <ButtonGhost onClick={() => setRemoveTarget(null)}>Keep it</ButtonGhost>
            <ButtonDanger
              onClick={() => {
                if (removeTarget) {
                  addonEngine.remove(removeTarget.id);
                  toast(`Removed ${removeTarget.name}`);
                }
                setRemoveTarget(null);
              }}
            >
              Remove addon
            </ButtonDanger>
          </div>
        </div>
      </Modal>
    </div>
  );
}
