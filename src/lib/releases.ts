/**
 * Release tracking utilities — countdowns, .ics export, arrival reminders.
 *
 * Everything here is driven by `MetaItem.releaseDate`, which is only ever
 * set for officially announced dates (never estimates). Titles without a
 * confirmed date are "TBA": no countdown, no .ics, no fabricated calendar
 * entries.
 */
import type { MetaItem } from '@/lib/types';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the premiere moment has passed. */
  arrived: boolean;
}

export function countdownTo(iso: string, now = Date.now()): CountdownParts {
  const target = Date.parse(iso);
  const diff = target - now;
  if (!Number.isFinite(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, arrived: true };
  }
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    arrived: false,
  };
}

/** Group key for the calendar grid: 'YYYY-MM' for dated, 'tba' otherwise. */
export function releaseMonthKey(item: MetaItem): string {
  if (!item.releaseDate) return 'tba';
  const d = new Date(item.releaseDate);
  if (Number.isNaN(d.getTime())) return 'tba';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00Z`;
}

/**
 * Build a single-event VCALENDAR for a dated premiere. Returns undefined for
 * TBA titles — callers must disable export in that case (no fake dates).
 */
export function buildIcs(item: MetaItem): string | undefined {
  if (!item.releaseDate) return undefined;
  const start = new Date(item.releaseDate);
  if (Number.isNaN(start.getTime())) return undefined;
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  const stamp = icsDate(new Date());
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Elitebox//Release Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${item.id}@elitebox.release`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(`${item.name} — premiere on Elitebox`)}`,
    `DESCRIPTION:${icsEscape(item.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(item: MetaItem): boolean {
  const ics = buildIcs(item);
  if (!ics) return false;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.id}-premiere.ics`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/* ── arrival reminders ─────────────────────────────────────────────────── */

const SEEN_KEY = 'elitebox.v1.release-seen';

function seenArrivals(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markArrivalSeen(id: string): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seenArrivals(), id])]));
  } catch {
    /* storage full/blocked — reminders are best-effort */
  }
}

/**
 * Titles on the user's watchlist whose confirmed premiere date has passed
 * and that have not been announced yet this device. Marks them seen.
 */
export function drainArrivedReleases(
  watchlist: string[],
  lookup: (id: string) => MetaItem | undefined,
): MetaItem[] {
  const seen = new Set(seenArrivals());
  const arrived: MetaItem[] = [];
  for (const id of watchlist) {
    if (seen.has(id)) continue;
    const item = lookup(id);
    if (item?.releaseDate && Date.parse(item.releaseDate) <= Date.now()) {
      arrived.push(item);
      markArrivalSeen(id);
    }
  }
  return arrived;
}
