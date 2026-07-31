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

export interface MetaItem {
  id: string;
  type: MetaType;
  name: string;
  poster: string;
  backdrop?: string;
  year?: number;
  genres: string[];
  rating?: number; // 0–10
  description: string;
  runtime?: number; // minutes
  live?: boolean;
  videos?: MetaVideo[];
  /** Not yet streamable — presented as "Coming soon" (no sources, watchlist-only). */
  upcoming?: boolean;
  /** Human release framing, e.g. 'Coming soon' or '2026'. */
  releaseLabel?: string;
  /**
   * Confirmed premiere date (ISO 8601). Only set when a date is officially
   * announced — never an estimate. Drives countdowns, the calendar grid,
   * .ics export and arrival reminders. Absent ⇒ "date TBA".
   */
  releaseDate?: string;
  /** Where the premiere happens, when announced. */
  premiereType?: 'theatrical' | 'streaming';
  /** Verified official page (e.g. Blender project site) — trailer & info. */
  officialUrl?: string;
}

export interface StreamSubtitle {
  lang: string;
  url: string;
}

export interface StreamSource {
  id: string;
  title: string;
  quality: string; // 'HD' | '4K' | 'SD' | 'LIVE' …
  url: string;
  addonId: string;
  addonName: string;
  sizeHint?: string;
  subtitles?: StreamSubtitle[];
}

export type AddonStatus = 'ok' | 'degraded' | 'down';
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface AddonHealth {
  status: AddonStatus;
  latencyMs?: number;
  successRate: number; // 0–1
  circuit: CircuitState;
  retryInSec?: number;
}

/** A catalog declared in an addon manifest (Stremio protocol). */
export interface AddonCatalog {
  id: string;
  type: string;
  name?: string;
  /** Declared extras (e.g. search, genre, skip) — from `extra` or `extraSupported`. */
  extraSupported?: string[];
  extraRequired?: string[];
}

/** Manifest 2.0 declarations — all optional, gracefully absent on legacy addons. */
export interface AddonPrivacy {
  receivesUserId?: boolean;
  receivesWatchHistory?: boolean;
  receivesRegion?: boolean;
}

export interface AddonLegal {
  copyrightSafe?: boolean;
  contentRightsDeclared?: boolean;
  allowsCopyrightedPiracy?: boolean;
}

export interface AddonInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  resources: string[]; // e.g. ['catalog', 'meta', 'stream', 'subtitles']
  manifestUrl?: string;
  builtin?: boolean;
  /** Declared catalogs (absent on addons installed before Manifest 2.0 parsing). */
  catalogs?: AddonCatalog[];
  permissions?: string[];
  privacy?: AddonPrivacy;
  legal?: AddonLegal;
}
