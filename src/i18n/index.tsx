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
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { DICTS } from '@/i18n/locales';
import { useSettings } from '@/lib/store';

export type Locale = 'en' | 'nl';

export type TranslateVars = Record<string, string | number>;

export type TFunction = (key: string, vars?: TranslateVars) => string;

export interface I18nValue {
  t: TFunction;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

const VAR_RE = /\{\{\s*(\w+)\s*\}\}/g;

function interpolate(message: string, vars?: TranslateVars): string {
  if (!vars) return message;
  return message.replace(VAR_RE, (raw, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : raw,
  );
}

function translate(locale: Locale, key: string, vars?: TranslateVars): string {
  let message = DICTS[locale][key];
  if (message === undefined && locale !== 'en') {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] missing "${locale}" key "${key}" — falling back to en`);
    }
    message = DICTS.en[key];
  }
  if (message === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key "${key}"`);
    return key;
  }
  return interpolate(message, vars);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSettings((s) => s.settings.general.language);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    useSettings.getState().patchSettings({ general: { language: next } });
  }, []);

  const t = useCallback<TFunction>((key, vars) => translate(locale, key, vars), [locale]);

  const value = useMemo<I18nValue>(() => ({ t, locale, setLocale }), [t, locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
}
