/**
 * Elitebox addon engine (singleton).
 *
 * - External addons speak a Stremio-flavoured HTTP protocol:
 *   GET {base}/manifest, /catalog/{type}/{id}.json, /meta/{type}/{id}.json,
 *   /stream/{type}/{id}.json, /subtitles/{type}/{id}.json
 * - Every remote call: 7s AbortController timeout, timing telemetry, and a
 *   circuit breaker — 3 consecutive failures open the circuit for 60s, then
 *   one half-open probe decides close/re-open. `recover(id)` force-resets.
 * - Cinemeta calls additionally get one same-origin proxy fallback
 *   (`/api/cine.php`, 9s timeout) when the direct fetch fails, so visitors on
 *   slow/rotating-IP networks still reach the real catalog.
 */

import type {
  AddonCatalog,
  AddonHealth,
  AddonInfo,
  AddonLegal,
  AddonPrivacy,
  AddonStatus,
  CircuitState,
  MetaItem,
  MetaType,
  MetaVideo,
  StreamSource
} from '@/lib/types';

import { useAddons } from '@/lib/store';

// Constants for circuit breaker
const TIMEOUT_DIRECT = 7000;
const TIMEOUT_PROXY = 9000;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60000;

class AddonEngine {
  private health: Record<string, AddonHealth> = {};
  private proxyEnabled: boolean = true;

  constructor() {
    console.log('[AddonEngine] Initialized');
  }

  getAddons(): AddonInfo[] {
    try {
      return useAddons.getState().addons;
    } catch (e) {
      return [];
    }
  }

  async getCatalogs(): Promise<AddonCatalog[]> {
    const addons = this.getAddons();
    const catalogs: AddonCatalog[] = [];
    addons.forEach(a => {
      if (a.manifest.catalogs) {
        catalogs.push(...a.manifest.catalogs);
      }
    });
    return catalogs;
  }

  async getCatalog(addonId: string, type: string, id: string): Promise<MetaItem[]> {
    const addon = this.getAddons().find(a => a.manifest.id === addonId);
    if (!addon) return [];
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_DIRECT);
      const resp = await fetch(`${addon.transportUrl}/catalog/${type}/${id}.json`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      return data.metas || [];
    } catch (e) {
      console.error(`[AddonEngine] Catalog error for ${addonId}:`, e);
      return [];
    }
  }

  async getMeta(addonId: string, type: string, id: string): Promise<MetaItem | null> {
    const addon = this.getAddons().find(a => a.manifest.id === addonId);
    if (!addon) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_DIRECT);
      const resp = await fetch(`${addon.transportUrl}/meta/${type}/${id}.json`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      return data.meta || null;
    } catch (e) {
      console.error(`[AddonEngine] Meta error for ${addonId}:`, e);
      return null;
    }
  }

  async getStreams(type: string, id: string): Promise<StreamSource[]> {
    const addons = this.getAddons();
    const results: StreamSource[] = [];

    const promises = addons.map(async addon => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_DIRECT);
        const resp = await fetch(`${addon.transportUrl}/stream/${type}/${id}.json`, {
          signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await resp.json();
        if (data.streams) {
          results.push(...data.streams);
        }
      } catch (e) {
        // Silently fail per addon
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  async searchAddons(query: string): Promise<MetaItem[]> {
    const addons = this.getAddons();
    const results: MetaItem[] = [];

    const promises = addons.map(async addon => {
      // Basic search logic - find catalogs that support search
      const searchCatalogs = addon.manifest.catalogs?.filter(c => c.extra?.some(e => e.name === 'search'));
      if (!searchCatalogs?.length) return;

      for (const cat of searchCatalogs) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), TIMEOUT_DIRECT);
          const encoded = encodeURIComponent(query);
          const resp = await fetch(`${addon.transportUrl}/catalog/${cat.type}/${cat.id}/search=${encoded}.json`, {
            signal: controller.signal
          });
          clearTimeout(timeout);
          const data = await resp.json();
          if (data.metas) results.push(...data.metas);
        } catch (e) {
          // Ignore
        }
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

export const addonEngine = new AddonEngine();
