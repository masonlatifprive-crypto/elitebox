/**
 * usePublicCatalog — the public (pre-login) catalog for marketing surfaces:
 * real movies & series from the installed public catalog addons (Cinemeta)
 * via the addon engine, interleaved top-movies/top-series.
 *
 * Resilience mirrors the engine's callRemote discipline:
 * - engine-level 5s timeout + circuit breaker on every remote call
 * - one retry after a short backoff when no remote titles arrive
 * - sessionStorage SWR cache (10 min): a fresh cache renders instantly while
 *   a background revalidation runs regardless, so engine telemetry always
 *   reflects a real fetch from this visit
 * - concurrent consumers share one in-flight request
 *
 * Never fabricates titles: when the live catalog is unreachable and no cache
 * exists, `failed` is true and `items` is [] — the caller decides on an
 * honest fallback.
 */
import { useEffect, useState } from 'react';
import { addonEngine } from '@/lib/addons/engine';
import { findShowcaseMeta } from '@/data/showcase';
import type { MetaItem } from '@/lib/types';

const CACHE_KEY = 'elitebox.v1.publicCatalog';
const CACHE_TTL_MS = 10 * 60_000;
const RETRY_DELAY_MS = 800;
const TARGET_COUNT = 18;

/** Module-level shared request: every concurrent consumer rides one fetch. */
let inflight: Promise<MetaItem[]> | undefined;

export interface PublicCatalogState {
  items: MetaItem[];
  loading: boolean;
  failed: boolean;
}

function interleave(movies: MetaItem[], series: MetaItem[], count: number): MetaItem[] {
  const out: MetaItem[] = [];
  for (let i = 0; out.length < count && (i < movies.length || i < series.length); i++) {
    if (movies[i]) out.push(movies[i]);
    if (out.length < count && series[i]) out.push(series[i]);
  }
  return out;
}

/** Real remote titles only — the builtin open-movie showcase never counts. */
async function fetchPublicCatalog(): Promise<MetaItem[]> {
  const [movies, series] = await Promise.all([
    addonEngine.getCatalog('movie'),
    addonEngine.getCatalog('series'),
  ]);
  const remote = (list: MetaItem[]) =>
    list.filter((m) => !findShowcaseMeta(m.id) && m.poster && m.name);
  return interleave(remote(movies), remote(series), TARGET_COUNT);
}

function readCache(): MetaItem[] | undefined {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at?: unknown; items?: unknown };
    if (typeof parsed.at !== 'number' || !Array.isArray(parsed.items)) return undefined;
    if (Date.now() - parsed.at > CACHE_TTL_MS) return undefined;
    return parsed.items as MetaItem[];
  } catch {
    return undefined;
  }
}

function writeCache(items: MetaItem[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }));
  } catch {
    /* storage full or blocked — caching is best-effort */
  }
}

function loadShared(): Promise<MetaItem[]> {
  if (!inflight) {
    inflight = (async () => {
      let items = await fetchPublicCatalog().catch(() => [] as MetaItem[]);
      if (items.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        items = await fetchPublicCatalog().catch(() => [] as MetaItem[]);
      }
      if (items.length > 0) writeCache(items);
      return items;
    })().finally(() => {
      inflight = undefined;
    });
  }
  return inflight;
}

export function usePublicCatalog(): PublicCatalogState {
  const [state, setState] = useState<PublicCatalogState>(() => {
    const cached = readCache();
    return cached && cached.length > 0
      ? { items: cached, loading: false, failed: false }
      : { items: [], loading: true, failed: false };
  });

  useEffect(() => {
    let alive = true;
    /* Always revalidate, even with a warm cache: this is the fetch that feeds
       the engine telemetry shown on the marketing health card. */
    loadShared().then((items) => {
      if (!alive) return;
      setState((prev) =>
        items.length > 0
          ? { items, loading: false, failed: false }
          : { items: prev.items, loading: false, failed: prev.items.length === 0 },
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
