/**
 * MagnetDrop — global torrent intake for the app shell (/app/*).
 *
 * Three honest surfaces, one parser (src/lib/magnet.ts):
 *  1. A full-screen drag-and-drop overlay: dragging files anywhere over the
 *     app shows a lunar drop zone; dropping a .torrent file bencode-parses it
 *     locally (Web Crypto SHA-1 for the info-hash) and opens the result sheet.
 *  2. The shared result sheet (ui-elite Modal): parsed name, info-hash, size
 *     and file count, then real actions only — copy the magnet link, hand it
 *     to VLC via a vlc:// link, or save it to the Library. Invalid input gets
 *     an honest error state, never a fake success.
 *  3. MagnetPasteField: an input + submit for pasting magnet URIs (used on
 *     the Search page), routed through the same sheet.
 *
 * Honesty contract: the browser build reads torrent metadata only. Nothing
 * here downloads or streams torrent data — the sheet says so, and the
 * legal-sources notice (app.magnet.legal.*) is always shown.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent as ReactDragEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookmarkPlus,
  Check,
  Copy,
  ExternalLink,
  FileDown,
  Files,
  Magnet,
  OctagonX,
  ShieldCheck,
} from 'lucide-react';
import { create } from 'zustand';
import { ButtonGhost, ButtonNeon, ButtonPrimary, Modal, spring, toast } from '@/components/ui-elite';
import {
  formatBytes,
  parseMagnetDetailed,
  parseTorrentFile,
  shortHash,
} from '@/lib/magnet';
import type { MagnetErrorCode, ParsedMagnet, TorrentFileEntry } from '@/lib/magnet';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
import { useLibrary, useSettings } from '@/lib/store';

/* ── shared sheet state (Search opens the same sheet through this store) ── */

export interface MagnetSheetData {
  source: 'magnet' | 'torrent';
  name?: string;
  infoHash?: string;
  magnetUri?: string;
  trackers?: string[];
  files?: TorrentFileEntry[];
  totalSize?: number;
  /** Parser failure: stable code + raw detail, localized at render time. */
  error?: { code: MagnetErrorCode; detail?: string };
}

/** Maps a parser error code to localized copy (app.magnet.errors.<code>). */
function magnetErrorText(
  error: { code: MagnetErrorCode; detail?: string },
  t: TFunction,
): string {
  const vars = error.detail !== undefined ? { detail: error.detail } : undefined;
  switch (error.code) {
    case 'scheme':
      return t('app.magnet.errors.scheme', vars);
    case 'malformed':
      return t('app.magnet.errors.malformed', vars);
    case 'no_xt':
      return t('app.magnet.errors.no_xt', vars);
    case 'hash_length_hex':
      return t('app.magnet.errors.hash_length_hex', vars);
    case 'hash_length_base32':
      return t('app.magnet.errors.hash_length_base32', vars);
    case 'hash_charset':
      return t('app.magnet.errors.hash_charset', vars);
    case 'hash_decode':
      return t('app.magnet.errors.hash_decode', vars);
    case 'bencode':
      return t('app.magnet.errors.bencode', vars);
    case 'no_name':
      return t('app.magnet.errors.no_name', vars);
    case 'files_unreadable':
      return t('app.magnet.errors.files_unreadable', vars);
    case 'no_files':
      return t('app.magnet.errors.no_files', vars);
    case 'crypto':
      return t('app.magnet.errors.crypto', vars);
    case 'file_read':
      return t('app.magnet.errors.file_read', vars);
    case 'empty':
      return t('app.magnet.errors.empty', vars);
    case 'not_torrent':
      /* UI-side rejection (wrong extension) — detail carries the file name */
      return t('app.magnet.notTorrent', { name: error.detail ?? '' });
  }
}

interface MagnetSheetState {
  data: MagnetSheetData | null;
  open: (data: MagnetSheetData) => void;
  close: () => void;
}

export const useMagnetSheet = create<MagnetSheetState>()((set) => ({
  data: null,
  open: (data) => set({ data }),
  close: () => set({ data: null }),
}));

/** Opens the shared magnet result sheet from anywhere (e.g. Search). */
export function openMagnetSheet(data: MagnetSheetData): void {
  useMagnetSheet.getState().open(data);
}

/** Routes any magnet URI string into the result sheet (valid or not). */
export function presentMagnetUri(uri: string): void {
  const result = parseMagnetDetailed(uri);
  if (result.ok) {
    const m: ParsedMagnet = result.magnet;
    openMagnetSheet({
      source: 'magnet',
      name: m.displayName,
      infoHash: m.infoHash,
      magnetUri: m.uri,
      trackers: m.trackers,
    });
  } else {
    openMagnetSheet({ source: 'magnet', error: { code: result.code, detail: result.detail } });
  }
}

/* ── copy-to-clipboard with honest feedback ────────────────────────────── */

function copyText(text: string, okMsg: string, t: TFunction): void {
  if (!navigator.clipboard?.writeText) {
    toast.error(t('app.magnet.clipboardUnavailable'));
    return;
  }
  void navigator.clipboard
    .writeText(text)
    .then(() => toast(okMsg))
    .catch(() => toast.error(t('app.magnet.clipboardUnavailable')));
}

/* ── result sheet ──────────────────────────────────────────────────────── */

function MagnetResultSheet() {
  const { t } = useT();
  const data = useMagnetSheet((s) => s.data);
  const close = useMagnetSheet((s) => s.close);
  const savedMagnets = useLibrary((s) => s.savedMagnets);
  const addSavedMagnet = useLibrary((s) => s.addSavedMagnet);

  const alreadySaved = Boolean(data?.infoHash && savedMagnets.some((m) => m.infoHash === data.infoHash));

  const saveToLibrary = () => {
    if (!data?.infoHash || !data.magnetUri) return;
    const name = data.name?.trim() || t('app.magnet.unnamed', { hash: shortHash(data.infoHash) });
    addSavedMagnet({ infoHash: data.infoHash, name, magnetUri: data.magnetUri, addedAt: Date.now() });
    toast(t('app.magnet.toastSaved'));
  };

  const error = data?.error;
  return (
    <Modal open={data !== null} onClose={close} title={error ? t('app.magnet.errorTitle') : (data?.name ?? t('app.magnet.defaultTitle'))}>
      {error ? (
        <div className="flex flex-col gap-16">
          <div className="flex items-start gap-12">
            <OctagonX size={20} strokeWidth={1.75} className="mt-2 shrink-0 text-error" />
            <p className="text-caption text-muted">{magnetErrorText(error, t)}</p>
          </div>
          <p className="text-caption text-muted">
            {t('app.magnet.errorBody')}
          </p>
          <div className="flex justify-end">
            <ButtonGhost onClick={close}>{t('app.magnet.close')}</ButtonGhost>
          </div>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-16">
          {/* parsed facts — only what was really in the input */}
          <div className="flex flex-col gap-8 rounded-xl bg-white/[.03] p-16">
            {data.infoHash && (
              <div className="flex items-center justify-between gap-12">
                <span className="text-caption text-muted">{t('app.magnet.infoHash')}</span>
                <span className="flex items-center gap-8">
                  <span className="font-mono text-[12px] text-cyan" title={data.infoHash}>
                    {shortHash(data.infoHash)}
                  </span>
                  <button
                    type="button"
                    aria-label={t('app.magnet.copyInfoHash')}
                    onClick={() => copyText(data.infoHash ?? '', t('app.magnet.infoHashCopied'), t)}
                    className="focusable cursor-pointer rounded-full p-6 text-muted hover:text-ink hover:bg-white/[.06]"
                  >
                    <Copy size={14} strokeWidth={1.75} />
                  </button>
                </span>
              </div>
            )}
            {data.source === 'torrent' && data.files && data.totalSize !== undefined && (
              <div className="flex items-center justify-between gap-12">
                <span className="text-caption text-muted">{t('app.magnet.contents')}</span>
                <span className="flex items-center gap-8 text-caption text-ink">
                  <Files size={14} strokeWidth={1.75} className="text-cyan" />
                  {data.files.length === 1
                    ? t('app.magnet.fileOne')
                    : t('app.magnet.fileMany', { count: data.files.length })}{' '}
                  · {formatBytes(data.totalSize)}
                </span>
              </div>
            )}
            {data.trackers && data.trackers.length > 0 && (
              <div className="flex items-center justify-between gap-12">
                <span className="text-caption text-muted">{t('app.magnet.trackers')}</span>
                <span className="text-caption text-ink">{data.trackers.length}</span>
              </div>
            )}
          </div>

          {/* multi-file listing (real, from the torrent itself) */}
          {data.files && data.files.length > 1 && (
            <ul className="flex max-h-160 flex-col gap-4 overflow-y-auto rounded-xl bg-deep/60 p-12">
              {data.files.slice(0, 24).map((f) => (
                <li key={f.path} className="flex items-baseline justify-between gap-12 font-mono text-[11px]">
                  <span className="truncate text-ink/85">{f.path}</span>
                  <span className="shrink-0 text-muted">{formatBytes(f.size)}</span>
                </li>
              ))}
              {data.files.length > 24 && (
                <li className="font-mono text-[11px] text-muted">
                  {t('app.magnet.moreFiles', { count: data.files.length - 24 })}
                </li>
              )}
            </ul>
          )}

          {/* honest capability + legal notices */}
          <div className="flex flex-col gap-6 rounded-xl border border-cyan/25 bg-[rgba(124,217,236,.05)] p-12">
            <p className="flex items-start gap-8 text-caption text-muted">
              <ShieldCheck size={14} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
              {t('app.magnet.legal.notice')}
            </p>
            <p className="text-caption text-muted">{t('app.magnet.legal.browserNote')}</p>
          </div>

          {/* real actions only */}
          <div className="flex flex-wrap items-center gap-12">
            {data.magnetUri && (
              <ButtonPrimary onClick={() => copyText(data.magnetUri ?? '', t('app.magnet.magnetCopied'), t)}>
                <Copy size={16} strokeWidth={1.75} />
                {t('app.magnet.copyMagnet')}
              </ButtonPrimary>
            )}
            {data.magnetUri && (
              <ButtonNeon
                onClick={() => {
                  // vlc:// protocol hand-off — opens VLC if the user has it.
                  window.location.href = `vlc://${data.magnetUri}`;
                }}
              >
                <ExternalLink size={16} strokeWidth={1.75} />
                {t('app.magnet.openVlc')}
              </ButtonNeon>
            )}
            {data.magnetUri && (
              <ButtonGhost onClick={saveToLibrary} className={alreadySaved ? 'opacity-50 pointer-events-none' : ''}>
                {alreadySaved ? (
                  <Check size={16} strokeWidth={1.75} className="text-ok" />
                ) : (
                  <BookmarkPlus size={16} strokeWidth={1.75} />
                )}
                {alreadySaved ? t('app.magnet.savedToLibrary') : t('app.magnet.saveToLibrary')}
              </ButtonGhost>
            )}
          </div>
          <p className="text-micro uppercase text-muted">
            {t('app.magnet.vlcNote')}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

/* ── paste field (reused on Search) ────────────────────────────────────── */

export function MagnetPasteField({ className }: { className?: string }) {
  const { t } = useT();
  const [value, setValue] = useState('');

  const submit = () => {
    const uri = value.trim();
    if (!uri) return;
    presentMagnetUri(uri);
    setValue('');
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className={className}>
      <div className="glass-2 flex h-48 items-center gap-12 rounded-full px-20">
        <Magnet size={18} strokeWidth={1.75} className="shrink-0 text-cyan" />
        <input
          type="text"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('app.magnet.pastePlaceholder')}
          aria-label={t('app.magnet.pasteAria')}
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-caption text-ink caret-[#7CD9EC] outline-none placeholder:text-muted"
        />
        <ButtonGhost onClick={submit} className={value.trim() ? '' : 'opacity-50 pointer-events-none'}>
          {t('app.magnet.pasteOpen')}
        </ButtonGhost>
      </div>
      <p className="mt-8 text-center text-micro uppercase text-muted">{t('app.magnet.legal.notice')}</p>
    </div>
  );
}

/* ── global drop overlay ───────────────────────────────────────────────── */

export default function MagnetDrop() {
  const { t } = useT();
  const [dragging, setDragging] = useState(false);
  const torrentProfile = useSettings((s) => s.settings.streaming.torrentProfile);

  const handleDropFile = useCallback(
    async (file: File) => {
      if (!/\.torrent$/i.test(file.name)) {
        openMagnetSheet({
          source: 'torrent',
          error: { code: 'not_torrent', detail: file.name },
        });
        return;
      }
      const result = await parseTorrentFile(file);
      if (result.ok) {
        const parsed = result.torrent;
        openMagnetSheet({
          source: 'torrent',
          name: parsed.name,
          infoHash: parsed.infoHash,
          magnetUri: parsed.magnetUri,
          trackers: parsed.trackers,
          files: parsed.files,
          totalSize: parsed.totalSize,
        });
      } else {
        openMagnetSheet({ source: 'torrent', error: { code: result.code, detail: result.detail } });
      }
    },
    [t],
  );

  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: globalThis.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const onDragEnter = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const onDragOver = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
    };
    const onDragLeave = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      // Always swallow file drops inside the app shell so the browser never
      // navigates away to the dropped file.
      e.preventDefault();
      depth = 0;
      setDragging(false);
      if (torrentProfile === 'off') {
        toast(t('app.magnet.torrentOff'), 'error');
        return;
      }
      const file = e.dataTransfer?.files?.[0];
      if (file) void handleDropFile(file);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [torrentProfile, handleDropFile, t]);

  const onOverlayDragOver = (e: ReactDragEvent) => e.preventDefault();

  return (
    <>
      <AnimatePresence>
        {dragging && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-deep/80 p-24 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onDragOver={onOverlayDragOver}
          >
            <motion.div
              className="flex h-full w-full flex-col items-center justify-center gap-16 rounded-2xl border-2 border-dashed border-cyan/70 bg-[rgba(124,217,236,.05)]"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring.smooth}
            >
              <div className="glass-2 flex h-112 w-112 items-center justify-center rounded-full">
                <Magnet size={48} strokeWidth={1.5} className="text-cyan" />
              </div>
              <div className="flex max-w-[52ch] flex-col items-center gap-8 text-center">
                <h2 className="font-display text-display-l text-ink">{t('app.magnet.dropTitle')}</h2>
                <p className="flex items-center gap-8 text-caption text-muted">
                  <FileDown size={14} strokeWidth={1.75} className="shrink-0 text-cyan" />
                  {t('app.magnet.dropSubtitle')}
                </p>
                <p className="text-micro uppercase text-muted">{t('app.magnet.legal.notice')}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <MagnetResultSheet />
    </>
  );
}
