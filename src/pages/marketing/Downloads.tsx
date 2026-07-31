/**
 * /downloads — the full platform matrix, stremio-grade, with Premium-gated
 * native builds.
 *
 * Honesty model (do-not-do rules 6/19):
 *  • Web/PWA is live — direct launch.
 *  • Native variants read the companion server's /api/builds manifest when
 *    the API is linked (VITE_API_URL): real size, sha256, staged status.
 *  • Bytes only ever leave the server for an active Premium subscription
 *    via short-lived signed URLs — this page renders that gate faithfully:
 *    locked → subscribe CTA, unstaged → "being packaged", no invented files.
 *  • Demo mode (no API linked) shows the same matrix with the gate logic
 *    intact and an honest note that the build service isn't linked here.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Crown,
  Download,
  FileLock2,
  Globe,
  Loader2,
  Lock,
  Monitor,
  Package,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  Tv,
} from 'lucide-react';
import { API_URL, authToken, useAuth } from '@/lib/auth';
import { ButtonGhost, ButtonPrimary, Eyebrow, GlassPanel, toast } from '@/components/ui-elite';
import { cn } from '@/lib/utils';

/* ── types ─────────────────────────────────────────────────────────────── */

interface BuildEntry {
  id: string;
  platform: string;
  variant: string;
  arch: string;
  version: string;
  notes: string;
  gated: boolean;
  staged: boolean;
  sizeBytes?: number;
  sha256?: string;
}

type Family = 'Desktop' | 'Mobile' | 'TV' | 'Web';

const FAMILY_OF: Record<string, Family> = {
  Windows: 'Desktop',
  macOS: 'Desktop',
  Linux: 'Desktop',
  Android: 'Mobile',
  'Android TV / Google TV / Fire TV': 'TV',
};

const FAMILY_ICON: Record<Family, typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  TV: Tv,
  Web: Globe,
};

/** Static fallback when the build service isn't linked — same matrix, all unstaged. */
const FALLBACK_BUILDS: BuildEntry[] = [
  { id: 'win-exe-x64', platform: 'Windows', variant: 'Installer', arch: 'x64', version: '1.0.0', notes: 'NSIS installer — desktop + start-menu shortcuts, auto-updates', gated: true, staged: false },
  { id: 'win-portable-x64', platform: 'Windows', variant: 'Portable (zip)', arch: 'x64', version: '1.0.0', notes: 'Unzip & run Elitebox.exe — no install. Unsigned preview package; the signed NSIS installer ships from the Windows release runner', gated: true, staged: false },
  { id: 'mac-universal', platform: 'macOS', variant: 'DMG', arch: 'Universal', version: '1.0.0', notes: 'Apple Silicon + Intel in one image', gated: true, staged: false },
  { id: 'linux-appimage', platform: 'Linux', variant: 'AppImage', arch: 'x64', version: '1.0.0', notes: 'Distro-agnostic, chmod +x and run', gated: true, staged: false },
  { id: 'linux-deb', platform: 'Linux', variant: 'deb', arch: 'x64', version: '1.0.0', notes: 'Debian / Ubuntu package', gated: true, staged: false },
  { id: 'android-apk', platform: 'Android', variant: 'APK', arch: 'ARM64', version: '1.0.0', notes: 'Direct install — Android 9+', gated: true, staged: false },
  { id: 'android-aab', platform: 'Android', variant: 'AAB', arch: 'ARM64', version: '1.0.0', notes: 'Play Store upload bundle', gated: true, staged: false },
  { id: 'androidtv-apk', platform: 'Android TV / Google TV / Fire TV', variant: 'APK (leanback)', arch: 'ARM64', version: '1.0.0', notes: '10-foot UI with spatial remote navigation', gated: true, staged: false },
];

const REQUIREMENTS: Record<string, string[]> = {
  Windows: ['Windows 10 64-bit or later', '200 MB free disk space'],
  macOS: ['macOS 12 or later', 'Apple Silicon & Intel'],
  Linux: ['glibc 2.31+', '200 MB free disk space'],
  Android: ['Android 9 or later', 'ARM64 recommended'],
  'Android TV / Google TV / Fire TV': ['Android TV 9+ or Fire OS 7+', 'D-pad remote — spatial navigation built in'],
};

function fmtSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes > 1 << 20) return `${(bytes / (1 << 20)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/* ── component ─────────────────────────────────────────────────────────── */

export default function Downloads() {
  const { user, demoMode, hasAccess } = useAuth();
  const premium = hasAccess();
  const [builds, setBuilds] = useState<BuildEntry[]>(FALLBACK_BUILDS);
  const [linked, setLinked] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family>('Desktop');

  useEffect(() => {
    if (!API_URL) return;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    fetch(`${API_URL}/api/builds`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { builds?: BuildEntry[] }) => {
        if (Array.isArray(j.builds) && j.builds.length) {
          setBuilds(j.builds);
          setLinked(true);
        }
      })
      .catch(() => setLinked(false))
      .finally(() => clearTimeout(t));
    return () => clearTimeout(t);
  }, []);

  const families = useMemo(() => {
    const present = new Set(builds.map((b) => FAMILY_OF[b.platform] ?? 'Desktop'));
    return (['Desktop', 'Mobile', 'TV', 'Web'] as Family[]).filter(
      (f) => f === 'Web' || present.has(f),
    );
  }, [builds]);

  const visible = useMemo(
    () => builds.filter((b) => (FAMILY_OF[b.platform] ?? 'Desktop') === family),
    [builds, family],
  );

  const download = async (b: BuildEntry) => {
    if (!premium || !linked) return;
    setBusyId(b.id);
    try {
      const token = authToken();
      const res = await fetch(`${API_URL}/api/builds/${b.id}/link`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const j = (await res.json()) as { url?: string; error?: string; code?: string };
      if (res.status === 402) {
        toast.error('Elitebox Premium is required for native builds');
        return;
      }
      if (res.status === 409) {
        toast('Still being packaged by the release pipeline — check back shortly');
        return;
      }
      if (!res.ok || !j.url) throw new Error(j.error || `HTTP ${res.status}`);
      window.open(`${API_URL}${j.url}`, '_blank', 'noopener');
      toast(`Download started — ${b.platform} ${b.variant}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-40 px-16 pb-128 pt-160 md:px-24">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-12"
      >
        <Eyebrow>Downloads</Eyebrow>
        <h1 className="font-display text-display-xl text-ink">Elitebox, everywhere you watch.</h1>
        <p className="max-w-[64ch] text-body text-muted">
          For the best experience, always run the latest Elitebox build. The web app is live
          today; native builds download right here with{' '}
          <span className="text-ink">Elitebox Premium</span> — every file verified by sha256
          before it reaches you. Looking for another platform? It is listed below with its
          honest build status.
        </p>
        <div className="flex flex-wrap items-center gap-10 text-caption">
          <span
            className={cn(
              'inline-flex items-center gap-6 rounded-full px-10 py-5 ring-1',
              premium
                ? 'bg-ok/15 text-ok ring-ok/40'
                : 'bg-purple/15 text-highlight ring-purple/40',
            )}
          >
            {premium ? <CheckCircle2 size={12} strokeWidth={1.75} /> : <Crown size={12} strokeWidth={1.75} />}
            {premium ? 'Premium active — native builds unlocked' : 'Free account — native builds need Premium'}
          </span>
          <span className="inline-flex items-center gap-6 rounded-full bg-white/[.05] px-10 py-5 text-muted ring-1 ring-white/[.08]">
            <ShieldCheck size={12} strokeWidth={1.75} className="text-cyan" />
            {linked ? 'Build service linked' : 'Build service not linked in this preview'}
          </span>
        </div>
      </motion.header>

      {/* family tabs */}
      <nav aria-label="Platform family" className="glass-2 flex w-fit flex-wrap gap-4 rounded-full p-6">
        {families.map((f) => {
          const Icon = FAMILY_ICON[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(f)}
              aria-pressed={family === f}
              className={cn(
                'focusable flex items-center gap-8 rounded-full px-18 py-10 text-caption cursor-pointer transition-all',
                family === f ? 'bg-signature font-semibold text-deep' : 'text-muted hover:text-ink',
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {f}
            </button>
          );
        })}
      </nav>

      {/* web card */}
      {family === 'Web' && (
        <GlassPanel level={2} className="flex flex-col items-start gap-16 rounded-2xl p-32">
          <span className="glass-1 flex h-48 w-48 items-center justify-center rounded-xl text-cyan">
            <Globe size={24} strokeWidth={1.75} />
          </span>
          <h2 className="font-display text-title text-ink">Web & PWA — live now</h2>
          <p className="max-w-[58ch] text-body text-muted">
            The full Elitebox runs in your browser and installs as a Progressive Web App from the
            browser menu — same account, library and addons as every native build.
          </p>
          <div className="flex flex-wrap gap-10">
            <Link to="/app">
              <ButtonPrimary>Open the app</ButtonPrimary>
            </Link>
            <span className="inline-flex items-center gap-6 rounded-full bg-ok/15 px-10 py-5 text-micro uppercase text-ok ring-1 ring-ok/40">
              <CheckCircle2 size={12} strokeWidth={1.75} /> Live
            </span>
          </div>
        </GlassPanel>
      )}

      {/* platform groups */}
      {family !== 'Web' && (
        <div className="flex flex-col gap-24">
          {[...new Set(visible.map((b) => b.platform))].map((platform) => (
            <section key={platform} className="flex flex-col gap-12">
              <div className="flex flex-wrap items-baseline gap-12">
                <h2 className="font-display text-title text-ink">{platform}</h2>
                <span className="text-caption text-muted">
                  {(REQUIREMENTS[platform] ?? []).join(' · ')}
                </span>
              </div>
              <div className="glass-2 overflow-hidden rounded-2xl">
                {visible
                  .filter((b) => b.platform === platform)
                  .map((b, i) => (
                    <div
                      key={b.id}
                      className={cn(
                        'flex flex-wrap items-center gap-16 px-20 py-16',
                        i > 0 && 'border-t border-white/[.06]',
                      )}
                    >
                      <span className="glass-1 flex h-40 w-40 items-center justify-center rounded-lg text-cyan">
                        {b.staged ? (
                          <Download size={18} strokeWidth={1.75} />
                        ) : (
                          <Package size={18} strokeWidth={1.75} />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="text-caption font-semibold text-ink">
                          {b.variant} <span className="font-mono text-micro text-muted">· {b.arch} · v{b.version}</span>
                        </span>
                        <span className="text-caption text-muted">{b.notes}</span>
                        <span className="font-mono text-[11px] text-muted/70">
                          {b.staged
                            ? `${fmtSize(b.sizeBytes)} · sha256 ${b.sha256?.slice(0, 16)}…`
                            : 'Being packaged by the release pipeline'}
                        </span>
                      </div>
                      {b.staged && linked ? (
                        premium ? (
                          <ButtonPrimary
                            onClick={() => void download(b)}
                            disabled={busyId === b.id}
                            className="px-16 py-8 text-[12px]"
                          >
                            {busyId === b.id ? (
                              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
                            ) : (
                              <Download size={14} strokeWidth={1.75} />
                            )}
                            {busyId === b.id ? 'Signing…' : 'Download'}
                          </ButtonPrimary>
                        ) : (
                          <Link to="/subscribe">
                            <ButtonPrimary className="px-16 py-8 text-[12px]">
                              <Lock size={14} strokeWidth={1.75} />
                              Unlock with Premium
                            </ButtonPrimary>
                          </Link>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-6 rounded-full bg-warn/10 px-12 py-6 text-micro uppercase text-warn ring-1 ring-warn/30">
                          <FileLock2 size={12} strokeWidth={1.75} />
                          {premium ? 'Ships with v1.0' : 'Premium build · ships with v1.0'}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* honesty footnote */}
      <GlassPanel className="flex flex-col gap-8 rounded-xl p-20">
        <span className="text-micro uppercase text-muted">How gated downloads work</span>
        <p className="text-caption text-muted">
          Native installers live on the Elitebox build service. After a successful Premium
          payment your account can request a signed, 15-minute download link for any staged
          build — files are never publicly reachable. {demoMode && !linked
            ? 'This preview runs without the companion server linked, so statuses are shown from the release matrix; link VITE_API_URL to fetch live availability.'
            : user
              ? 'Your entitlement is checked on every request.'
              : 'Sign in, then subscribe, to unlock them.'}
        </p>
        {!user && (
          <div className="pt-4">
            <Link to="/login">
              <ButtonGhost className="px-16 py-8 text-[12px]">Sign in</ButtonGhost>
            </Link>
          </div>
        )}
        <span className="hidden items-center gap-6 text-caption text-muted md:flex">
          <TabletSmartphone size={14} strokeWidth={1.75} className="text-cyan" />
          iOS & iPadOS follow the same shell after v1.0 — the architecture is ready for them.
        </span>
      </GlassPanel>
    </div>
  );
}
