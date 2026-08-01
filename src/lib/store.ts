/**
 * Elitebox state layer — zustand + persist.
 *
 * Persistence keys follow `elitebox.v1.<profileId>.<store>` so every profile
 * gets isolated library / playback-memory / addons / settings data. The
 * profiles registry itself is global (`elitebox.v1.profiles`). When the
 * active profile changes, call `switchProfile()` to rebind scoped stores.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AddonInfo } from '@/lib/types';

const KEY_PREFIX = 'elitebox.v1.';
export const DEFAULT_PROFILE_ID = 'default';

export function scopedKey(storeName: string, profileId?: string): string {
  const pid = profileId ?? useProfiles.getState().activeProfileId ?? DEFAULT_PROFILE_ID;
  return `${KEY_PREFIX}${pid}.${storeName}`;
}

/**
 * Storage adapter that resolves the CURRENT profile's namespace on every
 * read/write. Without it, zustand persist keeps writing to the key captured
 * when the store was created, so anything saved after switchProfile() would
 * land in the previous profile's slice.
 */
function scopedStorage(storeName: string) {
  return createJSONStorage(() => ({
    getItem: () => localStorage.getItem(scopedKey(storeName)),
    setItem: (_name: string, value: string) => {
      localStorage.setItem(scopedKey(storeName), value);
    },
    removeItem: () => localStorage.removeItem(scopedKey(storeName)),
  }));
}

/* ── Profiles ──────────────────────────────────────────────────────────── */

export interface Profile {
  id: string;
  name: string;
  avatar: string; // /art/avatar-*.jpg
  pin?: string;
  createdAt: number;
}

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string | null;
  addProfile: (p: Omit<Profile, 'createdAt'>) => void;
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => void;
  removeProfile: (id: string) => void;
  setActive: (id: string | null) => void;
}

export const useProfiles = create<ProfilesState>()(
  persist(
    (set) => ({
      profiles: [],
      activeProfileId: null,
      addProfile: (p) =>
        set((s) =>
          s.profiles.some((x) => x.id === p.id)
            ? s
            : { profiles: [...s.profiles, { ...p, createdAt: Date.now() }] },
        ),
      updateProfile: (id, patch) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProfile: (id) =>
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
        })),
      setActive: (id) => set({ activeProfileId: id }),
    }),
    { name: `${KEY_PREFIX}profiles` },
  ),
);

/**
 * Switch the active profile and rebind every profile-scoped store to that
 * profile's persisted slice (or its initial state when none exists yet).
 */
export function switchProfile(profileId: string | null): void {
  useProfiles.getState().setActive(profileId);
  rebindScopedStores();
}

/* ── Library ───────────────────────────────────────────────────────────── */

export interface ContinueWatchingEntry {
  id: string;
  type: 'movie' | 'series' | 'channel';
  progressSec: number;
  durationSec: number;
  updatedAt: number;
}

/** A magnet link the user saved from the magnet result sheet (drop/paste). */
export interface SavedMagnet {
  infoHash: string; // 40-char lowercase hex
  name: string;
  magnetUri: string;
  addedAt: number;
}

interface LibraryState {
  watchlist: string[];
  favorites: string[];
  watched: string[];
  continueWatching: ContinueWatchingEntry[];
  savedMagnets: SavedMagnet[];
  /** Incognito: when true, setProgress records nothing (private session). */
  historyPaused: boolean;
  setHistoryPaused: (v: boolean) => void;
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  toggleWatchlist: (id: string) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleWatched: (id: string) => void;
  setProgress: (entry: Omit<ContinueWatchingEntry, 'updatedAt'>) => void;
  clearProgress: (id: string) => void;
  addSavedMagnet: (m: SavedMagnet) => void;
  removeSavedMagnet: (infoHash: string) => void;
  isWatchlisted: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  isWatched: (id: string) => boolean;
}

const libraryInitial = {
  watchlist: [] as string[],
  favorites: [] as string[],
  watched: [] as string[],
  continueWatching: [] as ContinueWatchingEntry[],
  savedMagnets: [] as SavedMagnet[],
  historyPaused: false,
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...libraryInitial,
      addToWatchlist: (id) =>
        set((s) => (s.watchlist.includes(id) ? s : { watchlist: [...s.watchlist, id] })),
      removeFromWatchlist: (id) =>
        set((s) =>
          s.watchlist.includes(id) ? { watchlist: s.watchlist.filter((x) => x !== id) } : s,
        ),
      toggleWatchlist: (id) =>
        get().watchlist.includes(id) ? get().removeFromWatchlist(id) : get().addToWatchlist(id),
      addFavorite: (id) =>
        set((s) => (s.favorites.includes(id) ? s : { favorites: [...s.favorites, id] })),
      removeFavorite: (id) =>
        set((s) =>
          s.favorites.includes(id) ? { favorites: s.favorites.filter((x) => x !== id) } : s,
        ),
      toggleFavorite: (id) =>
        get().favorites.includes(id) ? get().removeFavorite(id) : get().addFavorite(id),
      toggleWatched: (id) =>
        set((s) =>
          s.watched.includes(id)
            ? { watched: s.watched.filter((x) => x !== id) }
            : { watched: [...s.watched, id] },
        ),
      setHistoryPaused: (v) => set({ historyPaused: v }),
      setProgress: (entry) =>
        set((s) => {
          // Incognito session — nothing is recorded.
          if (s.historyPaused) return s;
          // Finished (>95%) → drop from continue watching (idempotent).
          const done = entry.durationSec > 0 && entry.progressSec >= entry.durationSec * 0.95;
          const rest = s.continueWatching.filter((e) => e.id !== entry.id);
          if (done || entry.progressSec <= 0) {
            return rest.length === s.continueWatching.length ? s : { continueWatching: rest };
          }
          const next: ContinueWatchingEntry = { ...entry, updatedAt: Date.now() };
          return { continueWatching: [next, ...rest].slice(0, 60) };
        }),
      clearProgress: (id) =>
        set((s) =>
          s.continueWatching.some((e) => e.id === id)
            ? { continueWatching: s.continueWatching.filter((e) => e.id !== id) }
            : s,
        ),
      // Saved magnets are deduped by info-hash and capped like continueWatching.
      addSavedMagnet: (m) =>
        set((s) =>
          s.savedMagnets.some((x) => x.infoHash === m.infoHash)
            ? s
            : { savedMagnets: [m, ...s.savedMagnets].slice(0, 60) },
        ),
      removeSavedMagnet: (infoHash) =>
        set((s) =>
          s.savedMagnets.some((x) => x.infoHash === infoHash)
            ? { savedMagnets: s.savedMagnets.filter((x) => x.infoHash !== infoHash) }
            : s,
        ),
      isWatchlisted: (id) => get().watchlist.includes(id),
      isFavorite: (id) => get().favorites.includes(id),
      isWatched: (id) => get().watched.includes(id),
    }),
    { name: 'elitebox.v1.library', storage: scopedStorage('library') },
  ),
);

/* ── Playback memory (per title: speed / tracks / subtitle offset) ─────── */

export interface PlaybackMemoryEntry {
  speed: number;
  audioTrack?: string;
  subTrack?: string;
  subOffsetSec: number;
}

interface PlaybackMemoryState {
  byTitle: Record<string, PlaybackMemoryEntry>;
  setMemory: (titleId: string, patch: Partial<PlaybackMemoryEntry>) => void;
  getMemory: (titleId: string) => PlaybackMemoryEntry | undefined;
  forget: (titleId: string) => void;
}

const DEFAULT_MEMORY: PlaybackMemoryEntry = { speed: 1, subOffsetSec: 0 };

export const usePlaybackMemory = create<PlaybackMemoryState>()(
  persist(
    (set, get) => ({
      byTitle: {},
      setMemory: (titleId, patch) =>
        set((s) => ({
          byTitle: {
            ...s.byTitle,
            [titleId]: { ...DEFAULT_MEMORY, ...s.byTitle[titleId], ...patch },
          },
        })),
      getMemory: (titleId) => get().byTitle[titleId],
      forget: (titleId) =>
        set((s) => {
          if (!(titleId in s.byTitle)) return s;
          const next = { ...s.byTitle };
          delete next[titleId];
          return { byTitle: next };
        }),
    }),
    { name: 'elitebox.v1.playback', storage: scopedStorage('playback') },
  ),
);

/* ── Addons (installed set, order, enabled flags) ──────────────────────── */

export const SHOWCASE_ADDON: AddonInfo = {
  id: 'elitebox.showcase',
  name: 'Elitebox Showcase',
  version: '1.0.0',
  description:
    'Built-in open-content catalog: Blender Studio open movies, the Caminandes series and open live channels. Works fully offline — no network calls.',
  icon: '/art/addon-icon-showcase.jpg',
  resources: ['catalog', 'meta', 'stream', 'search'],
  builtin: true,
};

interface AddonsState {
  installed: AddonInfo[];
  enabled: Record<string, boolean>;
  installAddon: (info: AddonInfo) => void;
  removeAddon: (id: string) => void;
  reorderAddons: (orderedIds: string[]) => void;
  setAddonEnabled: (id: string, enabled: boolean) => void;
  isEnabled: (id: string) => boolean;
}

/**
 * Cinemeta — bundled by default as the catalog/metadata layer. It is the
 * same open metadata protocol Elitebox speaks natively: real movie/series
 * metadata, search, posters and ratings from the community-run public
 * service. Streams always come from the user's own installed addons.
 */
export const CINEMETA_ADDON: AddonInfo = {
  id: 'com.linvo.cinemeta',
  name: 'Cinemeta',
  version: '3.0.14',
  description: 'The official addon for movie and series catalogs',
  icon: '/art/addon-icon-cinema.jpg',
  resources: ['catalog', 'meta', 'addon_catalog'],
  manifestUrl: 'https://v3-cinemeta.strem.io/manifest.json',
  catalogs: [
    { id: 'top', type: 'movie', name: 'Popular', extraSupported: ['search', 'genre', 'skip'] },
    { id: 'top', type: 'series', name: 'Popular', extraSupported: ['search', 'genre', 'skip'] },
    { id: 'year', type: 'movie', name: 'New', extraSupported: ['search', 'genre', 'skip'] },
    { id: 'year', type: 'series', name: 'New', extraSupported: ['search', 'genre', 'skip'] },
  ],
};

const addonsInitial = {
  installed: [SHOWCASE_ADDON, CINEMETA_ADDON] as AddonInfo[],
  enabled: { [SHOWCASE_ADDON.id]: true, [CINEMETA_ADDON.id]: true } as Record<string, boolean>,
};

export const useAddons = create<AddonsState>()(
  persist(
    (set, get) => ({
      ...addonsInitial,
      installAddon: (info) =>
        set((s) =>
          s.installed.some((a) => a.id === info.id)
            ? s
            : {
                installed: [...s.installed, info],
                enabled: { ...s.enabled, [info.id]: true },
              },
        ),
      removeAddon: (id) =>
        set((s) => {
          if (!s.installed.some((a) => a.id === id) || id === SHOWCASE_ADDON.id) return s;
          const enabled = { ...s.enabled };
          delete enabled[id];
          return { installed: s.installed.filter((a) => a.id !== id), enabled };
        }),
      reorderAddons: (orderedIds) =>
        set((s) => {
          const rank = new Map(orderedIds.map((id, i) => [id, i]));
          const installed = [...s.installed].sort(
            (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999),
          );
          return { installed };
        }),
      setAddonEnabled: (id, enabled) =>
        set((s) =>
          s.installed.some((a) => a.id === id)
            ? { enabled: { ...s.enabled, [id]: enabled } }
            : s,
        ),
      isEnabled: (id) => Boolean(get().enabled[id]),
    }),
    {
      name: 'elitebox.v1.addons',
      storage: scopedStorage('addons'),
      /* Migration: inject the bundled Cinemeta addon for users who installed
         before it shipped (deduped by id, never overriding their state). */
      merge: (persisted, current) => {
        const p = (persisted as Partial<AddonsState> | undefined) ?? {};
        const installed = [...(p.installed ?? current.installed)];
        if (!installed.some((a) => a.id === CINEMETA_ADDON.id)) {
          installed.push(CINEMETA_ADDON);
        }
        return {
          ...current,
          ...p,
          installed,
          enabled: { ...current.enabled, ...(p.enabled ?? {}), [CINEMETA_ADDON.id]: p.enabled?.[CINEMETA_ADDON.id] ?? true },
        };
      },
    },
  ),
);

/* ── Settings ──────────────────────────────────────────────────────────── */

export interface EliteSettings {
  general: {
    language: 'en' | 'nl'; // interface language (i18n provider reads this)
  };
  appearance: {
    ambience: boolean; // particle ambience layer
    grain: boolean;
  };
  playback: {
    autoplayNext: boolean;
    defaultSpeed: number;
    preferredQuality: 'auto' | 'HD' | '4K' | 'SD';
    hardwareAccel: boolean;
    ambient: boolean; // lunar glow halo behind the player video
  };
  subtitles: {
    enabled: boolean;
    preferredLang: string;
    size: 'small' | 'normal' | 'large';
    color: 'ink' | 'cyan' | 'yellow';
    bg: 'none' | 'scrim' | 'solid';
    weight: 'normal' | 'semibold' | 'bold';
    outline: boolean;
  };
  cache: {
    maxGb: number;
  };
  streaming: {
    /**
     * off: magnet/torrent UI hidden. metadata: the browser app reads torrent
     * metadata only (no peer-to-peer — impossible in a browser). desktop:
     * the Elitebox desktop shell does local peer-to-peer for legal sources.
     */
    torrentProfile: 'off' | 'metadata' | 'desktop';
    maxCacheGb: number;
  };
}

export const DEFAULT_SETTINGS: EliteSettings = {
  general: { language: 'en' },
  appearance: { ambience: true, grain: true },
  playback: { autoplayNext: true, defaultSpeed: 1, preferredQuality: 'auto', hardwareAccel: true, ambient: true },
  subtitles: {
    enabled: true,
    preferredLang: 'en',
    size: 'normal',
    color: 'ink',
    bg: 'scrim',
    weight: 'semibold',
    outline: true,
  },
  cache: { maxGb: 4 },
  streaming: { torrentProfile: 'metadata', maxCacheGb: 4 },
};

interface SettingsState {
  settings: EliteSettings;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  patchSettings: (patch: Partial<EliteSettings>) => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
  resetAll: () => void;
}

/* ── data export / import (stremio data_export parity) ───────────────────
   Export snapshots the live slices of every persisted store — the same
   data the persist middleware writes to localStorage — into one versioned
   JSON document. Import validates the document shape strictly, builds a
   full restore plan FIRST (a corrupt slice fails the whole import, never a
   partial apply), then restores each slice through the store's own
   setState; the persist middleware writes it back to the correct
   profile-scoped key, reload-free. Legacy v1 exports (raw localStorage
   dump under `data`) remain importable. */

interface ImportPlan {
  profiles?: { profiles: Profile[]; activeProfileId: string | null };
  library?: {
    watchlist: string[];
    favorites: string[];
    watched: string[];
    continueWatching: ContinueWatchingEntry[];
    savedMagnets: SavedMagnet[];
    historyPaused: boolean;
  };
  playback?: { byTitle: Record<string, PlaybackMemoryEntry> };
  addons?: { installed: AddonInfo[]; enabled: Record<string, boolean> };
  settings?: { settings: EliteSettings; onboarded: boolean };
}

function isStrArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function validCwEntry(e: unknown): e is ContinueWatchingEntry {
  if (!e || typeof e !== 'object') return false;
  const x = e as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    (x.type === 'movie' || x.type === 'series' || x.type === 'channel') &&
    typeof x.progressSec === 'number' &&
    typeof x.durationSec === 'number' &&
    typeof x.updatedAt === 'number'
  );
}

function validSavedMagnet(m: unknown): m is SavedMagnet {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  return (
    typeof x.infoHash === 'string' &&
    typeof x.name === 'string' &&
    typeof x.magnetUri === 'string' &&
    typeof x.addedAt === 'number'
  );
}

function validProfile(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false;
  const x = p as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    x.id.length > 0 &&
    typeof x.name === 'string' &&
    typeof x.avatar === 'string' &&
    (x.pin === undefined || typeof x.pin === 'string') &&
    (x.createdAt === undefined || typeof x.createdAt === 'number')
  );
}

function sanitizeAddon(a: unknown): AddonInfo | undefined {
  if (!a || typeof a !== 'object') return undefined;
  const x = a as Record<string, unknown>;
  if (typeof x.id !== 'string' || !x.id) return undefined;
  if (typeof x.name !== 'string' || !x.name) return undefined;
  return {
    id: x.id,
    name: x.name,
    version: typeof x.version === 'string' ? x.version : '0.0.0',
    description: typeof x.description === 'string' ? x.description : '',
    icon: typeof x.icon === 'string' && x.icon ? x.icon : '/art/addon-icon-cinema.jpg',
    resources: isStrArray(x.resources) ? x.resources : [],
    manifestUrl: typeof x.manifestUrl === 'string' ? x.manifestUrl : undefined,
    builtin: x.builtin === true ? true : undefined,
    catalogs: Array.isArray(x.catalogs)
      ? (x.catalogs.filter(
          (c) =>
            c &&
            typeof c === 'object' &&
            typeof (c as { id?: unknown }).id === 'string' &&
            typeof (c as { type?: unknown }).type === 'string',
        ) as AddonInfo['catalogs'])
      : undefined,
    permissions: isStrArray(x.permissions) ? x.permissions : undefined,
    privacy:
      x.privacy && typeof x.privacy === 'object' ? (x.privacy as AddonInfo['privacy']) : undefined,
    legal: x.legal && typeof x.legal === 'object' ? (x.legal as AddonInfo['legal']) : undefined,
  };
}

/** Validate every slice and build the restore plan; undefined = reject the file. */
function buildImportPlan(slices: unknown): ImportPlan | undefined {
  if (!slices || typeof slices !== 'object') return undefined;
  const s = slices as Record<string, unknown>;
  const KNOWN = ['profiles', 'library', 'playback', 'addons', 'settings'];
  if (!KNOWN.some((k) => s[k] !== undefined)) return undefined;
  const plan: ImportPlan = {};

  if (s.profiles !== undefined) {
    const p = s.profiles as Record<string, unknown>;
    if (!p || typeof p !== 'object') return undefined;
    if (!Array.isArray(p.profiles) || !p.profiles.every(validProfile)) return undefined;
    if (p.activeProfileId !== null && p.activeProfileId !== undefined && typeof p.activeProfileId !== 'string') {
      return undefined;
    }
    const profiles = (p.profiles as Profile[]).map((pr) => ({
      ...pr,
      createdAt: typeof pr.createdAt === 'number' ? pr.createdAt : Date.now(),
    }));
    const requested = typeof p.activeProfileId === 'string' ? p.activeProfileId : null;
    plan.profiles = {
      profiles,
      activeProfileId:
        requested && profiles.some((x) => x.id === requested) ? requested : (profiles[0]?.id ?? null),
    };
  }

  if (s.library !== undefined) {
    const l = s.library as Record<string, unknown>;
    if (!l || typeof l !== 'object') return undefined;
    if (!isStrArray(l.watchlist) || !isStrArray(l.favorites) || !isStrArray(l.watched)) return undefined;
    if (!Array.isArray(l.continueWatching) || !l.continueWatching.every(validCwEntry)) return undefined;
    if (!Array.isArray(l.savedMagnets) || !l.savedMagnets.every(validSavedMagnet)) return undefined;
    if (l.historyPaused !== undefined && typeof l.historyPaused !== 'boolean') return undefined;
    plan.library = {
      watchlist: l.watchlist,
      favorites: l.favorites,
      watched: l.watched,
      continueWatching: l.continueWatching,
      savedMagnets: l.savedMagnets,
      historyPaused: typeof l.historyPaused === 'boolean' ? l.historyPaused : false,
    };
  }

  if (s.playback !== undefined) {
    const p = s.playback as Record<string, unknown>;
    if (!p || typeof p !== 'object') return undefined;
    if (!p.byTitle || typeof p.byTitle !== 'object' || Array.isArray(p.byTitle)) return undefined;
    const byTitle: Record<string, PlaybackMemoryEntry> = {};
    for (const [k, v] of Object.entries(p.byTitle as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') return undefined;
      const e = v as Record<string, unknown>;
      if (e.speed !== undefined && typeof e.speed !== 'number') return undefined;
      if (e.subOffsetSec !== undefined && typeof e.subOffsetSec !== 'number') return undefined;
      byTitle[k] = {
        speed: typeof e.speed === 'number' ? e.speed : 1,
        audioTrack: typeof e.audioTrack === 'string' ? e.audioTrack : undefined,
        subTrack: typeof e.subTrack === 'string' ? e.subTrack : undefined,
        subOffsetSec: typeof e.subOffsetSec === 'number' ? e.subOffsetSec : 0,
      };
    }
    plan.playback = { byTitle };
  }

  if (s.addons !== undefined) {
    const a = s.addons as Record<string, unknown>;
    if (!a || typeof a !== 'object' || !Array.isArray(a.installed)) return undefined;
    const installed = a.installed.map(sanitizeAddon);
    if (installed.some((x) => x === undefined)) return undefined; // corrupt entry → reject file
    let list = installed as AddonInfo[];
    if (!list.some((x) => x.id === SHOWCASE_ADDON.id)) list = [SHOWCASE_ADDON, ...list];
    const enabled: Record<string, boolean> = { [SHOWCASE_ADDON.id]: true };
    if (a.enabled && typeof a.enabled === 'object' && !Array.isArray(a.enabled)) {
      for (const [k, v] of Object.entries(a.enabled as Record<string, unknown>)) {
        if (typeof v === 'boolean' && list.some((x) => x.id === k)) enabled[k] = v;
      }
    }
    for (const addon of list) if (!(addon.id in enabled)) enabled[addon.id] = true;
    plan.addons = { installed: list, enabled };
  }

  if (s.settings !== undefined) {
    const st = s.settings as Record<string, unknown>;
    if (!st || typeof st !== 'object') return undefined;
    if (!st.settings || typeof st.settings !== 'object' || Array.isArray(st.settings)) return undefined;
    if (st.onboarded !== undefined && typeof st.onboarded !== 'boolean') return undefined;
    const ps = st.settings as Partial<EliteSettings>;
    plan.settings = {
      onboarded: typeof st.onboarded === 'boolean' ? st.onboarded : false,
      /* Same deep-merge-over-defaults style as the persist merge above, so a
         slice exported before a new settings section shipped never restores
         with missing keys. */
      settings: {
        general: { ...DEFAULT_SETTINGS.general, ...(ps.general ?? {}) },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...(ps.appearance ?? {}) },
        playback: { ...DEFAULT_SETTINGS.playback, ...(ps.playback ?? {}) },
        subtitles: { ...DEFAULT_SETTINGS.subtitles, ...(ps.subtitles ?? {}) },
        cache: { ...DEFAULT_SETTINGS.cache, ...(ps.cache ?? {}) },
        streaming: { ...DEFAULT_SETTINGS.streaming, ...(ps.streaming ?? {}) },
      },
    };
  }

  return plan;
}

/** Apply a validated plan via each store's own setState (persist writes back). */
function applyImportPlan(plan: ImportPlan): void {
  /* Profiles first: the active-profile id decides which scoped namespace
     the following slice writes land in. */
  if (plan.profiles) useProfiles.setState(plan.profiles);
  if (plan.library) useLibrary.setState(plan.library);
  if (plan.playback) usePlaybackMemory.setState(plan.playback);
  if (plan.addons) useAddons.setState(plan.addons);
  if (plan.settings) useSettings.setState(plan.settings);
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),
      patchSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            general: { ...s.settings.general, ...(patch.general ?? {}) },
            appearance: { ...s.settings.appearance, ...(patch.appearance ?? {}) },
            playback: { ...s.settings.playback, ...(patch.playback ?? {}) },
            subtitles: { ...s.settings.subtitles, ...(patch.subtitles ?? {}) },
            cache: { ...s.settings.cache, ...(patch.cache ?? {}) },
            streaming: { ...s.settings.streaming, ...(patch.streaming ?? {}) },
          },
        })),
      exportConfig: () => {
        const lib = useLibrary.getState();
        const mem = usePlaybackMemory.getState();
        const ad = useAddons.getState();
        const prof = useProfiles.getState();
        return JSON.stringify(
          {
            app: 'elitebox',
            version: 2,
            exportedAt: Date.now(),
            slices: {
              profiles: { profiles: prof.profiles, activeProfileId: prof.activeProfileId },
              library: {
                watchlist: lib.watchlist,
                favorites: lib.favorites,
                watched: lib.watched,
                continueWatching: lib.continueWatching,
                savedMagnets: lib.savedMagnets,
                historyPaused: lib.historyPaused,
              },
              playback: { byTitle: mem.byTitle },
              addons: { installed: ad.installed, enabled: ad.enabled },
              settings: { settings: get().settings, onboarded: get().onboarded },
            },
          },
          null,
          2,
        );
      },
      importConfig: (json) => {
        try {
          const parsed = JSON.parse(json) as {
            app?: string;
            slices?: unknown;
            data?: Record<string, string>;
          };
          if (!parsed || typeof parsed !== 'object' || parsed.app !== 'elitebox') return false;
          /* v2: validated slices restored through the stores' own setState. */
          if (parsed.slices !== undefined) {
            const plan = buildImportPlan(parsed.slices);
            if (!plan) return false;
            applyImportPlan(plan);
            return true;
          }
          /* v1 (legacy elitebox-config.json): raw localStorage dump — write
             the keys back, then rebind every scoped store from storage. */
          if (parsed.data && typeof parsed.data === 'object') {
            for (const [k, v] of Object.entries(parsed.data)) {
              if (k.startsWith(KEY_PREFIX) && typeof v === 'string') localStorage.setItem(k, v);
            }
            rebindScopedStores();
            /* Best-effort: persist attaches its api only when storage was
               available at store creation — never let it decide honesty. */
            useProfiles.persist?.rehydrate();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      resetAll: () => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
        useLibrary.setState({ ...libraryInitial });
        usePlaybackMemory.setState({ byTitle: {} });
        useAddons.setState({ installed: [...addonsInitial.installed], enabled: { ...addonsInitial.enabled } });
        set({ settings: DEFAULT_SETTINGS, onboarded: false });
        useProfiles.setState({ profiles: [], activeProfileId: null });
      },
    }),
    {
      name: 'elitebox.v1.settings',
      storage: scopedStorage('settings'),
      merge: (persisted, current) => {
        const p = (persisted as Partial<SettingsState> | undefined) ?? {};
        const ps = (p.settings ?? {}) as Partial<EliteSettings>;
        return {
          ...current,
          ...p,
          settings: {
            general: { ...DEFAULT_SETTINGS.general, ...(ps.general ?? {}) },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...(ps.appearance ?? {}) },
            playback: { ...DEFAULT_SETTINGS.playback, ...(ps.playback ?? {}) },
            subtitles: { ...DEFAULT_SETTINGS.subtitles, ...(ps.subtitles ?? {}) },
            cache: { ...DEFAULT_SETTINGS.cache, ...(ps.cache ?? {}) },
            streaming: { ...DEFAULT_SETTINGS.streaming, ...(ps.streaming ?? {}) },
          },
        };
      },
    },
  ),
);

/* ── Profile rebinding ─────────────────────────────────────────────────── */

function rebindFromStorage<T extends object>(
  store: { setState: (s: Partial<T>) => void },
  storeName: string,
  initial: Partial<T>,
): void {
  const key = scopedKey(storeName);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: Partial<T> };
      store.setState({ ...initial, ...(parsed.state ?? {}) });
      return;
    } catch {
      /* fall through to initial */
    }
  }
  store.setState(initial);
}

/**
 * Settings rebind deep-merges every section over DEFAULT_SETTINGS (same
 * style as the persist merge above) so a slice persisted before a new
 * section shipped can never rehydrate with missing keys.
 */
function rebindSettings(): void {
  const raw = localStorage.getItem(scopedKey('settings'));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        state?: { settings?: Partial<EliteSettings>; onboarded?: boolean };
      };
      const ps = parsed.state?.settings ?? {};
      useSettings.setState({
        onboarded: parsed.state?.onboarded ?? false,
        settings: {
          general: { ...DEFAULT_SETTINGS.general, ...(ps.general ?? {}) },
          appearance: { ...DEFAULT_SETTINGS.appearance, ...(ps.appearance ?? {}) },
          playback: { ...DEFAULT_SETTINGS.playback, ...(ps.playback ?? {}) },
          subtitles: { ...DEFAULT_SETTINGS.subtitles, ...(ps.subtitles ?? {}) },
          cache: { ...DEFAULT_SETTINGS.cache, ...(ps.cache ?? {}) },
          streaming: { ...DEFAULT_SETTINGS.streaming, ...(ps.streaming ?? {}) },
        },
      });
      return;
    } catch {
      /* fall through to initial */
    }
  }
  useSettings.setState({ settings: DEFAULT_SETTINGS, onboarded: false });
}

function rebindScopedStores(): void {
  rebindFromStorage<LibraryState>(useLibrary as never, 'library', { ...libraryInitial });
  rebindFromStorage<PlaybackMemoryState>(usePlaybackMemory as never, 'playback', { byTitle: {} });
  rebindFromStorage<AddonsState>(useAddons as never, 'addons', {
    installed: [...addonsInitial.installed],
    enabled: { ...addonsInitial.enabled },
  });
  rebindSettings();
}

/** Convenience selector: continue-watching progress ratio for a title. */
export function selectProgress(
  s: { continueWatching: ContinueWatchingEntry[] },
  id: string,
): number | undefined {
  const e = s.continueWatching.find((x) => x.id === id);
  return e && e.durationSec > 0 ? e.progressSec / e.durationSec : undefined;
}
