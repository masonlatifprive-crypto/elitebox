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

const CURATED_GLOBAL_TITLES: MetaItem[] = [
  { id: 'global:tt0068646', type: 'movie', name: 'The Godfather', poster: 'https://images.metahub.space/poster/medium/tt0068646/img', backdrop: 'https://images.metahub.space/background/medium/tt0068646/img', year: 1972, genres: ['Crime', 'Drama', 'Classics'], rating: 9.2, description: 'Global metadata entry. Playback depends on legal installed stream providers.' },
  { id: 'global:tt0111161', type: 'movie', name: 'The Shawshank Redemption', poster: 'https://images.metahub.space/poster/medium/tt0111161/img', backdrop: 'https://images.metahub.space/background/medium/tt0111161/img', year: 1994, genres: ['Drama', 'Classics'], rating: 9.3, description: 'Global metadata entry. Playback depends on legal installed stream providers.' },
  { id: 'global:tt0468569', type: 'movie', name: 'The Dark Knight', poster: 'https://images.metahub.space/poster/medium/tt0468569/img', backdrop: 'https://images.metahub.space/background/medium/tt0468569/img', year: 2008, genres: ['Action', 'Crime', 'Drama'], rating: 9.0, description: 'Global metadata entry. Playback depends on legal installed stream providers.' },
  { id: 'global:tt0903747', type: 'series', name: 'Breaking Bad', poster: 'https://images.metahub.space/poster/medium/tt0903747/img', backdrop: 'https://images.metahub.space/background/medium/tt0903747/img', year: 2008, genres: ['Crime', 'Drama', 'Series'], rating: 9.5, description: 'Global metadata entry. Playback depends on legal installed stream providers.' },
  { id: 'global:tt0944947', type: 'series', name: 'Game of Thrones', poster: 'https://images.metahub.space/poster/medium/tt0944947/img', backdrop: 'https://images.metahub.space/background/medium/tt0944947/img', year: 2011, genres: ['Drama', 'Fantasy', 'Series'], rating: 9.2, description: 'Global metadata entry. Playback depends on legal installed stream providers.' },
];

const CURATED_UPCOMING_TITLES: MetaItem[] = [
  { id: 'upcoming:tt12009158', type: 'movie', name: 'Project Hail Mary', poster: 'https://images.metahub.space/poster/medium/tt12009158/img', backdrop: 'https://images.metahub.space/background/medium/tt12009158/img', year: 2026, genres: ['Sci-Fi', 'Adventure', 'Upcoming'], rating: undefined, description: 'Upcoming title metadata. Release timing can change; playback depends on legal providers after release.', upcoming: true, releaseLabel: 'Upcoming' },
  { id: 'upcoming:tt26743210', type: 'movie', name: 'Toy Story 5', poster: 'https://images.metahub.space/poster/medium/tt26743210/img', backdrop: 'https://images.metahub.space/background/medium/tt26743210/img', year: 2026, genres: ['Animation', 'Family', 'Upcoming'], rating: undefined, description: 'Upcoming title metadata. Release timing can change; playback depends on legal providers after release.', upcoming: true, releaseLabel: 'Upcoming' },
];


const CURATED_ARABIC_CINEMA: MetaItem[] = [
  { id: 'arabic:tt0112870', type: 'movie', name: 'The Land', poster: 'https://images.metahub.space/poster/medium/tt0112870/img', backdrop: 'https://images.metahub.space/background/medium/tt0112870/img', year: 1969, genres: ['Arabic Cinema', 'Drama', 'Classics'], rating: 8.0, description: 'Real Arabic cinema metadata. Playback depends on legal installed stream providers.' },
  { id: 'arabic:tt0117262', type: 'movie', name: 'Destiny', poster: 'https://images.metahub.space/poster/medium/tt0117262/img', backdrop: 'https://images.metahub.space/background/medium/tt0117262/img', year: 1997, genres: ['Arabic Cinema', 'Drama', 'History'], rating: 7.1, description: 'Real Arabic cinema metadata. Playback depends on legal installed stream providers.' },
  { id: 'arabic:tt1017428', type: 'movie', name: 'The Yacoubian Building', poster: 'https://images.metahub.space/poster/medium/tt1017428/img', backdrop: 'https://images.metahub.space/background/medium/tt1017428/img', year: 2006, genres: ['Arabic Cinema', 'Drama'], rating: 7.5, description: 'Real Arabic cinema metadata. Playback depends on legal installed stream providers.' },
  { id: 'arabic:tt1681425', type: 'movie', name: 'Cairo 678', poster: 'https://images.metahub.space/poster/medium/tt1681425/img', backdrop: 'https://images.metahub.space/background/medium/tt1681425/img', year: 2010, genres: ['Arabic Cinema', 'Drama'], rating: 7.4, description: 'Real Arabic cinema metadata. Playback depends on legal installed stream providers.' },
  { id: 'arabic:tt3614516', type: 'movie', name: 'Theeb', poster: 'https://images.metahub.space/poster/medium/tt3614516/img', backdrop: 'https://images.metahub.space/background/medium/tt3614516/img', year: 2014, genres: ['Arabic Cinema', 'Adventure', 'Drama'], rating: 7.2, description: 'Real Arabic cinema metadata. Playback depends on legal installed stream providers.' },
  { id: 'arabic:tt5997928', type: 'movie', name: 'Capernaum', poster: 'https://images.metahub.space/poster/medium/tt5997928/img', backdrop: 'https://images.metahub.space/background/medium/tt5997928/img', year: 2018, genres: ['Arabic Cinema', 'Drama'], rating: 8.4, description: 'Real Arabic cinema metadata. Playback depends on legal installed stream providers.' },
];

const CURATED_BOLLYWOOD_CINEMA: MetaItem[] = [
  { id: 'bollywood:tt0048473', type: 'movie', name: 'Pather Panchali', poster: 'https://images.metahub.space/poster/medium/tt0048473/img', backdrop: 'https://images.metahub.space/background/medium/tt0048473/img', year: 1955, genres: ['Indian Cinema', 'Drama', 'Classics'], rating: 8.2, description: 'Real Indian cinema metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt0050188', type: 'movie', name: 'Mother India', poster: 'https://images.metahub.space/poster/medium/tt0050188/img', backdrop: 'https://images.metahub.space/background/medium/tt0050188/img', year: 1957, genres: ['Bollywood', 'Drama', 'Classics'], rating: 7.8, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt0169102', type: 'movie', name: 'Lagaan', poster: 'https://images.metahub.space/poster/medium/tt0169102/img', backdrop: 'https://images.metahub.space/background/medium/tt0169102/img', year: 2001, genres: ['Bollywood', 'Drama', 'Sport'], rating: 8.1, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt0367110', type: 'movie', name: 'Swades', poster: 'https://images.metahub.space/poster/medium/tt0367110/img', backdrop: 'https://images.metahub.space/background/medium/tt0367110/img', year: 2004, genres: ['Bollywood', 'Drama'], rating: 8.2, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt0986264', type: 'movie', name: 'Taare Zameen Par', poster: 'https://images.metahub.space/poster/medium/tt0986264/img', backdrop: 'https://images.metahub.space/background/medium/tt0986264/img', year: 2007, genres: ['Bollywood', 'Drama', 'Family'], rating: 8.3, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt1187043', type: 'movie', name: '3 Idiots', poster: 'https://images.metahub.space/poster/medium/tt1187043/img', backdrop: 'https://images.metahub.space/background/medium/tt1187043/img', year: 2009, genres: ['Bollywood', 'Comedy', 'Drama'], rating: 8.4, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt5074352', type: 'movie', name: 'Dangal', poster: 'https://images.metahub.space/poster/medium/tt5074352/img', backdrop: 'https://images.metahub.space/background/medium/tt5074352/img', year: 2016, genres: ['Bollywood', 'Biography', 'Drama'], rating: 8.3, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
  { id: 'bollywood:tt8108198', type: 'movie', name: 'Andhadhun', poster: 'https://images.metahub.space/poster/medium/tt8108198/img', backdrop: 'https://images.metahub.space/background/medium/tt8108198/img', year: 2018, genres: ['Bollywood', 'Crime', 'Thriller'], rating: 8.2, description: 'Real Bollywood metadata. Playback depends on legal installed stream providers.' },
];

export function getArabicCinema(): MetaItem[] { return CURATED_ARABIC_CINEMA; }
export function getBollywoodCinema(): MetaItem[] { return CURATED_BOLLYWOOD_CINEMA; }

export function getCuratedGlobalTitles(): MetaItem[] { return [...CURATED_GLOBAL_TITLES, ...CURATED_ARABIC_CINEMA, ...CURATED_BOLLYWOOD_CINEMA]; }
export function getUpcomingTitles(): MetaItem[] { return CURATED_UPCOMING_TITLES; }

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
