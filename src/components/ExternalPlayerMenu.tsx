/**
 * ExternalPlayerMenu — lunar-styled list of external player targets for the
 * current stream (Stremio-parity "Open in external player").
 *
 * Entries come from the EXTERNAL_PLAYERS registry in lib/externalPlayers.ts,
 * filtered to the detected platform and stream type. Hand-offs go through
 * openExternal(), which reports exactly what it did — toasts are worded from
 * that result ("If VLC is installed, it should open now."), never from hope.
 */
import { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Copy,
  ExternalLink,
  Play,
  Smartphone,
  Terminal,
  Tv,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { spring, toast } from '@/components/ui-elite';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
import {
  detectPlatform,
  externalPlayersFor,
  isMagnetUri,
  openExternal,
} from '@/lib/externalPlayers';
import type {
  ExternalOpenResult,
  ExternalPlayerDef,
  ExternalPlayerIcon,
} from '@/lib/externalPlayers';
import { cn } from '@/lib/utils';

const ENTRY_ICON: Record<ExternalPlayerIcon, LucideIcon> = {
  Play,
  Tv,
  Smartphone,
  Terminal,
  Copy,
  ExternalLink,
};

/** Toast wording follows what openExternal verified, not what we hope. */
function report(result: ExternalOpenResult, t: TFunction): void {
  const { player } = result;
  switch (result.did) {
    case 'navigated':
      /* deep links only exist for brand-named players; id is a safe fallback */
      toast(t('app.external.toastNavigated', { name: player.name ?? player.id }));
      break;
    case 'opened-tab':
      toast(t('app.external.toastOpenedTab'));
      break;
    case 'copied':
      if (result.magnet) toast(t('app.external.toastMagnetCopied'));
      else if (player.id === 'mpv') toast(t('app.external.toastMpvCopied'));
      else toast(t('app.external.toastUrlCopied'));
      break;
    case 'failed':
      if (result.reason === 'clipboard') {
        toast.error(t('app.external.toastClipboardBlocked'));
      } else if (result.reason === 'popup') {
        toast.error(t('app.external.toastPopupBlocked'));
      } else {
        toast.error(t('app.external.toastOpenFailed'));
      }
      break;
  }
}

export default function ExternalPlayerMenu({
  streamUrl,
  title,
  onDone,
}: {
  /** Current resolved stream URL (http(s)) or magnet URI for Torrent-type sources. */
  streamUrl: string;
  /** Human title handed to players that accept one (Android intents display it). */
  title: string;
  /** Called after an action fires (parent closes the sheet). */
  onDone?: () => void;
}) {
  const { t } = useT();
  const [platform] = useState(() => detectPlatform());
  const entries = useMemo(() => externalPlayersFor(platform, streamUrl), [platform, streamUrl]);
  const magnet = isMagnetUri(streamUrl);
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);

  const activate = async (entry: ExternalPlayerDef) => {
    const result = await openExternal(entry, streamUrl, title, platform);
    report(result, t);
    if (result.did !== 'failed') onDone?.();
  };

  /* Arrow-key navigation across entries (TV-friendly; native Tab still works) */
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-ext-entry]') ?? [],
    );
    if (buttons.length === 0) return;
    const idx = buttons.findIndex((b) => b === document.activeElement);
    let next = 0;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else if (e.key === 'ArrowDown') next = idx < 0 ? 0 : Math.min(buttons.length - 1, idx + 1);
    else next = idx < 0 ? 0 : Math.max(0, idx - 1);
    e.preventDefault();
    e.stopPropagation();
    buttons[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-12">
      <ul ref={listRef} className="flex flex-col gap-8" onKeyDown={onListKeyDown}>
        {entries.map((entry, i) => {
          const Icon = ENTRY_ICON[entry.icon];
          const availabilityKey = magnet && entry.magnets === 'copy'
            ? 'app.external.copiesMagnet'
            : entry.availabilityKey;
          const note = magnet && entry.magnetNoteKey
            ? t(entry.magnetNoteKey)
            : entry.noteKey
              ? t(entry.noteKey)
              : undefined;
          const name = magnet && entry.id === 'copy'
            ? t('app.external.copyMagnet')
            : entry.name ?? (entry.nameKey ? t(entry.nameKey) : entry.id);
          return (
            <motion.li
              key={entry.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: reduceMotion ? 0 : i * 0.04 }}
            >
              <button
                type="button"
                data-ext-entry
                onClick={() => void activate(entry)}
                className="focusable glass-1 flex min-h-44 w-full items-center gap-12 rounded-lg px-12 py-10 text-left hover:bg-white/[.06] cursor-pointer"
              >
                <span className="glass-2 flex h-36 w-36 shrink-0 items-center justify-center rounded-full text-cyan">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-8">
                    <span className="truncate text-caption font-semibold text-ink">{name}</span>
                    <span
                      className={cn(
                        'shrink-0 text-micro uppercase',
                        availabilityKey === 'app.external.availability.alwaysAvailable'
                          ? 'text-cyan'
                          : 'text-muted',
                      )}
                    >
                      {t(availabilityKey)}
                    </span>
                  </span>
                  {note && (
                    <span className="mt-2 block truncate text-[12px] text-muted">{note}</span>
                  )}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      <p className="text-micro uppercase text-muted/70">
        {magnet
          ? t('app.external.noteMagnet')
          : platform === 'desktop'
            ? t('app.external.noteDesktop')
            : t('app.external.noteMobile')}
      </p>
    </div>
  );
}
