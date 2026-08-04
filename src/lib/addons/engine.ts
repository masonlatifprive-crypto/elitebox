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
  getAddons(): AddonInfo[] {
    try { return useAddons.getState().addons; } catch (e) { return []; }
  }

  async getStreams(type: string, id: string): Promise<StreamSource[]> {
    const addons = this.getAddons();
    const results: StreamSource[] = [];
    const promises = addons.map(async addon => {
      try {
        const resp = await fetch(\`${addon.transportUrl}/stream/${type}/${id}.json\`);
        const data = await resp.json();
        if (data.streams) results.push(...data.streams);
      } catch (e) {}
    });
    await Promise.allSettled(promises);
    return results;
  }
}

export const addonEngine = new AddonEngine();
