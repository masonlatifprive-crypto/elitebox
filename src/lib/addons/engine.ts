/**
 * Elitebox addon engine (singleton).
 *
 * - Builtin `elitebox.showcase` addon is pre-installed and answered locally
 *   (no network). External addons speak a Stremio-flavoured HTTP protocol:
 *   GET {base}/manifest, /catalog/{type}/{id}.json, /meta/{type}/{id}.json,
 *   /stream/{type}/{id}.json, /subtitles/{type}/{id}.json
 * - Every remote call: 5s AbortController timeout, timing telemetry, and a
 *   circuit breaker — 3 consecutive failures open the circuit for 60s, then
 *   one half-open probe decides close/re-open. `recover(id)` force-resets.
 */
import type {
  AddonCatalog,
  AddonHealth,
  AddonInfo,
  AddonLegal,
  AddonPrivacy,
  CircuitState,
  MetaItem,
  MetaType,
  StreamSource,
} from '@/lib/types';
import {
  SHOWCASE_CATALOG,
  findShowcaseMeta,
  getShowcaseStreams,
  searchShowcase,
} from '@/data/showcase';
import { SHOWCASE_ADDON, useAddons } from '@/lib/store';

const TIMEOUT_MS = 5000;
const CIRCUIT_FAIL_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 60_000;
const DEGRADED_LATENCY_MS = 800;

/* ── addon safety screen ─────────────────────────────────────────────────
   Elitebox only runs legal addons. Known piracy indexers are hard-blocked
   at install time; torrent-indexer vocabulary in an unlisted manifest
   raises a visible warning in the install preview instead. */
const BLOCKED_ADDON_PATTERNS: RegExp[] = [
  /torrentio/i,
  /jackettio?/i,
  /pirate\s?bay/i,
  /rarbg/i,
  /1337x/i,
  /yts(\.|$|\b)/i,
  /eztv/i,
  /kickass/i,
  /torrent\s?galaxy/i,
  /torrents?db/i,
  /knight\s?crawler/i,
  /annatar/i,
  /media\s?fusion/i,
  /comet.*strem/i,
  /juan\s?carlos/i,
  /popcorn\s?time/i,
];
const TORRENT_KEYWORD = /torrent|magnet[:=]|p2p/i;

/** Returns a block reason when the addon is a known piracy source. */
export function addonBlockReason(url: string, id: string, name: string): string | undefined {
  const hay = `${url} ${id} ${name}`;
  for (const pattern of BLOCKED_ADDON_PATTERNS) {
    if (pattern.test(hay)) {
      return 'This addon is on the Elitebox blocklist: it is associated with copyright-infringing sources, which Elitebox does not run.';
    }
  }
  return undefined;
}

/** True when the manifest/URL mentions torrent-style sourcing (warning, not block). */
export function addonTorrentHint(url: string, id: string, name: string, description: string): boolean {
  return TORRENT_KEYWORD.test(`${url} ${id} ${name} ${description}`);
}

/** True when a catalog declares support for the `search` extra. */
function catalogSupportsSearch(c: AddonCatalog): boolean {
  if (c.extraSupported?.includes('search')) return true;
  return false;
}

/** Parse the `extra`/`extraSupported` fields of a raw manifest catalog entry. */
function parseCatalog(raw: unknown): AddonCatalog | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const c = raw as {
    id?: unknown; type?: unknown; name?: unknown;
    extra?: unknown; extraSupported?: unknown; extraRequired?: unknown;
  };
  if (typeof c.id !== 'string' || !c.id || typeof c.type !== 'string' || !c.type) return undefined;
  const names = (v: unknown): string[] =>
    Array.isArray(v)
      ? v
          .map((e) =>
            typeof e === 'string' ? e : ((e as { name?: unknown })?.name as string | undefined) ?? '',
          )
          .filter(Boolean)
      : [];
  const fromExtra = names(c.extra);
  const supported = [...new Set([...fromExtra, ...names(c.extraSupported)])];
  return {
    id: c.id,
    type: c.type,
    name: typeof c.name === 'string' ? c.name : undefined,
    extraSupported: supported.length ? supported : undefined,
    extraRequired: names(c.extraRequired).length ? names(c.extraRequired) : undefined,
  };
}

/* ── runtime telemetry (not persisted) ─────────────────────────────────── */

interface AddonRuntime {
  fails: number;
  successes: number;
  latencyMs?: number;
  circuit: CircuitState;
  openedAt?: number;
}

const runtime = new Map<string, AddonRuntime>();

function rt(addonId: string): AddonRuntime {
  let r = runtime.get(addonId);
  if (!r) {
    r = { fails: 0, successes: 0, circuit: 'closed' };
    runtime.set(addonId, r);
  }
  return r;
}

export class AddonError extends Error {
  readonly addonId?: string;
  constructor(message: string, addonId?: string) {
    super(message);
    this.name = 'AddonError';
    this.addonId = addonId;
  }
}

/* ── remote protocol helpers ───────────────────────────────────────────── */

function baseUrl(addon: AddonInfo): string {
  if (!addon.manifestUrl) throw new AddonError(`Addon ${addon.id} has no manifest URL`, addon.id);
  return addon.manifestUrl.replace(/\/manifest(\.json)?$/i, '').replace(/\/$/, '');
}

async function fetchJson<T>(url: string, timeoutMs = TIMEOUT_MS): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new AddonError(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function circuitAllows(addonId: string): boolean {
  const r = rt(addonId);
  if (r.circuit === 'open') {
    const elapsed = Date.now() - (r.openedAt ?? 0);
    if (elapsed >= CIRCUIT_OPEN_MS) {
      r.circuit = 'half-open'; // allow one probe through
      return true;
    }
    return false;
  }
  return true;
}

function recordSuccess(addonId: string, latencyMs: number): void {
  const r = rt(addonId);
  r.successes += 1;
  r.fails = 0;
  r.latencyMs = Math.round(r.latencyMs === undefined ? latencyMs : r.latencyMs * 0.6 + latencyMs * 0.4);
  r.circuit = 'closed';
  r.openedAt = undefined;
}

function recordFailure(addonId: string): void {
  const r = rt(addonId);
  r.fails += 1;
  if (r.circuit === 'half-open' || r.fails >= CIRCUIT_FAIL_THRESHOLD) {
    r.circuit = 'open';
    r.openedAt = Date.now();
  }
}

/** Call a remote addon endpoint with timeout + circuit breaker + telemetry. */
async function callRemote<T>(addon: AddonInfo, path: string): Promise<T> {
  if (!circuitAllows(addon.id)) {
    throw new AddonError(`Circuit open for addon ${addon.id}`, addon.id);
  }
  const started = performance.now();
  try {
    const data = await fetchJson<T>(`${baseUrl(addon)}${path}`);
    recordSuccess(addon.id, performance.now() - started);
    return data;
  } catch (err) {
    recordFailure(addon.id);
    throw err instanceof AddonError ? err : new AddonError(String(err), addon.id);
  }
}

/* ── showcase (builtin, local) ─────────────────────────────────────────── */

function showcaseCatalog(type?: MetaType): MetaItem[] {
  return type ? SHOWCASE_CATALOG.filter((m) => m.type === type) : SHOWCASE_CATALOG;
}

/* ── engine ────────────────────────────────────────────────────────────── */

class AddonEngine {
  /** All installed addons in user order. */
  list(): AddonInfo[] {
    return useAddons.getState().installed;
  }

  /**
   * Install from a manifest URL. 5s timeout; manifest must contain a valid
   * `id` and `name` or the install is rejected.
   */
  async install(manifestUrl: string): Promise<AddonInfo> {
    interface Manifest {
      id?: string;
      name?: string;
      version?: string;
      description?: string;
      logo?: string;
      icon?: string;
      resources?: Array<string | { name?: string }>;
      catalogs?: unknown[];
      permissions?: unknown;
      privacy?: AddonPrivacy;
      legal?: AddonLegal;
    }
    /* HTTPS-only for remote addons — plain HTTP is accepted only for local
       development servers (localhost / 127.0.0.1). */
    let parsed: URL;
    try {
      parsed = new URL(manifestUrl);
    } catch {
      throw new AddonError('That is not a valid manifest URL.');
    }
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) {
      throw new AddonError('Only secure https:// addon manifests are supported (http is allowed for localhost development).');
    }
    const manifest = await fetchJson<Manifest>(manifestUrl, TIMEOUT_MS);
    if (!manifest.id || typeof manifest.id !== 'string' || !manifest.name || typeof manifest.name !== 'string') {
      throw new AddonError('Invalid manifest: missing required "id" or "name"');
    }
    const blocked = addonBlockReason(manifestUrl, manifest.id, manifest.name);
    if (blocked) throw new AddonError(blocked);
    const catalogs = (manifest.catalogs ?? [])
      .map(parseCatalog)
      .filter((c): c is AddonCatalog => Boolean(c));
    const info: AddonInfo = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version ?? '0.0.0',
      description: manifest.description ?? '',
      icon: manifest.logo ?? manifest.icon ?? '/art/addon-icon-cinema.jpg',
      resources: (manifest.resources ?? [])
        .map((r) => (typeof r === 'string' ? r : (r.name ?? '')))
        .filter(Boolean),
      manifestUrl,
      catalogs: catalogs.length ? catalogs : undefined,
      permissions: Array.isArray(manifest.permissions)
        ? manifest.permissions.filter((p): p is string => typeof p === 'string')
        : undefined,
      privacy: manifest.privacy && typeof manifest.privacy === 'object' ? manifest.privacy : undefined,
      legal: manifest.legal && typeof manifest.legal === 'object' ? manifest.legal : undefined,
    };
    useAddons.getState().installAddon(info);
    return info;
  }

  /** Remove an addon (builtin showcase cannot be removed). */
  remove(id: string): void {
    useAddons.getState().removeAddon(id);
    runtime.delete(id);
  }

  /** Reorder addons by an ordered list of ids. */
  reorder(orderedIds: string[]): void {
    useAddons.getState().reorderAddons(orderedIds);
  }

  setEnabled(id: string, enabled: boolean): void {
    useAddons.getState().setAddonEnabled(id, enabled);
  }

  private activeAddons(resource?: string): AddonInfo[] {
    const { installed, enabled } = useAddons.getState();
    return installed.filter(
      (a) => enabled[a.id] && (!resource || a.builtin || a.resources.includes(resource)),
    );
  }

  /** Aggregated catalog for a type (all enabled catalog addons). */
  async getCatalog(type?: MetaType): Promise<MetaItem[]> {
    const results: MetaItem[] = [];
    const seen = new Set<string>();
    const push = (items: MetaItem[]) => {
      for (const m of items) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          results.push(m);
        }
      }
    };
    await Promise.all(
      this.activeAddons('catalog').map(async (addon) => {
        if (addon.builtin) {
          push(showcaseCatalog(type));
          return;
        }
        try {
          /* Prefer the addon's declared catalog for this type; fall back to
             the conventional `top` catalog for legacy installs that predate
             catalog parsing. */
          const want = type ?? 'movie';
          const declared = addon.catalogs?.find((c) => c.type === want) ?? addon.catalogs?.[0];
          const path = declared
            ? `/catalog/${declared.type}/${declared.id}.json`
            : `/catalog/${want}/top.json`;
          const data = await callRemote<{ metas?: MetaItem[] }>(addon, path);
          push(data.metas ?? []);
        } catch {
          /* failing addons simply contribute nothing */
        }
      }),
    );
    return results;
  }

  /** Meta lookup across enabled meta addons (first hit wins, in addon order). */
  async getMeta(type: MetaType, id: string): Promise<MetaItem | undefined> {
    for (const addon of this.activeAddons('meta')) {
      if (addon.builtin) {
        const hit = findShowcaseMeta(id);
        if (hit && hit.type === type) return hit;
        if (hit) return hit; // id match wins even if type differs (defensive)
        continue;
      }
      try {
        const data = await callRemote<{ meta?: MetaItem }>(addon, `/meta/${type}/${id}.json`);
        if (data.meta) return data.meta;
      } catch {
        /* try next addon */
      }
    }
    return undefined;
  }

  /**
   * Streams for an id from ALL enabled stream addons, in parallel, per-addon
   * timeout + circuit breaker. Results stay grouped in addon order.
   */
  async getStreams(type: MetaType, id: string): Promise<StreamSource[]> {
    const groups = await Promise.all(
      this.activeAddons('stream').map(async (addon): Promise<StreamSource[]> => {
        if (addon.builtin) return getShowcaseStreams(id);
        if (!circuitAllows(addon.id)) return [];
        try {
          const data = await callRemote<{ streams?: Array<Partial<StreamSource> & { url?: string }> }>(
            addon,
            `/stream/${type}/${id}.json`,
          );
          return (data.streams ?? [])
            .filter((s): s is typeof s & { url: string } => typeof s.url === 'string')
            .map((s, i) => ({
              id: `${addon.id}:${id}:${i}`,
              title: s.title ?? `${addon.name} source ${i + 1}`,
              quality: s.quality ?? 'HD',
              url: s.url,
              addonId: addon.id,
              addonName: addon.name,
              sizeHint: s.sizeHint,
              subtitles: s.subtitles,
            }));
        } catch {
          return [];
        }
      }),
    );
    return groups.flat();
  }

  /** Search across enabled search/catalog addons. */
  async search(q: string): Promise<MetaItem[]> {
    const results: MetaItem[] = [];
    const seen = new Set<string>();
    const push = (items: MetaItem[]) => {
      for (const m of items) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          results.push(m);
        }
      }
    };
    const encoded = encodeURIComponent(q);
    await Promise.all(
      this.activeAddons('catalog').map(async (addon) => {
        if (addon.builtin) {
          push(searchShowcase(q));
          return;
        }
        /* Stremio search rides the catalog endpoint:
           /catalog/{type}/{id}/search={q}.json — only catalogs that declare
           the `search` extra are queried. Legacy installs (no stored
           catalogs) probe the conventional movie/series `top` catalogs. */
        const targets: Array<{ type: string; id: string }> = addon.catalogs?.length
          ? addon.catalogs.filter(catalogSupportsSearch)
          : [
              { type: 'movie', id: 'top' },
              { type: 'series', id: 'top' },
            ];
        await Promise.all(
          targets.map(async (c) => {
            try {
              const data = await callRemote<{ metas?: MetaItem[] }>(
                addon,
                `/catalog/${c.type}/${c.id}/search=${encoded}.json`,
              );
              push(data.metas ?? []);
            } catch {
              /* addon catalog without search simply contributes nothing */
            }
          }),
        );
      }),
    );
    return results;
  }

  /** Health snapshot for one addon. */
  health(id: string): AddonHealth {
    const addon = this.list().find((a) => a.id === id);
    if (!addon) return { status: 'down', successRate: 0, circuit: 'open' };
    if (addon.builtin) {
      return { status: 'ok', latencyMs: 0, successRate: 1, circuit: 'closed' };
    }
    const r = rt(id);
    const total = r.successes + r.fails;
    const successRate = total === 0 ? 1 : r.successes / total;
    let status: AddonHealth['status'] = 'ok';
    if (r.circuit === 'open') status = 'down';
    else if (
      r.circuit === 'half-open' ||
      successRate < 0.9 ||
      (r.latencyMs !== undefined && r.latencyMs > DEGRADED_LATENCY_MS)
    ) {
      status = 'degraded';
    }
    const retryInSec =
      r.circuit === 'open' && r.openedAt
        ? Math.max(0, Math.ceil((CIRCUIT_OPEN_MS - (Date.now() - r.openedAt)) / 1000))
        : undefined;
    return { status, latencyMs: r.latencyMs, successRate, circuit: r.circuit, retryInSec };
  }

  /**
   * Reliability score 0–100 derived from real probe telemetry (success rate
   * blended with circuit state). Builtin addon is always 100 — it is local.
   */
  reliability(id: string): number {
    const addon = this.list().find((a) => a.id === id);
    if (!addon) return 0;
    if (addon.builtin) return 100;
    const h = this.health(id);
    const base = Math.round(h.successRate * 100);
    if (h.circuit === 'open') return Math.min(base, 25);
    if (h.circuit === 'half-open') return Math.min(base, 60);
    return base;
  }

  /** Health for every installed addon. */
  healthAll(): Record<string, AddonHealth> {
    const out: Record<string, AddonHealth> = {};
    for (const addon of this.list()) out[addon.id] = this.health(addon.id);
    return out;
  }

  /**
   * Force-recover an addon: reset failure counters and close the circuit.
   * For remote addons this also fires a lightweight manifest probe so the
   * health readout reflects reality immediately.
   */
  async recover(id: string): Promise<AddonHealth> {
    const r = rt(id);
    r.fails = 0;
    r.successes = 0;
    r.latencyMs = undefined;
    r.circuit = 'closed';
    r.openedAt = undefined;
    const addon = this.list().find((a) => a.id === id);
    if (addon && !addon.builtin && addon.manifestUrl) {
      try {
        const started = performance.now();
        await fetchJson(addon.manifestUrl, TIMEOUT_MS);
        recordSuccess(id, performance.now() - started);
      } catch {
        recordFailure(id);
      }
    }
    return this.health(id);
  }
}

export const addonEngine = new AddonEngine();
export { SHOWCASE_ADDON };
