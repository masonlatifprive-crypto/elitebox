/**
 * Magnet / .torrent support — metadata only, and honest about it.
 *
 * The Elitebox browser build cannot run BitTorrent (browsers have no raw
 * TCP/UDP sockets). What it CAN do, fully locally, is:
 *   - validate a pasted magnet URI (info-hash, display name, trackers),
 *   - parse a dropped .torrent file (bencode) and hash its info dict with
 *     Web Crypto to recover the real info-hash,
 *   - hand the magnet link to an external player (vlc://) or save it to the
 *     Library so the desktop shell can pick it up.
 * Actual peer-to-peer streaming for legal sources runs in the Elitebox
 * desktop shell, never here. Nothing in this module fakes a download.
 */

export interface ParsedMagnet {
  /** 40-char lowercase hex BitTorrent v1 info-hash. */
  infoHash: string;
  displayName?: string;
  trackers: string[];
  /** Normalized magnet URI (lowercase hex hash) — safe to copy/hand off. */
  uri: string;
}

export interface TorrentFileEntry {
  path: string;
  size: number;
}

export interface TorrentMeta {
  infoHash: string;
  name: string;
  files: TorrentFileEntry[];
  totalSize: number;
  trackers: string[];
  /** Magnet URI rebuilt from the real info-hash. */
  magnetUri: string;
}

export type MagnetParseResult =
  | { ok: true; magnet: ParsedMagnet }
  | { ok: false; code: MagnetErrorCode; detail?: string };
export type TorrentParseResult =
  | { ok: true; torrent: TorrentMeta }
  | { ok: false; code: MagnetErrorCode; detail?: string };

/* ── legal-sources copy (single source of truth for every surface) ──────
 * The strings live in the i18n dictionaries — render them via t():
 *   app.magnet.legal.notice        one-liner wherever magnets are accepted
 *   app.magnet.legal.browserNote   honest browser-build capability note
 *   app.magnet.legal.settingsNote  settings-page capability note
 * (src/i18n/locales/{en,nl}/app.ts). */

/* ── parse failures ──────────────────────────────────────────────────────
 * Parsers never return prose — they return a stable error CODE (plus an
 * optional raw `detail`, e.g. the bencode exception message). The UI maps
 * the code to localized copy via `app.magnet.errors.<code>` (en+nl);
 * {{detail}} interpolation carries the raw detail where it matters. */

export type MagnetErrorCode =
  /** Magnet URI does not start with "magnet:?". */
  | 'scheme'
  /** URLSearchParams threw on the query part. */
  | 'malformed'
  /** No xt=urn:btih: parameter at all. */
  | 'no_xt'
  /** Hex info-hash that is not exactly 40 chars (detail: actual length). */
  | 'hash_length_hex'
  /** Base32 info-hash that is not exactly 32 chars (detail: actual length). */
  | 'hash_length_base32'
  /** Info-hash is neither hex nor base32. */
  | 'hash_charset'
  /** Base32 info-hash could not be decoded. */
  | 'hash_decode'
  /** Bencode decode failed (detail: parser exception message). */
  | 'bencode'
  /** Info dict has no display name. */
  | 'no_name'
  /** A file list was declared but no entry was readable. */
  | 'files_unreadable'
  /** Neither a file list nor a single-file length. */
  | 'no_files'
  /** SHA-1 info-hash could not be computed (detail: crypto error). */
  | 'crypto'
  /** The browser refused to read the dropped file. */
  | 'file_read'
  /** The dropped file is empty. */
  | 'empty'
  /**
   * Raised by the drop UI (never by the parsers) when the dropped file does
   * not end in .torrent — detail: the file name.
   */
  | 'not_torrent';

/* ── magnet URI parsing ────────────────────────────────────────────────── */

/** Cheap gate used by Search: does this string look like a magnet URI? */
export function isMagnetUri(value: string): boolean {
  return /^\s*magnet:\?/i.test(value);
}

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/** RFC 4648 base32 (no padding) → lowercase hex. 32 chars in, 40 out. */
function base32ToHex(input: string): string | null {
  let bits = 0;
  let value = 0;
  let hex = '';
  for (const ch of input.toLowerCase()) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      hex += ((value >>> bits) & 0xff).toString(16).padStart(2, '0');
    }
  }
  return hex;
}

/** Builds the normalized magnet URI we persist and hand to external players. */
export function buildMagnetUri(infoHash: string, displayName?: string, trackers: string[] = []): string {
  const params = new URLSearchParams();
  params.set('xt', `urn:btih:${infoHash.toLowerCase()}`);
  if (displayName) params.set('dn', displayName);
  for (const tr of trackers) params.append('tr', tr);
  return `magnet:?${params.toString()}`;
}

/**
 * Validates a magnet URI with exact, honest error codes (localized by the UI
 * as `app.magnet.errors.<code>`). Returns a discriminated result;
 * `parseMagnet` below is the null-returning convenience wrapper.
 */
export function parseMagnetDetailed(uri: string): MagnetParseResult {
  const raw = uri.trim();
  if (!isMagnetUri(raw)) {
    return { ok: false, code: 'scheme' };
  }
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw.slice(raw.indexOf('?') + 1));
  } catch {
    return { ok: false, code: 'malformed' };
  }

  const xt = params.getAll('xt').find((v) => /^urn:btih:/i.test(v));
  if (!xt) {
    return { ok: false, code: 'no_xt' };
  }
  const hash = xt.slice('urn:btih:'.length);

  let infoHash: string | null = null;
  if (/^[0-9a-fA-F]+$/.test(hash)) {
    if (hash.length !== 40) {
      return { ok: false, code: 'hash_length_hex', detail: String(hash.length) };
    }
    infoHash = hash.toLowerCase();
  } else if (/^[a-zA-Z2-7]+$/.test(hash)) {
    if (hash.length !== 32) {
      return { ok: false, code: 'hash_length_base32', detail: String(hash.length) };
    }
    infoHash = base32ToHex(hash);
  } else {
    return { ok: false, code: 'hash_charset' };
  }
  if (!infoHash) {
    return { ok: false, code: 'hash_decode' };
  }

  const displayName = params.get('dn')?.trim() || undefined;
  const trackers = params.getAll('tr').map((t) => t.trim()).filter(Boolean);
  return { ok: true, magnet: { infoHash, displayName, trackers, uri: buildMagnetUri(infoHash, displayName, trackers) } };
}

/** Null-returning wrapper — use `parseMagnetDetailed` when you need the reason. */
export function parseMagnet(uri: string): ParsedMagnet | null {
  const r = parseMagnetDetailed(uri);
  return r.ok ? r.magnet : null;
}

/* ── bencode ───────────────────────────────────────────────────────────── */

type BValue = string | number | BValue[] | { [key: string]: BValue };

interface BDecode {
  value: BValue;
  /** Index one past the last consumed byte. */
  end: number;
}

const textDecoder = new TextDecoder('utf-8', { fatal: false });

function decodeAt(buf: Uint8Array, pos: number): BDecode {
  const byte = buf[pos];
  if (byte === 0x69 /* i */) {
    const close = buf.indexOf(0x65 /* e */, pos);
    if (close === -1) throw new Error('unterminated integer');
    const num = Number(textDecoder.decode(buf.subarray(pos + 1, close)));
    if (!Number.isSafeInteger(num)) throw new Error('integer out of range');
    return { value: num, end: close + 1 };
  }
  if (byte === 0x6c /* l */) {
    const list: BValue[] = [];
    let cursor = pos + 1;
    while (buf[cursor] !== 0x65 /* e */) {
      if (cursor >= buf.length) throw new Error('unterminated list');
      const item = decodeAt(buf, cursor);
      list.push(item.value);
      cursor = item.end;
    }
    return { value: list, end: cursor + 1 };
  }
  if (byte === 0x64 /* d */) {
    const dict: { [key: string]: BValue } = {};
    let cursor = pos + 1;
    while (buf[cursor] !== 0x65 /* e */) {
      if (cursor >= buf.length) throw new Error('unterminated dictionary');
      const key = decodeAt(buf, cursor);
      if (typeof key.value !== 'string') throw new Error('dictionary key is not a string');
      const val = decodeAt(buf, key.end);
      dict[key.value] = val.value;
      cursor = val.end;
    }
    return { value: dict, end: cursor + 1 };
  }
  if (byte >= 0x30 && byte <= 0x39 /* 0-9 */) {
    const colon = buf.indexOf(0x3a /* : */, pos);
    if (colon === -1) throw new Error('string length without colon');
    const len = Number(textDecoder.decode(buf.subarray(pos, colon)));
    if (!Number.isSafeInteger(len) || len < 0) throw new Error('invalid string length');
    const start = colon + 1;
    const stop = start + len;
    if (stop > buf.length) throw new Error('string runs past end of file');
    return { value: textDecoder.decode(buf.subarray(start, stop)), end: stop };
  }
  throw new Error('unexpected byte in bencode');
}

/**
 * Parses the raw bytes of a .torrent file. Returns the decoded info dict and
 * the exact byte range of its bencoded form (needed for the SHA-1 info-hash,
 * which is defined over the verbatim bencode, not a re-encode).
 */
function decodeTorrent(buf: Uint8Array): {
  info: { [key: string]: BValue };
  infoStart: number;
  infoEnd: number;
  root: { [key: string]: BValue };
} {
  if (buf.length === 0 || buf[0] !== 0x64 /* d */) {
    throw new Error('not a bencoded dictionary');
  }
  // Walk the top-level dictionary manually so we can capture the byte range
  // of the raw "info" value.
  const root: { [key: string]: BValue } = {};
  let info: { [key: string]: BValue } | null = null;
  let infoStart = -1;
  let infoEnd = -1;
  let cursor = 1;
  while (buf[cursor] !== 0x65 /* e */) {
    if (cursor >= buf.length) throw new Error('unterminated top-level dictionary');
    const key = decodeAt(buf, cursor);
    if (typeof key.value !== 'string') throw new Error('dictionary key is not a string');
    const valStart = key.end;
    const val = decodeAt(buf, valStart);
    root[key.value] = val.value;
    if (key.value === 'info') {
      if (typeof val.value !== 'object' || val.value === null || Array.isArray(val.value)) {
        throw new Error('the "info" field is not a dictionary');
      }
      info = val.value as { [key: string]: BValue };
      infoStart = valStart;
      infoEnd = val.end;
    }
    cursor = val.end;
  }
  if (!info) throw new Error('no "info" dictionary — not a valid torrent file');
  return { info, infoStart, infoEnd, root };
}

function asString(v: BValue | undefined): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function asNumber(v: BValue | undefined): number | undefined {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : undefined;
}

async function sha1Hex(buf: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is unavailable in this browser context');
  }
  const digest = await crypto.subtle.digest('SHA-1', buf as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Parses raw .torrent bytes into honest metadata. Never invents fields. */
export async function parseTorrentData(bytes: Uint8Array): Promise<TorrentParseResult> {
  let decoded: ReturnType<typeof decodeTorrent>;
  try {
    decoded = decodeTorrent(bytes);
  } catch (e) {
    return {
      ok: false,
      code: 'bencode',
      detail: e instanceof Error ? e.message : 'unknown bencode error',
    };
  }
  const { info, root } = decoded;

  const name = asString(info['name.utf-8']) ?? asString(info.name);
  if (!name) {
    return { ok: false, code: 'no_name' };
  }

  const files: TorrentFileEntry[] = [];
  let totalSize = 0;
  const multi = info.files;
  if (Array.isArray(multi)) {
    for (const entry of multi) {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue;
      const dict = entry as { [key: string]: BValue };
      const length = asNumber(dict.length);
      const rawPath = dict['path.utf-8'] ?? dict.path;
      const parts = Array.isArray(rawPath) ? rawPath.filter((p): p is string => typeof p === 'string') : [];
      if (length === undefined || parts.length === 0) continue;
      files.push({ path: parts.join('/'), size: length });
      totalSize += length;
    }
    if (files.length === 0) {
      return { ok: false, code: 'files_unreadable' };
    }
  } else {
    const length = asNumber(info.length);
    if (length === undefined) {
      return { ok: false, code: 'no_files' };
    }
    files.push({ path: name, size: length });
    totalSize = length;
  }

  const trackers: string[] = [];
  const announce = asString(root.announce);
  if (announce) trackers.push(announce);
  const tiers = root['announce-list'];
  if (Array.isArray(tiers)) {
    for (const tier of tiers) {
      if (!Array.isArray(tier)) continue;
      for (const t of tier) {
        const url = asString(t as BValue);
        if (url && !trackers.includes(url)) trackers.push(url);
      }
    }
  }

  let infoHash: string;
  try {
    infoHash = await sha1Hex(bytes.subarray(decoded.infoStart, decoded.infoEnd));
  } catch (e) {
    return {
      ok: false,
      code: 'crypto',
      detail: e instanceof Error ? e.message : 'unknown error',
    };
  }

  return {
    ok: true,
    torrent: { infoHash, name, files, totalSize, trackers, magnetUri: buildMagnetUri(infoHash, name, trackers) },
  };
}

/** Reads and parses a dropped/picked .torrent File. */
export async function parseTorrentFile(file: File): Promise<TorrentParseResult> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, code: 'file_read' };
  }
  if (bytes.length === 0) {
    return { ok: false, code: 'empty' };
  }
  return parseTorrentData(bytes);
}

/* ── display helpers ───────────────────────────────────────────────────── */

/** Human-readable byte size, one decimal where it helps. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${u === 0 ? v : v.toFixed(1)} ${units[u]}`;
}

/** Truncated info-hash for display: first 8 … last 6. */
export function shortHash(infoHash: string): string {
  return infoHash.length > 18 ? `${infoHash.slice(0, 8)}…${infoHash.slice(-6)}` : infoHash;
}
