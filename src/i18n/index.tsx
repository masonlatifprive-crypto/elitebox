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
import { DICTS } from './locales';
import { useSettings } from '../lib/store';


export type Locale = 'en' | 'nl';


export type TranslateVars = Record<string, string | number>;


export type TFunction = (key: string, vars?: TranslateVars) => string;


export interface I18nValue {
  t: TFunction;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}
