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
import type { AddonInfo } from './types';

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
    getItem: (name: string) => localStorage.getItem(scopedKey(storeName)),
    setItem: (name: string, value: string) => {
      localStorage.setItem(scopedKey(storeName), value);
    },
    removeItem: (name: string) => localStorage.removeItem(scopedKey(storeName)),
  }));
}

// --- Stores ---

export const useProfiles = create<any>()(
  persist(
    (set) => ({
      profiles: [],
      activeProfileId: DEFAULT_PROFILE_ID,
      switchProfile: (id: string) => set({ activeProfileId: id }),
    }),
    {
      name: KEY_PREFIX + 'profiles',
    }
  )
);

export const useSettings = create<any>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'dark',
    }),
    {
      name: 'settings',
      storage: scopedStorage('settings'),
    }
  )
);

export const useAddons = create<any>()(
  persist(
    (set) => ({
      installed: [],
    }),
    {
      name: 'addons',
      storage: scopedStorage('addons'),
    }
  )
);

export const useLibrary = create<any>()(
  persist(
    (set) => ({
      items: [],
    }),
    {
      name: 'library',
      storage: scopedStorage('library'),
    }
  )
);

export const usePlayback = create<any>()(
  persist(
    (set) => ({
      history: {},
    }),
    {
      name: 'playback',
      storage: scopedStorage('playback'),
    }
  )
);

export default useSettings;
