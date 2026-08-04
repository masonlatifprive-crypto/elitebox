/**
 * Elitebox addon engine (singleton).
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

export enum addonBlockReason {
  NONE = 'NONE',
  LEGAL = 'LEGAL',
  MALWARE = 'MALWARE',
  UNSTABLE = 'UNSTABLE'
}

const TIMEOUT_DIRECT = 7000;

class AddonEngine {
  private health: Record<string, AddonHealth> = {};

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
      const resp = await fetch(addon.transportUrl + '/catalog/' + type + '/' + id + '.json', {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      return data.metas || [];
    } catch (e) {
      return [];
    }
  }

  async getMeta(addonId: string, type: string, id: string): Promise<MetaItem | null> {
    const addon = this.getAddons().find(a => a.manifest.id === addonId);
    if (!addon) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_DIRECT);
      const resp = await fetch(addon.transportUrl + '/meta/' + type + '/' + id + '.json', {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      return data.meta || null;
    } catch (e) {
      return null;
    }
  }

  async getStreams(type: string, id: string): Promise<StreamSource[]> {
    const addons = this.getAddons();
    const results: StreamSource[] = [];
    const promises = addons.map(async (addon) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_DIRECT);
        const resp = await fetch(addon.transportUrl + '/stream/' + type + '/' + id + '.json', {
          signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await resp.json();
        if (data.streams) results.push(...data.streams);
      } catch (e) {}
    });
    await Promise.allSettled(promises);
    return results;
  }
}

export const addonEngine = new AddonEngine();
