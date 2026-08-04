import type { MetaItem, StreamSource, AddonManifest } from '@/lib/types';

/**
 * Elitebox Showcase catalog - now minimized to act as a fallback.
 * Real data is pulled from installed addons (like Cinemeta).
 */

const ADDON_ID = 'elitebox.showcase';
const ADDON_NAME = 'Elitebox';

export const SHOWCASE_MANIFEST: AddonManifest = {
  id: ADDON_ID,
  name: ADDON_NAME,
  version: '1.0.0',
  resources: ['catalog', 'meta'],
  types: ['movie', 'series'],
  catalogs: [
    {
      type: 'movie',
      id: 'showcase_movies',
      name: 'Featured Movies'
    }
  ]
};

// Return empty arrays to prompt user to install real addons or fallback to Cinemeta
export const SHOWCASE_MOVIES: MetaItem[] = [];
export const SHOWCASE_SERIES: MetaItem[] = [];
export const SHOWCASE_CHANNELS: MetaItem[] = [];

export function SHOWCASE_CATALOG(type: string, id: string): MetaItem[] {
  return [];
}

export function findShowcaseMeta(type: string, id: string): MetaItem | undefined {
  return undefined;
}

export function getShowcaseStreams(type: string, id: string): StreamSource[] {
  return [];
}
