/**
 * Elitebox Showcase catalog — real open-content (Blender Studio open movies,
 * all CC-BY) plus open live channels. Every item carries an ordered,
 * multi-source stream list: a browser-playable MP4/H.264 source always comes
 * first (Chromium cannot play .mov/.mkv, so those mirrors are fallbacks).
 * Quality labels are honest (container/codec noted where non-MP4).
 */
import type { MetaItem, StreamSource } from '@/lib/types';

const ADDON_ID = 'elitebox.showcase';
const ADDON_NAME = 'Elitebox Showcase';

const BLENDER = 'https://download.blender.org';
const GTV = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample';

function stream(
  metaId: string,
  n: number,
  title: string,
  quality: string,
  url: string,
  sizeHint?: string,
): StreamSource {
  return { id: `${ADDON_ID}:${metaId}:${n}`, title, quality, url, addonId: ADDON_ID, addonName: ADDON_NAME, sizeHint };
}

/* ── 12 movies ─────────────────────────────────────────────────────────── */

export const SHOWCASE_MOVIES: MetaItem[] = [
  {
    id: 'big-buck-bunny',
    type: 'movie',
    officialUrl: 'https://peach.blender.org/',
    name: 'Big Buck Bunny',
    poster: '/art/poster-big-buck-bunny.jpg',
    backdrop: '/art/backdrop-big-buck-bunny.jpg',
    year: 2008,
    genres: ['Animation', 'Comedy', 'Family'],
    runtime: 10,
    description:
      'A gentle giant of a rabbit wakes to a perfect spring morning — until three rodents push him too far. Blender\'s beloved open-movie comedy about payback, served fluffy.',
  },
  {
    id: 'sintel',
    type: 'movie',
    officialUrl: 'https://durian.blender.org/',
    name: 'Sintel',
    poster: '/art/poster-sintel.jpg',
    backdrop: '/art/backdrop-sintel.jpg',
    year: 2010,
    genres: ['Animation', 'Fantasy', 'Drama'],
    runtime: 15,
    description:
      'A lone warrior crosses frozen wastelands in search of the baby dragon she once rescued and lost. An emotional epic about love, memory and the cost of the search.',
  },
  {
    id: 'tears-of-steel',
    type: 'movie',
    officialUrl: 'https://mango.blender.org/',
    name: 'Tears of Steel',
    poster: '/art/poster-tears-of-steel.jpg',
    backdrop: '/art/backdrop-tears-of-steel.jpg',
    year: 2012,
    genres: ['Sci-Fi', 'Action', 'Live Action VFX'],
    runtime: 12,
    description:
      'Forty years after a heartbreak on an Amsterdam bridge, a group of scientists reenacts the moment to save the world from rampaging machines. Live-action VFX, built in the open.',
  },
  {
    id: 'elephants-dream',
    type: 'movie',
    officialUrl: 'https://orange.blender.org/',
    name: 'Elephants Dream',
    poster: '/art/poster-elephants-dream.jpg',
    backdrop: '/art/backdrop-elephants-dream.jpg',
    year: 2006,
    genres: ['Animation', 'Sci-Fi', 'Surreal'],
    runtime: 11,
    description:
      'Proog and Emo travel through a vast, living machine that may be the entire universe — or only one of them believes so. The first open movie ever made.',
  },
  {
    id: 'cosmos-laundromat',
    type: 'movie',
    officialUrl: 'https://gooseberry.blender.org/',
    name: 'Cosmos Laundromat',
    poster: '/art/poster-cosmos-laundromat.jpg',
    backdrop: '/art/backdrop-cosmos-laundromat.jpg',
    year: 2015,
    genres: ['Animation', 'Sci-Fi', 'Comedy'],
    runtime: 12,
    description:
      'On a desolate island, a suicidal sheep meets a mysterious salesman offering a spin cycle through other lives. Absurdist, gorgeous, and quietly cosmic.',
  },
  {
    id: 'caminandes-1',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Caminandes: Llama Drama',
    poster: '/art/poster-caminandes-1.jpg',
    backdrop: '/art/backdrop-caminandes-1.jpg',
    year: 2013,
    genres: ['Animation', 'Comedy', 'Family'],
    runtime: 2,
    description:
      'Koro the llama just wants to cross the road in the snowy Andes. The road — and a very stubborn traffic barrier — disagrees.',
  },
  {
    id: 'caminandes-2',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Caminandes: Gran Dillama',
    poster: '/art/poster-caminandes-2.jpg',
    backdrop: '/art/backdrop-caminandes-2.jpg',
    year: 2014,
    genres: ['Animation', 'Comedy', 'Family'],
    runtime: 3,
    description:
      'A frozen lake, a tasty patch of grass on the other side, and one penguin in the way. Koro\'s slippery plan goes exactly as well as you\'d expect.',
  },
  {
    id: 'caminandes-3',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Caminandes: Llamigos',
    poster: '/art/poster-caminandes-3.jpg',
    backdrop: '/art/backdrop-caminandes-3.jpg',
    year: 2016,
    genres: ['Animation', 'Adventure', 'Family'],
    runtime: 3,
    description:
      'Koro and Oti the penguin trek into a glowing cave to find food — and stumble onto something far stranger than lunch.',
  },
  {
    id: 'agent-327',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Agent 327: Operation Barbershop',
    poster: '/art/poster-agent-327.jpg',
    backdrop: '/art/backdrop-agent-327.jpg',
    year: 2017,
    genres: ['Animation', 'Action', 'Comedy'],
    runtime: 4,
    description:
      'Secret agent 327 infiltrates a barbershop that is definitely not just a barbershop. A slick spy romp based on the classic Dutch comic.',
  },
  {
    id: 'sprite-fright',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Sprite Fright',
    poster: '/art/poster-sprite-fright.jpg',
    backdrop: '/art/backdrop-sprite-fright.jpg',
    year: 2021,
    genres: ['Animation', 'Comedy', 'Horror'],
    runtime: 10,
    description:
      'A group of teenagers on a camping trip discovers the forest\'s tiny mushroom sprites — who are fiercely protective of their home. Spooky, silly and sharp.',
  },
  {
    id: 'charge',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Charge',
    poster: '/art/poster-charge.jpg',
    backdrop: '/art/backdrop-charge.jpg',
    year: 2022,
    genres: ['Animation', 'Sci-Fi', 'Action'],
    runtime: 3,
    description:
      'In a rain-soaked neon future, a mercenary\'s last job becomes a sprint through the city\'s underbelly. A gritty micro-thriller rendered entirely in the open.',
  },
  {
    id: 'wing-it',
    type: 'movie',
    officialUrl: 'https://studio.blender.org/films/',
    name: 'Wing It!',
    poster: '/art/poster-wing-it.jpg',
    backdrop: '/art/backdrop-wing-it.jpg',
    year: 2023,
    genres: ['Animation', 'Comedy', 'Family'],
    runtime: 3,
    description:
      'Armed with homemade goggles and unshakeable optimism, a little bird attempts the one thing birds are supposed to do. Heart comes standard.',
  },
];

/* ── 1 series (episodes = the three Caminandes shorts) ─────────────────── */

export const SHOWCASE_SERIES: MetaItem[] = [
  {
    id: 'caminandes-series',
    type: 'series',
    name: 'Caminandes: The Complete Trek',
    poster: '/art/poster-caminandes-1.jpg',
    backdrop: '/art/backdrop-caminandes-3.jpg',
    year: 2013,
    genres: ['Animation', 'Comedy', 'Family'],
    description:
      'All three Caminandes adventures in one shelf: Koro the llama versus roads, ice and the mysteries of a glowing cave, with Oti the penguin along for the ride.',
    videos: [
      { id: 'caminandes-series-s01e01', title: 'Llama Drama', season: 1, episode: 1, released: '2013-02-12' },
      { id: 'caminandes-series-s01e02', title: 'Gran Dillama', season: 1, episode: 2, released: '2014-01-30' },
      { id: 'caminandes-series-s01e03', title: 'Llamigos', season: 1, episode: 3, released: '2016-01-29' },
    ],
  },
];

/* ── Upcoming — Elitebox Originals announced for the catalog ─────────────
   Original fictional one-sheets commissioned for Elitebox. Presented as
   "Coming soon": no streams exist yet, so these are watchlist/notify-only —
   the Detail page renders a dedicated coming-soon state instead of sources. */



/* ── 3 live channels ───────────────────────────────────────────────────── */

export const SHOWCASE_CHANNELS: MetaItem[] = [
  {
    id: 'orbital-cinema',
    type: 'channel',
    name: 'Orbital Cinema',
    poster: '/art/channel-orbital-cinema.jpg',
    backdrop: '/art/channel-orbital-cinema.jpg',
    genres: ['Movies', '24/7'],
    description: 'Open movies on rotation, beamed down around the clock.',
    live: true,
  },
  {
    id: 'nebula-sports',
    type: 'channel',
    name: 'Nebula Sports',
    poster: '/art/channel-nebula-sports.jpg',
    backdrop: '/art/channel-nebula-sports.jpg',
    genres: ['Sports', 'Live Event'],
    description: 'The big match energy channel — adaptive HLS, always on.',
    live: true,
  },
  {
    id: 'launchpad',
    type: 'channel',
    name: 'Launchpad',
    poster: '/art/channel-launchpad.jpg',
    backdrop: '/art/channel-launchpad.jpg',
    genres: ['Documentary', 'Science'],
    description: 'Rockets, robots and the science of what comes next.',
    live: true,
  },
];

export const SHOWCASE_CATALOG: MetaItem[] = [
  ...SHOWCASE_MOVIES,
  ...SHOWCASE_SERIES,
  ...SHOWCASE_CHANNELS,
];

/* ── Ordered multi-source streams per catalog id ───────────────────────── */

export const SHOWCASE_STREAMS: Record<string, StreamSource[]> = {
  'big-buck-bunny': [
    stream('big-buck-bunny', 1, 'Mirror · 720p MP4', 'HD', `${GTV}/BigBuckBunny.mp4`),
    stream('big-buck-bunny', 2, 'Blender Mirror · 720p H.264 (MOV)', 'HD', `${BLENDER}/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov`, '~111 MB'),
    stream('big-buck-bunny', 3, 'Blender Mirror · 1080p H.264 (MOV)', 'HD', `${BLENDER}/peach/bigbuckbunny_movies/big_buck_bunny_1080p_h264.mov`, '~210 MB'),
  ],
  sintel: [
    stream('sintel', 1, 'Mirror · 720p MP4', 'HD', `${GTV}/Sintel.mp4`),
    stream('sintel', 2, 'Blender Mirror · 720p (MKV)', 'HD', `${BLENDER}/durian/movies/Sintel.2010.720p.mkv`, '~124 MB'),
  ],
  'tears-of-steel': [
    stream('tears-of-steel', 1, 'Mirror · 720p MP4', 'HD', `${GTV}/TearsOfSteel.mp4`),
    stream('tears-of-steel', 2, 'Blender Mirror · 720p (MOV)', 'HD', `${BLENDER}/tears/tears_of_steel_720p.mov`, '~371 MB'),
  ],
  'elephants-dream': [
    stream('elephants-dream', 1, 'Blender Mirror · 1024px MP4', 'HD', `${BLENDER}/ED/ed_1024_512kb.mp4`, '~47 MB'),
    stream('elephants-dream', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ElephantsDream.mp4`),
  ],
  'cosmos-laundromat': [
    stream('cosmos-laundromat', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/cosmos/cosmos_laundromat_720p.mp4`, '~180 MB'),
    stream('cosmos-laundromat', 2, 'Blender Mirror · 1080p MP4', 'HD', `${BLENDER}/cosmos/cosmos_laundromat_1080p.mp4`, '~340 MB'),
  ],
  'caminandes-1': [
    stream('caminandes-1', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes1/caminandes_llama_drama_720p.mp4`, '~30 MB'),
    stream('caminandes-1', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerFun.mp4`),
  ],
  'caminandes-2': [
    stream('caminandes-2', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes2/caminandes_gran_dillama_720p.mp4`, '~45 MB'),
    stream('caminandes-2', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerJoyrides.mp4`),
  ],
  'caminandes-3': [
    stream('caminandes-3', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes3/caminandes_llamigos_720p.mp4`, '~50 MB'),
    stream('caminandes-3', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerMeltdowns.mp4`),
  ],
  'agent-327': [
    stream('agent-327', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/agent327/agent_327_720p.mp4`, '~60 MB'),
    stream('agent-327', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerEscapes.mp4`),
  ],
  'sprite-fright': [
    stream('sprite-fright', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/sprite_fright/sprite_fright_720p.mp4`, '~160 MB'),
    stream('sprite-fright', 2, 'Blender Mirror · 1080p MP4', 'HD', `${BLENDER}/sprite_fright/sprite_fright_1080p.mp4`, '~310 MB'),
  ],
  charge: [
    stream('charge', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/charge/charge_720p.mp4`, '~55 MB'),
    stream('charge', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerBlazes.mp4`),
  ],
  'wing-it': [
    stream('wing-it', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/wing-it/wing_it_720p.mp4`, '~50 MB'),
    stream('wing-it', 2, 'Blender Mirror · 1080p MP4', 'HD', `${BLENDER}/wing-it/wing_it_1080p.mp4`, '~95 MB'),
  ],

  // Series episodes → the three Caminandes sources
  'caminandes-series-s01e01': [
    stream('caminandes-series-s01e01', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes1/caminandes_llama_drama_720p.mp4`),
    stream('caminandes-series-s01e01', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerFun.mp4`),
  ],
  'caminandes-series-s01e02': [
    stream('caminandes-series-s01e02', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes2/caminandes_gran_dillama_720p.mp4`),
    stream('caminandes-series-s01e02', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerJoyrides.mp4`),
  ],
  'caminandes-series-s01e03': [
    stream('caminandes-series-s01e03', 1, 'Blender Mirror · 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes3/caminandes_llamigos_720p.mp4`),
    stream('caminandes-series-s01e03', 2, 'Mirror · 720p MP4', 'HD', `${GTV}/ForBiggerMeltdowns.mp4`),
  ],
  'caminandes-series': [
    stream('caminandes-series', 1, 'Blender Mirror · S01E01 720p MP4', 'HD', `${BLENDER}/caminandes/caminandes1/caminandes_llama_drama_720p.mp4`),
    stream('caminandes-series', 2, 'Mirror · S01E01 720p MP4', 'HD', `${GTV}/ForBiggerFun.mp4`),
  ],

  // Live channels
  'orbital-cinema': [
    stream('orbital-cinema', 1, 'Orbital Cinema · Live (MP4 loop)', 'LIVE', `${GTV}/BigBuckBunny.mp4`),
    stream('orbital-cinema', 2, 'Orbital Cinema · Backup (MOV)', 'LIVE', `${BLENDER}/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov`),
  ],
  'nebula-sports': [
    stream('nebula-sports', 1, 'Nebula Sports · Live HLS', 'LIVE', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'),
  ],
  launchpad: [
    stream('launchpad', 1, 'Launchpad · Live (MP4 loop)', 'LIVE', `${GTV}/TearsOfSteel.mp4`),
    stream('launchpad', 2, 'Launchpad · Backup (MOV)', 'LIVE', `${BLENDER}/tears/tears_of_steel_720p.mov`),
  ],
};

/* ── Lookups ───────────────────────────────────────────────────────────── */

const byId = new Map(SHOWCASE_CATALOG.map((m) => [m.id, m]));

export function findShowcaseMeta(id: string): MetaItem | undefined {
  return byId.get(id);
}

export function getShowcaseStreams(id: string): StreamSource[] {
  return SHOWCASE_STREAMS[id] ?? [];
}

export function searchShowcase(q: string): MetaItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return SHOWCASE_CATALOG.filter(
    (m) =>
      m.name.toLowerCase().includes(needle) ||
      m.genres.some((g) => g.toLowerCase().includes(needle)) ||
      m.description.toLowerCase().includes(needle),
  );
}
