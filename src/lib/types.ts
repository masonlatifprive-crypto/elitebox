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


/** A trailer attached to a meta (Cinemeta `trailers` / `trailerStreams`). */
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
  poster: string;
  backdrop?: string;
  year?: number;
  genres: string[];
  rating?: number; // 0–10
  description: string;
  runtime?: number; // minutes
  live?: boolean;
  videos?: MetaVideo[];

export interface AddonCatalog {
  id: string;
  name: string;
  type: MetaType;
  extra?: { name: string; isRequired?: boolean; options?: string[] }[];
}
