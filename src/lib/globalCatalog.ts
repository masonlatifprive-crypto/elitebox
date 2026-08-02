import type { MetaItem } from '@/lib/types';

interface JikanImage { jpg?: { image_url?: string; large_image_url?: string }; webp?: { image_url?: string; large_image_url?: string } }
interface JikanTitle { type?: string; title?: string }
interface JikanAnime {
  mal_id: number;
  url?: string;
  title?: string;
  title_english?: string;
  titles?: JikanTitle[];
  images?: JikanImage;
  synopsis?: string;
  year?: number;
  aired?: { from?: string };
  score?: number;
  episodes?: number;
  genres?: Array<{ name?: string }>;
  type?: string;
}
interface JikanResponse { data?: JikanAnime[] }

const BASE = 'https://api.jikan.moe/v4';

const CURATED_ANIME: MetaItem[] = [
  { id: 'mal:20', type: 'series', name: 'Naruto', poster: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', backdrop: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', year: 2002, genres: ['Anime', 'Action', 'Adventure'], rating: 7.99, description: 'Anime metadata provided by public anime databases. Playback depends on legal installed stream providers.', videos: Array.from({ length: 48 }, (_, i) => ({ id: `mal:20:${i + 1}`, title: `Episode ${i + 1}`, episode: i + 1 })), officialUrl: 'https://myanimelist.net/anime/20/Naruto' },
  { id: 'mal:21', type: 'series', name: 'One Piece', poster: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', backdrop: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', year: 1999, genres: ['Anime', 'Action', 'Adventure'], rating: 8.72, description: 'Anime metadata provided by public anime databases. Playback depends on legal installed stream providers.', videos: Array.from({ length: 48 }, (_, i) => ({ id: `mal:21:${i + 1}`, title: `Episode ${i + 1}`, episode: i + 1 })), officialUrl: 'https://myanimelist.net/anime/21/One_Piece' },
  { id: 'mal:38000', type: 'series', name: 'Demon Slayer: Kimetsu no Yaiba', poster: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', backdrop: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', year: 2019, genres: ['Anime', 'Action', 'Fantasy'], rating: 8.43, description: 'Anime metadata provided by public anime databases. Playback depends on legal installed stream providers.', videos: Array.from({ length: 26 }, (_, i) => ({ id: `mal:38000:${i + 1}`, title: `Episode ${i + 1}`, episode: i + 1 })), officialUrl: 'https://myanimelist.net/anime/38000/Kimetsu_no_Yaiba' },
  { id: 'mal:5114', type: 'series', name: 'Fullmetal Alchemist: Brotherhood', poster: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg', backdrop: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg', year: 2009, genres: ['Anime', 'Action', 'Adventure'], rating: 9.09, description: 'Anime metadata provided by public anime databases. Playback depends on legal installed stream providers.', videos: Array.from({ length: 48 }, (_, i) => ({ id: `mal:5114:${i + 1}`, title: `Episode ${i + 1}`, episode: i + 1 })), officialUrl: 'https://myanimelist.net/anime/5114/Fullmetal_Alchemist__Brotherhood' },
];

function mergeAnime(primary: MetaItem[], extra: MetaItem[]): MetaItem[] {
  const seen = new Set<string>();
  return [...primary, ...extra].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const CACHE_TTL = 20 * 60_000;
const cache = new Map<string, { at: number; items: MetaItem[] }>();

function getCached(key: string): MetaItem[] | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL) return undefined;
  return hit.items;
}

function setCached(key: string, items: MetaItem[]) { cache.set(key, { at: Date.now(), items }); }

function titleOf(a: JikanAnime): string {
  return a.title_english || a.title || a.titles?.find((t) => t.type === 'English')?.title || a.titles?.[0]?.title || `Anime ${a.mal_id}`;
}

function posterOf(a: JikanAnime): string {
  return a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.webp?.image_url || a.images?.jpg?.image_url || '/og-image.png';
}

function yearOf(a: JikanAnime): number | undefined {
  if (typeof a.year === 'number') return a.year;
  const from = a.aired?.from;
  if (!from) return undefined;
  const y = Number(String(from).slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

function normalize(a: JikanAnime): MetaItem {
  const genres = ['Anime', ...(a.genres ?? []).map((g) => g.name).filter((x): x is string => Boolean(x))];
  return {
    id: `mal:${a.mal_id}`,
    type: 'series',
    name: titleOf(a),
    poster: posterOf(a),
    backdrop: posterOf(a),
    year: yearOf(a),
    genres: [...new Set(genres)],
    rating: typeof a.score === 'number' ? a.score : undefined,
    description: a.synopsis || 'Anime metadata provided by the public Jikan API. Playback depends on legal installed stream providers.',
    runtime: undefined,
    videos: a.episodes ? Array.from({ length: Math.min(a.episodes, 48) }, (_, i) => ({ id: `mal:${a.mal_id}:${i + 1}`, title: `Episode ${i + 1}`, episode: i + 1 })) : undefined,
    officialUrl: a.url,
  };
}

async function fetchJson(url: string): Promise<JikanResponse> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Jikan HTTP ${res.status}`);
    return await res.json() as JikanResponse;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function getAnimeCatalog(): Promise<MetaItem[]> {
  const key = 'top-anime';
  const cached = getCached(key);
  if (cached) return cached;
  const data = await fetchJson(`${BASE}/top/anime?filter=bypopularity&limit=24`);
  const items = mergeAnime(CURATED_ANIME, (data.data ?? []).map(normalize).filter((m) => m.poster && m.name));
  setCached(key, items);
  return items;
}

export async function searchAnime(query: string): Promise<MetaItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = `search:${q.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;
  const data = await fetchJson(`${BASE}/anime?q=${encodeURIComponent(q)}&limit=18&sfw=true`);
  const live = (data.data ?? []).map(normalize).filter((m) => m.poster && m.name);
  const curated = CURATED_ANIME.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  const items = mergeAnime(curated, live);
  setCached(key, items);
  return items;
}
