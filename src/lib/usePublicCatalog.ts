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








/** Module-level shared request: every concurrent consumer rides one fetch. */
let inflight: Promise<MetaItem[]> | undefined;








export interface PublicCatalogState {
  items: MetaItem[];
  loading: boolean;
  failed: boolean;


export function usePublicCatalog(): PublicCatalogState {
  const [state, setState] = useState<PublicCatalogState>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { items, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) return { items, loading: false, failed: false };
      }
    } catch (e) {}
    return { items: [], loading: true, failed: false };
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (inflight) {
        const items = await inflight;
        if (mounted) setState({ items, loading: false, failed: items.length === 0 });
        return;
      }

      inflight = (async () => {
        try {
          const manifests = addonEngine.getAddons().map(a => a.manifest);
          const cinemeta = manifests.find(m => m.id === 'org.stremio.cinemeta') || manifests[0];
          if (!cinemeta) return [];
          
          const [movies, series] = await Promise.all([
            addonEngine.callRemote(cinemeta.id, 'catalog', 'movie', 'top'),
            addonEngine.callRemote(cinemeta.id, 'catalog', 'series', 'top')
          ]);

          const combined: MetaItem[] = [];
          const mList = movies?.metas || [];
          const sList = series?.metas || [];
          for (let i = 0; i < Math.max(mList.length, sList.length); i++) {
            if (mList[i]) combined.push(mList[i]);
            if (sList[i]) combined.push(sList[i]);
            if (combined.length >= TARGET_COUNT) break;
          }

          if (combined.length > 0) {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ items: combined, timestamp: Date.now() }));
          }
          return combined;
        } catch (e) {
          return [];
        } finally {
          inflight = undefined;
        }
      })();

      const items = await inflight;
      if (mounted) setState({ items, loading: false, failed: items.length === 0 });
    }
    load();
    return () => { mounted = false; };
  }, []);

  return state;
}
