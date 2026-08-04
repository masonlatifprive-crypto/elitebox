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
}
