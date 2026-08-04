/**
 * Elitebox addon engine (singleton).
 *
 * - External addons speak a Stremio-flavoured HTTP protocol:
 *   GET {base}/manifest, /catalog/{type}/{id}.json, /meta/{type}/{id}.json,
 *   /stream/{type}/{id}.json, /subtitles/{type}/{id}.json
 * - Every remote call: 7s AbortController timeout, timing telemetry, and a
 *   circuit breaker — 3 consecutive failures open the circuit for 60s, then
 *   one half-open probe decides close/re-open. `recover(id)` force-resets.
 * - Cinemeta calls additionally get one same-origin proxy fallback
 *   (`/api/cine.php`, 9s timeout) when the direct fetch fails, so visitors on
 *   slow/rotating-IP networks still reach the real catalog.
 */


import type {
  AddonCatalog,
  AddonHealth,
  AddonInfo,
  AddonLegal,
  AddonPrivacy,
  AddonStatus,
  CircuitState,
  MetaItem,
  MetaType,
  MetaVideo,
  StreamSource
} from '@/lib/types';


import { useAddons } from '@/lib/store';


// Constants for circuit breaker
const TIMEOUT_DIRECT = 7000;
const TIMEOUT_PROXY = 9000;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60000;


export enum addonBlockReason {
  NONE = "none",
  DMCA = "dmca",
  MALWARE = "malware",
  UNSAFE = "unsafe"
}
