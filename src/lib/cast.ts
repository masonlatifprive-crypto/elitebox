/**
 * Chromecast sender — thin, lazy-loaded wrapper over the Cast Application
 * Framework (CAF) using Google's Default Media Receiver. The framework
 * script is injected on first use, never at startup, so browsers without
 * cast support pay zero cost and the button stays hidden there.
 *
 * Honesty notes:
 * - Only offered in Chromium browsers on a secure context. Electron and
 *   Capacitor shells report no support, so no dead button ever renders.
 * - The Default Media Receiver plays HLS/DASH/progressive MP4 directly;
 *   streams must be CORS-reachable from the receiver. If a receiver
 *   rejects a stream we surface the framework's error, we don't fake it.
 */

export interface CastMedia {
  url: string;
  title: string;
  subtitle?: string;
  poster?: string;
  currentTime?: number;
  live?: boolean;
}

type CastState = 'NO_DEVICES_AVAILABLE' | 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED';

interface CastContext {
  setOptions(options: { receiverApplicationId: string; autoJoinPolicy: string }): void;
  requestSession(): Promise<void>;
  endCurrentSession(stopCasting?: boolean): void;
  getCastState(): CastState;
  getCurrentSession(): CastSession | null;
  addEventListener(type: string, listener: (event: { castState: CastState }) => void): void;
  removeEventListener(type: string, listener: (event: { castState: CastState }) => void): void;
}

interface CastSession {
  getCastDevice(): { friendlyName: string };
  loadMedia(request: unknown): Promise<void>;
}

interface CastFramework {
  CastContext: { getInstance(): CastContext };
  CastContextEventType: { CAST_STATE_CHANGED: string };
  CastReceiverContext?: unknown;
}

interface ChromeCastStatic {
  AutoJoinPolicy: { ORIGIN_SCOPED: string };
  media: {
    MediaInfo: new (contentId: string, contentType: string) => {
      streamType: string;
      metadata: unknown;
    };
    GenericMediaMetadata: new () => { metadataType: number; title: string; subtitle?: string; images?: Array<{ url: string }> };
    MetadataType: { GENERIC: number };
    LoadRequest: new (mediaInfo: unknown) => { currentTime?: number; autoplay?: boolean };
  };
}

declare global {
  interface Window {
    chrome?: { cast?: ChromeCastStatic };
    cast?: { framework?: CastFramework };
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
  }
}

const SENDER_SCRIPT =
  'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
const DEFAULT_MEDIA_RECEIVER = 'CC1AD845';

let loadPromise: Promise<CastFramework> | null = null;

/** Feature detection that never lies: framework + secure context + not our shells. */
export function isCastEnvironment(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!window.isSecureContext) return false;
  const ua = navigator.userAgent;
  if (/Electron/i.test(ua)) return false;
  if ((window as unknown as { Capacitor?: unknown }).Capacitor) return false;
  // The CAF sender only ships inside Chromium-based browsers.
  return Boolean(window.chrome) || /Chrom(e|ium)|Edg\//.test(ua);
}

function contentTypeFor(url: string): string {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.m3u8')) return 'application/x-mpegURL';
  if (clean.endsWith('.mpd')) return 'application/dash+xml';
  if (clean.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

/** Loads + initializes the framework once. Rejects if the API never arrives. */
export function ensureCastFramework(): Promise<CastFramework> {
  if (window.cast?.framework) return Promise.resolve(window.cast.framework);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<CastFramework>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      loadPromise = null;
      reject(new Error('Cast framework did not load'));
    }, 12000);

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (!isAvailable || !window.cast?.framework || !window.chrome?.cast) {
        window.clearTimeout(timeout);
        loadPromise = null;
        reject(new Error('Cast is not available in this browser'));
        return;
      }
      const framework = window.cast.framework;
      framework.CastContext.getInstance().setOptions({
        receiverApplicationId: DEFAULT_MEDIA_RECEIVER,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });
      window.clearTimeout(timeout);
      resolve(framework);
    };

    const script = document.createElement('script');
    script.src = SENDER_SCRIPT;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      loadPromise = null;
      reject(new Error('Could not load the Cast framework'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Opens the native device picker (if needed) and starts playback of `media`
 * on the receiver. Returns the friendly device name now playing.
 */
export async function startCasting(framework: CastFramework, media: CastMedia): Promise<string> {
  const context = framework.CastContext.getInstance();
  const chromeCast = window.chrome?.cast;
  if (!chromeCast) throw new Error('Cast API unavailable');

  if (context.getCastState() !== 'CONNECTED') {
    await context.requestSession(); // native picker; rejects if the user cancels
  }
  const session = context.getCurrentSession();
  if (!session) throw new Error('No cast session');

  const mediaInfo = new chromeCast.media.MediaInfo(media.url, contentTypeFor(media.url));
  mediaInfo.streamType = media.live ? 'LIVE' : 'BUFFERED';
  const metadata = new chromeCast.media.GenericMediaMetadata();
  metadata.metadataType = chromeCast.media.MetadataType.GENERIC;
  metadata.title = media.title;
  if (media.subtitle) metadata.subtitle = media.subtitle;
  if (media.poster) metadata.images = [{ url: new URL(media.poster, window.location.origin).href }];
  mediaInfo.metadata = metadata;

  const request = new chromeCast.media.LoadRequest(mediaInfo);
  if (!media.live && media.currentTime && media.currentTime > 1) {
    request.currentTime = Math.floor(media.currentTime);
  }
  request.autoplay = true;

  await session.loadMedia(request);
  return session.getCastDevice().friendlyName;
}

export function stopCasting(framework: CastFramework): void {
  framework.CastContext.getInstance().endCurrentSession(true);
}

export function onCastStateChange(
  framework: CastFramework,
  listener: (state: CastState) => void,
): () => void {
  const type = framework.CastContextEventType.CAST_STATE_CHANGED;
  const wrapped = (event: { castState: CastState }) => listener(event.castState);
  const context = framework.CastContext.getInstance();
  context.addEventListener(type, wrapped);
  return () => context.removeEventListener(type, wrapped);
}

export type { CastState, CastFramework };
