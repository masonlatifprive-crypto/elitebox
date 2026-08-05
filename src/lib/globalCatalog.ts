import type { MetaItem } from "./types";


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


export async function getCuratedGlobalTitles(): Promise<MetaItem[]> {
  return [];
}


export async function getUpcomingTitles(): Promise<MetaItem[]> {
  return [];
}
