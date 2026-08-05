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

interface SettingsState {
  locale: string;
  setLocale: (l: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'settings',
      storage: scopedStorage('settings'),
    }
  )
);

interface ProfilesState {
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
}

export const useProfiles = create<ProfilesState>()(
  persist(
    (set) => ({
      activeProfileId: DEFAULT_PROFILE_ID,
      setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
    }),
    {
      name: 'profiles',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSettings;
