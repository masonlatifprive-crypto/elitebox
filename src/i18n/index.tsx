/**
 * i18n — custom EN/NL layer (no dependencies).
 *
 * The zustand settings store (`settings.general.language`) is the source of
 * truth once mounted: the provider reads it reactively, so profile switches,
 * config imports and resets all flow through automatically. The default
 * locale is always 'en' (owner directive) — Dutch is only active when the
 * user picks it explicitly via the language switcher; there is no browser
 * language auto-detection.
 *
 * Usage:
 *   const { t, locale, setLocale } = useT();
 *   t('common.nav.movies')
 *   t('app.home.greeting', { name: profile.name }) // {{name}} interpolation
 *
 * Keys are `<namespace>.<path>`; namespaces map to files under
 * `src/i18n/locales/<locale>/<namespace>.ts`. A missing `nl` key falls back to
 * `en` (dev-only console warning); a key missing in both renders the key
 * itself (dev-only warning), never a crash.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import DICTS from './locales';
import useSettings from '../lib/store';

export type Locale = 'en' | 'nl';

export type TranslateVars = Record<string, string | number>;

interface I18nContextType {
  t: (key: string, vars?: TranslateVars) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { general, updateGeneral } = useSettings();
  const locale = (general.language as Locale) || 'en';

  const setLocale = useCallback(
    (l: Locale) => {
      updateGeneral({ language: l });
    },
    [updateGeneral]
  );

  const t = useCallback(
    (key: string, vars?: TranslateVars) => {
      const [ns, ...rest] = key.split('.');
      const path = rest.join('.');

      const dict = DICTS[locale] || DICTS.en;
      let val = (dict as any)[ns]?.[path];

      if (!val && locale !== 'en') {
        val = (DICTS.en as any)[ns]?.[path];
      }

      if (!val) return key;

      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          val = val.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
      }

      return val;
    },
    [locale]
  );

  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx;
}

export default useT;
