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
  type ReactNode
} from 'react';

import DICTS from './locales';
import useSettings from '../lib/store';

export type Locale = 'en' | 'nl';

export type TranslateVars = Record<string, string | number>;

export type TFunction = (key: string, vars?: TranslateVars) => string;

export interface I18nValue {
  t: TFunction;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const locale = (settings?.general?.language as Locale) || 'en';

  const setLocale = useCallback((l: Locale) => {
    updateSettings({ general: { ...settings.general, language: l } });
  }, [settings, updateSettings]);

  const t: TFunction = useCallback((key, vars) => {
    const [ns, ...pathParts] = key.split('.');
    const path = pathParts.join('.');

    const getVal = (l: Locale) => {
      const dict = (DICTS as any)[l]?.[ns];
      if (!dict) return null;
      return path.split('.').reduce((obj, key) => obj?.[key], dict);
    };

    let val = getVal(locale);

    if (val === undefined || val === null) {
      if (locale !== 'en') {
        val = getVal('en');
        if (val !== undefined && val !== null) {
          if (import.meta.env.DEV) {
            console.warn(`[i18n] Fallback to 'en' for key: ${key}`);
          }
        }
      }
    }

    if (val === undefined || val === null) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key: ${key}`);
      }
      return key;
    }

    if (typeof val !== 'string') return key;

    if (vars) {
      return Object.entries(vars).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`{{s*${k}s*}}`, 'g'), String(v));
      }, val);
    }

    return val;
  }, [locale]);

  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useT must be used within an I18nProvider');
  }
  return ctx;
}
