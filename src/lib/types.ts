/**
 * Elitebox core domain types — shared by the addon engine, stores and all pages.
 * (design.md §10 / scaffold contract E)
 */

export type MetaType = 'movie' | 'series' | 'channel';

export interface MetaVideo {
  id: string;
  title: string;
  season?: number;
  episode?: number;
  released?: string; // ISO date
}

/** A trailer attached to a meta (Cinemeta trailers / trailerStreams). */
export interface MetaTrailer {
  /** YouTube video id. */
  source: string;
  /** Cinemeta trailer kind, e.g. 'Trailer'. */
  type?: string;
}

export interface MetaItem {
  id: string;
  type: MetaType;
  name: string;
  poster?: string;
  background?: string;
  logo?: string;
  description?: string;
  year?: number;
  runtime?: string;
  genres?: string[];
  director?: string[];
  cast?: string[];
  imdbRating?: string;
  released?: string;
  trailers?: MetaTrailer[];
  videos?: MetaVideo[];
}

export interface AddonCatalog {
  id: string;
  type: MetaType;
  name: string;
  extra?: { name: string; isRequired?: boolean; options?: string[] }[];
}

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  logo?: string;
  background?: string;
  types: MetaType[];
  resources: ('catalog' | 'meta' | 'stream' | 'subtitles')[];
  catalogs: AddonCatalog[];
  idPrefixes?: string[];
}

export interface Stream {
  name?: string;
  title?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  externalUrl?: string;
  behaviorHints?: any;
}
