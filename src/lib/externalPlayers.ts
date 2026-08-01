/**
 * External player deep links — Stremio-parity "open in external player".
 *
 * Honesty notes (same contract as lib/cast.ts — never lie about capability):
 * - Every deep link only works when the target app is actually installed;
 *   the browser cannot detect that upfront, so availability always reads
 *   "Opens if installed" and the menu offers clipboard fallbacks.
 * - Only well-documented URL schemes are shipped (VLC, Infuse, nPlayer,
 *   Android intents for MX Player / Just Player). There is NO reliable
 *   desktop protocol handler for mpv, so mpv is a clipboard action that
 *   copies the ready-to-run `mpv "<url>"` command — not a fake deep link.
 * - Magnet URIs (Torrent-type sources, legal sources only per the engine's
 *   blocklist + HTTPS policy) are never wrapped in deep links that would
 *   just fail silently; players get honest copy actions instead.
 */

export type ExternalPlatform = 'android' | 'ios' | 'desktop';

/** UA-based platform detection. SSR-safe (defaults to 'desktop'). */
export function detectPlatform(ua?: string): ExternalPlatform {
  const s = (ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  if (/android/.test(s)) return 'android';
  /* iPadOS 13+ reports as Macintosh but still has touch; check platform too */
  if (/iphone|ipod|ipad/.test(s)) return 'ios';
  if (
    /macintosh/.test(s) &&
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints ?? 0) > 1
  ) {
    return 'ios';
  }
  return 'desktop';
}

/** True for Torrent-type sources surfaced as magnet URIs. */
export function isMagnetUri(url: string): boolean {
  return url.trim().toLowerCase().startsWith('magnet:');
}

/** lucide-react icon names (resolved to components by the menu). */
export type ExternalPlayerIcon =
  | 'Play'
  | 'Tv'
  | 'Smartphone'
  | 'Terminal'
  | 'Copy'
  | 'ExternalLink';

export interface ExternalPlayerDef {
  id: string;
  /**
   * Proper player name (VLC, Infuse, …) — brand names stay untranslated.
   * Absent → `nameKey` holds the i18n key (clipboard fallback entries).
   */
  name?: string;
  /** i18n key (app.external.fallback.*) for non-brand entry names. */
  nameKey?: string;
  /** Platforms the entry is offered on. */
  platforms: ExternalPlatform[];
  /** lucide-react icon name, resolved in ExternalPlayerMenu. */
  icon: ExternalPlayerIcon;
  /** i18n key for the honest capability wording (app.external.availability.*). */
  availabilityKey: string;
  /** i18n key for the one-line note under the name (app.external.note.*). */
  noteKey?: string;
  /**
   * Deep-link builder for scheme/intent players. Absent → the entry is a
   * clipboard action driven by `buildClipboard` instead.
   */
  buildUrl?: (streamUrl: string, title?: string, platform?: ExternalPlatform) => string;
  /** Clipboard payload builder (mpv command, bare URL, magnet). */
  buildClipboard?: (streamUrl: string, title?: string) => string;
  /** Hand the URL to a new browser tab instead of a custom scheme. */
  opensInNewTab?: boolean;
  /**
   * Behaviour for magnet-URI (Torrent-type) sources: 'copy' turns the entry
   * into a clipboard hand-off, 'omit' hides it. Default: 'omit'.
   */
  magnets?: 'copy' | 'omit';
  /** i18n key for the note override when handing a magnet to the clipboard. */
  magnetNoteKey?: string;
}

const OPENS_IF_INSTALLED = 'app.external.availability.opensIfInstalled';

function enc(s: string): string {
  return encodeURIComponent(s);
}

/** Android intent URI — documented Chrome intent syntax. */
function androidIntent(streamUrl: string, title: string | undefined, pkg: string): string {
  const t = title && title.length > 0 ? title : 'Elitebox stream';
  return `intent:${streamUrl}#Intent;package=${pkg};S.title=${enc(t)};end`;
}

export const EXTERNAL_PLAYERS: ExternalPlayerDef[] = [
  {
    id: 'vlc',
    name: 'VLC',
    platforms: ['android', 'ios'],
    icon: 'Play',
    availabilityKey: OPENS_IF_INSTALLED,
    noteKey: 'app.external.note.vlc',
    /* vlc://<url> on Android; the documented x-callback variant on iOS. */
    buildUrl: (streamUrl, _title, platform) =>
      platform === 'ios'
        ? `vlc-x-callback://x-callback-url/stream?url=${enc(streamUrl)}`
        : `vlc://${streamUrl}`,
    /* mobile VLC 3.4+ can stream magnets; clipboard keeps it honest elsewhere */
    magnets: 'copy',
    magnetNoteKey: 'app.external.magnetNote.vlc',
  },
  {
    id: 'infuse',
    name: 'Infuse',
    platforms: ['ios'],
    icon: 'Tv',
    availabilityKey: OPENS_IF_INSTALLED,
    noteKey: 'app.external.note.infuse',
    buildUrl: (streamUrl) => `infuse://x-callback-url/play?url=${enc(streamUrl)}`,
  },
  {
    id: 'nplayer',
    name: 'nPlayer',
    platforms: ['ios'],
    icon: 'Play',
    availabilityKey: OPENS_IF_INSTALLED,
    noteKey: 'app.external.note.nplayer',
    /* nPlayer's documented scheme is the URL prefixed with "nplayer-" */
    buildUrl: (streamUrl) => `nplayer-${streamUrl}`,
  },
  {
    id: 'mxplayer',
    name: 'MX Player',
    platforms: ['android'],
    icon: 'Smartphone',
    availabilityKey: OPENS_IF_INSTALLED,
    noteKey: 'app.external.note.mxplayer',
    buildUrl: (streamUrl, title) =>
      androidIntent(streamUrl, title, 'com.mxtech.videoplayer.ad'),
  },
  {
    id: 'justplayer',
    name: 'Just Player',
    platforms: ['android'],
    icon: 'Smartphone',
    availabilityKey: OPENS_IF_INSTALLED,
    noteKey: 'app.external.note.justplayer',
    buildUrl: (streamUrl, title) => androidIntent(streamUrl, title, 'com.brouken.player'),
  },
  {
    id: 'mpv',
    name: 'mpv',
    platforms: ['desktop'],
    icon: 'Terminal',
    availabilityKey: 'app.external.availability.copiesMpvCommand',
    noteKey: 'app.external.note.mpv',
    /* honest: there is no mpv:// handler, so we copy the ready-to-run command */
    buildClipboard: (streamUrl) => `mpv "${streamUrl}"`,
    magnets: 'copy',
    magnetNoteKey: 'app.external.magnetNote.mpv',
  },
  {
    id: 'copy',
    nameKey: 'app.external.fallback.copyStreamUrl',
    platforms: ['android', 'ios', 'desktop'],
    icon: 'Copy',
    availabilityKey: 'app.external.availability.alwaysAvailable',
    noteKey: 'app.external.note.copy',
    buildClipboard: (streamUrl) => streamUrl,
    magnets: 'copy',
    magnetNoteKey: 'app.external.magnetNote.copy',
  },
  {
    id: 'open-tab',
    nameKey: 'app.external.fallback.openNewTab',
    platforms: ['android', 'ios', 'desktop'],
    icon: 'ExternalLink',
    availabilityKey: 'app.external.availability.alwaysAvailable',
    noteKey: 'app.external.note.openTab',
    buildUrl: (streamUrl) => streamUrl,
    opensInNewTab: true,
    /* browsers cannot render magnet: URIs — offering the tab would dead-end */
    magnets: 'omit',
  },
];

/**
 * Entries valid for this platform and stream. Magnet sources keep only the
 * players that declared an honest clipboard behaviour.
 */
export function externalPlayersFor(
  platform: ExternalPlatform,
  streamUrl: string,
): ExternalPlayerDef[] {
  const magnet = isMagnetUri(streamUrl);
  return EXTERNAL_PLAYERS.filter((p) => {
    if (!p.platforms.includes(platform)) return false;
    if (magnet && (p.magnets ?? 'omit') !== 'copy') return false;
    return true;
  });
}

/** What openExternal actually did — the UI toasts from this, never from hope. */
export type ExternalOpenResult = {
  player: ExternalPlayerDef;
} & (
  | { did: 'navigated'; href: string }
  | { did: 'opened-tab'; href: string }
  | { did: 'copied'; text: string; magnet: boolean }
  | { did: 'failed'; reason: 'clipboard' | 'popup' | 'navigation'; text?: string }
);

/** Clipboard with an execCommand fallback for older / permission-odd browsers. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to execCommand */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Attempt the hand-off. Deep links go through window.location.href (or a new
 * tab for `opensInNewTab`); clipboard players copy their payload. The result
 * says exactly what happened so the UI can word its toast honestly — a
 * navigated scheme is "opens if installed", never "opened".
 */
export async function openExternal(
  player: ExternalPlayerDef,
  streamUrl: string,
  title?: string,
  platform: ExternalPlatform = detectPlatform(),
): Promise<ExternalOpenResult> {
  const magnet = isMagnetUri(streamUrl);

  /* magnet hand-off: only clipboard, per the registry's magnets policy */
  if (magnet) {
    const ok = await copyToClipboard(streamUrl);
    return ok
      ? { player, did: 'copied', text: streamUrl, magnet: true }
      : { player, did: 'failed', reason: 'clipboard', text: streamUrl };
  }

  if (player.buildClipboard) {
    const text = player.buildClipboard(streamUrl, title);
    const ok = await copyToClipboard(text);
    return ok
      ? { player, did: 'copied', text, magnet: false }
      : { player, did: 'failed', reason: 'clipboard', text };
  }

  const href = player.buildUrl ? player.buildUrl(streamUrl, title, platform) : streamUrl;

  if (player.opensInNewTab) {
    const win = window.open(href, '_blank', 'noopener,noreferrer');
    if (win) return { player, did: 'opened-tab', href };
    /* popup blocked — fall back to clipboard so the action never dead-ends */
    const ok = await copyToClipboard(href);
    return ok
      ? { player, did: 'copied', text: href, magnet: false }
      : { player, did: 'failed', reason: 'popup', text: href };
  }

  try {
    window.location.href = href;
    return { player, did: 'navigated', href };
  } catch {
    /* navigation failed synchronously — keep the URL within reach */
    const ok = await copyToClipboard(streamUrl);
    return ok
      ? { player, did: 'copied', text: streamUrl, magnet: false }
      : { player, did: 'failed', reason: 'navigation', text: streamUrl };
  }
}
