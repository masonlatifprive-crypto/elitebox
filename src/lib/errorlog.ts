/**
 * Local error log — on-device ring buffer of uncaught errors and unhandled
 * rejections. Nothing is uploaded: this is the user's own diagnostic trail,
 * viewable and clearable in Settings. Capped at 50 entries (newest first).
 */

export interface ErrorEntry {
  id: string;
  message: string;
  source?: string; // file:line when available
  kind: 'error' | 'rejection';
  at: number;
}

const KEY = 'elitebox.v1.errorlog';
const MAX = 50;

export function readErrorLog(): ErrorEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as ErrorEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearErrorLog(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* best-effort */
  }
}

function push(entry: Omit<ErrorEntry, 'id' | 'at'>): void {
  try {
    const next: ErrorEntry = {
      ...entry,
      id: `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify([next, ...readErrorLog()].slice(0, MAX)));
  } catch {
    /* storage full/blocked — logging never breaks the app */
  }
}

let installed = false;

/** Install window-level capture once (call from main.tsx). */
export function installErrorCapture(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (ev) => {
    push({
      kind: 'error',
      message: String(ev.message ?? 'Unknown error'),
      source: ev.filename ? `${ev.filename}:${ev.lineno ?? 0}` : undefined,
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason as unknown;
    push({
      kind: 'rejection',
      message:
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Unhandled promise rejection',
    });
  });
}
