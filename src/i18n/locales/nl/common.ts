/**
 * common namespace (nl) — Dutch mirror of `../en/common.ts`. Any key omitted
 * here falls back to the English string at runtime (dev-only warning), but
 * keep the two files in sync: this is a Dutch product, fallback is a crutch.
 */
import type enCommon from '../en/common';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};

export default {
  nav: {
    navLabel: 'Marketing',
    home: 'Elitebox-home',
    movies: 'Films & series',
    sports: 'Live sport',
    store: 'Winkel',
    support: 'Support',
    openApp: 'App openen',
    profiles: 'Profielen',
    commandPalette: 'Opdrachtenmenu',
    openCommandPalette: 'Opdrachtenmenu openen',
    openMenu: 'Menu openen',
    closeMenu: 'Menu sluiten',
  },
  language: {
    label: 'Taal',
    change: 'Taal wijzigen',
    english: 'English',
    dutch: 'Nederlands',
  },
  footer: {
    tagline: 'Alles wat je kijkt. Op één plek.',
    explore: 'Ontdekken',
    product: 'Product',
    legal: 'Juridisch',
    features: 'Functies',
    downloads: 'Downloads',
    technology: 'Technologie',
    addonSdk: 'Addon-SDK',
    updatesStatus: 'Updates & status',
    helpCenter: 'Helpcentrum',
    privacy: 'Privacy',
    terms: 'Voorwaarden',
    cookies: 'Cookies',
    security: 'Beveiliging',
    openContentLicenses: 'Licenties voor open content',
    credits:
      'Showcasefilms © Blender Foundation, CC-BY 3.0 — Big Buck Bunny, Sintel, Tears of ' +
      'Steel, Elephants Dream, Cosmos Laundromat, Caminandes 1–3, Agent 327, Sprite Fright, ' +
      'Charge, Wing It!',
    bottomLine: 'Films, series en livezenders. Op één plek.',
  },
  settings: {
    language: 'Taal',
    languageDesc: 'De interfacetaal van Elitebox op dit apparaat.',
  },
  buttons: {
    save: 'Opslaan',
    cancel: 'Annuleren',
    close: 'Sluiten',
    back: 'Terug',
    search: 'Zoeken',
    signIn: 'Inloggen',
    createAccount: 'Account aanmaken',
  },
  toasts: {
    genericError: 'Er ging iets mis — probeer het opnieuw',
  },
} satisfies DeepPartial<typeof enCommon>;
