/**
 * usePublicCatalog — the public (pre-login) catalog for marketing surfaces:
 * real movies & series from the installed public catalog addons (Cinemeta)
 * via the addon engine, interleaved top-movies/top-series.
 *
 * Resilience mirrors the engine's callRemote discipline:
 * - engine-level 7s timeout + circuit breaker on every remote call, plus the
 *   engine's same-origin proxy fallback for Cinemeta on flaky networks
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
import type { MetaItem } from '@/lib/types';

const CACHE_KEY = 'elitebox.v1.publicCatalog';
const CACHE_TTL_MS = 10 * 60_000;
const RETRY_DELAY_MS = 800;
const TARGET_COUNT = 18;

interface CatalogState {
  items: MetaItem[];
  loading: boolean;
  failed: boolean;
}

let inFlight: Promise<MetaItem[]> | null = null;

export function usePublicCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return { items: data, loading: false, failed: false };
        }
      }
    } catch (e) {}
    return { items: [], loading: true, failed: false };
  });

  useEffect(() => {
    let mounted = true;

    async function fetchCatalog(isRetry = false): Promise<MetaItem[]> {
      const addons = addonEngine.getAddons().filter(a => a.manifest.types.includes('movie') || a.manifest.types.includes('series'));
      const cinemeta = addons.find(a => a.transportUrl.includes('cinemeta')) || addons[0];

      if (!cinemeta) return [];

      try {
        const [movies, series] = await Promise.all([
          addonEngine.callRemote(cinemeta.transportUrl, 'catalog', 'movie', 'top'),
          addonEngine.callRemote(cinemeta.transportUrl, 'catalog', 'series', 'top')
        ]);

        const interleaved: MetaItem[] = [];
        const max = Math.max(movies?.metas?.length || 0, series?.metas?.length || 0);
        for (let i = 0; i < max; i++) {
          if (movies?.metas?.[i]) interleaved.push(movies.metas[i]);
          if (series?.metas?.[i]) interleaved.push(series.metas[i]);
          if (interleaved.length >= TARGET_COUNT) break;
        }

        if (interleaved.length === 0 && !isRetry) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          return fetchCatalog(true);
        }

        return interleaved;
      } catch (err) {
        if (!isRetry) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          return fetchCatalog(true);
        }
        throw err;
      }
    }

    async function sync() {
      if (!inFlight) {
        inFlight = fetchCatalog().finally(() => { inFlight = null; });
      }

      try {
        const data = await inFlight;
        if (mounted) {
          setState({ items: data, loading: false, failed: false });
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        }
      } catch (err) {
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, failed: prev.items.length === 0 }));
        }
      }
    }

    sync();
    return () => { mounted = false; };
  }, []);

  return state;
}
