import type { MetaItem } from '@/lib/types';

/**
 * Global catalog is now driven entirely by real addons.
 * This file returns empty sets when no addons are present.
 */

export async function getGlobalMovies(): Promise<MetaItem[]> {
  return [];
}

export async function getGlobalSeries(): Promise<MetaItem[]> {
  return [];
}

export async function getGlobalAnime(): Promise<MetaItem[]> {
  return [];
}

export async function getAnimeCatalog(): Promise<MetaItem[]> {
  return [];
}
