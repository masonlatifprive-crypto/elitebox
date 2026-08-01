/**
 * common namespace (en) — strings shared across shells: nav, footer, buttons,
 * auth labels, settings labels, toasts. Keys merge under `common.*`, so write
 * them without the prefix here. Follow-up agents: add keys to THIS structure;
 * keep Dutch in sync in `../nl/common.ts` (missing nl keys fall back to en
 * with a dev-only console warning).
 */
export default {
  nav: {
    navLabel: 'Marketing',
    home: 'Elitebox home',
    movies: 'Movies & Shows',
    sports: 'Live Sports',
    store: 'Store',
    support: 'Support',
    openApp: 'Open App',
    profiles: 'Profiles',
    commandPalette: 'Command palette',
    openCommandPalette: 'Open command palette',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  language: {
    label: 'Language',
    change: 'Change language',
    english: 'English',
    dutch: 'Nederlands',
  },
  footer: {
    tagline: 'Everything you watch. One place.',
    explore: 'Explore',
    product: 'Product',
    legal: 'Legal',
    features: 'Features',
    downloads: 'Downloads',
    technology: 'Technology',
    addonSdk: 'Addon SDK',
    updatesStatus: 'Updates & Status',
    helpCenter: 'Help center',
    privacy: 'Privacy',
    terms: 'Terms',
    cookies: 'Cookies',
    security: 'Security',
    openContentLicenses: 'Open Content Licenses',
    credits:
      'Showcase films © Blender Foundation, CC-BY 3.0 — Big Buck Bunny, Sintel, Tears of ' +
      'Steel, Elephants Dream, Cosmos Laundromat, Caminandes 1–3, Agent 327, Sprite Fright, ' +
      'Charge, Wing It!',
    bottomLine: 'Movies, shows, and live channels. One place.',
  },
  settings: {
    language: 'Language',
    languageDesc: 'Interface language for Elitebox on this device.',
  },
  buttons: {
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    search: 'Search',
    signIn: 'Sign in',
    createAccount: 'Create account',
  },
  toasts: {
    genericError: 'Something went wrong — try again',
  },
} as const;
