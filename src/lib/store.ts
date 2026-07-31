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

interface LibraryState {
  watchlist: string[];
  favorites: string[];
  watched: string[];
  continueWatching: ContinueWatchingEntry[];
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
  isWatchlisted: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  isWatched: (id: string) => boolean;
}

const libraryInitial = {
  watchlist: [] as string[],
  favorites: [] as string[],
  watched: [] as string[],
  continueWatching: [] as ContinueWatchingEntry[],
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
}

export const DEFAULT_SETTINGS: EliteSettings = {
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

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),
      patchSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            appearance: { ...s.settings.appearance, ...(patch.appearance ?? {}) },
            playback: { ...s.settings.playback, ...(patch.playback ?? {}) },
            subtitles: { ...s.settings.subtitles, ...(patch.subtitles ?? {}) },
            cache: { ...s.settings.cache, ...(patch.cache ?? {}) },
          },
        })),
      exportConfig: () => {
        const dump: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(KEY_PREFIX)) {
            const v = localStorage.getItem(k);
            if (v !== null) dump[k] = v;
          }
        }
        return JSON.stringify({ app: 'elitebox', version: 1, exportedAt: Date.now(), data: dump }, null, 2);
      },
      importConfig: (json) => {
        try {
          const parsed = JSON.parse(json) as { app?: string; data?: Record<string, string> };
          if (parsed.app !== 'elitebox' || !parsed.data || typeof parsed.data !== 'object') return false;
          for (const [k, v] of Object.entries(parsed.data)) {
            if (k.startsWith(KEY_PREFIX) && typeof v === 'string') localStorage.setItem(k, v);
          }
          rebindScopedStores();
          useProfiles.persist.rehydrate();
          return true;
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
            appearance: { ...DEFAULT_SETTINGS.appearance, ...(ps.appearance ?? {}) },
            playback: { ...DEFAULT_SETTINGS.playback, ...(ps.playback ?? {}) },
            subtitles: { ...DEFAULT_SETTINGS.subtitles, ...(ps.subtitles ?? {}) },
            cache: { ...DEFAULT_SETTINGS.cache, ...(ps.cache ?? {}) },
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

function rebindScopedStores(): void {
  rebindFromStorage<LibraryState>(useLibrary as never, 'library', { ...libraryInitial });
  rebindFromStorage<PlaybackMemoryState>(usePlaybackMemory as never, 'playback', { byTitle: {} });
  rebindFromStorage<AddonsState>(useAddons as never, 'addons', {
    installed: [...addonsInitial.installed],
    enabled: { ...addonsInitial.enabled },
  });
  rebindFromStorage<SettingsState>(useSettings as never, 'settings', {
    settings: DEFAULT_SETTINGS,
    onboarded: false,
  });
}

/** Convenience selector: continue-watching progress ratio for a title. */
export function selectProgress(
  s: { continueWatching: ContinueWatchingEntry[] },
  id: string,
): number | undefined {
  const e = s.continueWatching.find((x) => x.id === id);
  return e && e.durationSec > 0 ? e.progressSec / e.durationSec : undefined;
}
