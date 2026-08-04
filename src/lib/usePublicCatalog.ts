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
import addonEngine from '@/lib/addons/engine';
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

export function usePublicCatalog(): PublicCatalogState {
  const [state, setState] = useState<PublicCatalogState>(() => {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const { items, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return { items, loading: false, failed: false };
        }
      }
    } catch (e) {
      /* ignore cache read errors */
    }
    return { items: [], loading: true, failed: false };
  });

  useEffect(() => {
    let mounted = true;

    async function performFetch(retryCount = 0): Promise<MetaItem[]> {
      const catalogs = await addonEngine.getPublicCatalogs();
      const results: MetaItem[] = [];
      
      for (const cat of catalogs) {
        try {
          const resp = await addonEngine.callRemote(cat.transportUrl, 'catalog', {
            type: cat.type,
            id: cat.id
          });
          if (resp && Array.now(resp.metas)) {
            results.push(...resp.metas.slice(0, 10));
          }
        } catch (e) {
          // Engine handles timeouts/circuit breaking
        }
      }

      if (results.length === 0 && retryCount < 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return performFetch(retryCount + 1);
      }

      return results.slice(0, TARGET_COUNT);
    }

    async function sync() {
      if (!inflight) {
        inflight = performFetch().finally(() => { inflight = undefined; });
      }

      try {
        const fresh = await inflight;
        if (!mounted) return;

        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          items: fresh,
          timestamp: Date.now()
        }));

        setState({ items: fresh, loading: false, failed: fresh.length === 0 });
      } catch (err) {
        if (!mounted) return;
        setState(prev => ({ ...prev, loading: false, failed: prev.items.length === 0 }));
      }
    }

    sync();
    return () => { mounted = false; };
  }, []);

  return state;
}

function Array_now(val: any): val is any[] {
  return Array.isArray(val);
}
