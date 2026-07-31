/**
 * TV / 10-foot spatial navigation (design.md §9).
 *
 * Contract: interactive elements carry the `focusable` class. When TV mode is
 * active (forced via `?tv=1`, or auto-detected from TV user agents at
 * viewport ≥1280px) this hook provides:
 *  - roving tabindex across all `.focusable` elements
 *  - nearest-neighbor arrow-key movement (geometric, center-of-rect scoring)
 *  - Enter = activate, Backspace/Esc = back
 *  - `html.tv-mode` class → 1.15× UI scale + 3px focus rings (index.css)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

const TV_OVERRIDE_KEY = 'elitebox.v1.tv-override';
export const TV_OVERRIDE_EVENT = 'elitebox:tv-override';

/** Manual TV-mode override: '1' forces on, '0' forces off, absent = auto. */
export function getTVOverride(): boolean | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(TV_OVERRIDE_KEY);
  return v === '1' ? true : v === '0' ? false : null;
}

function autoDetectTV(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('tv') === '1') return true;
  const ua = navigator.userAgent;
  // TV user agents are trusted directly; desktop browsers need ?tv=1.
  return /(Smart-?TV|SMART-TV|Android TV|AFT[A-Z0-9]|BRAVIA|CrKey|AppleTV|Web0S|webOS.TV|Tizen)/i.test(ua);
}

export function detectTV(): boolean {
  if (typeof window === 'undefined') return false;
  return getTVOverride() ?? autoDetectTV();
}

/**
 * Flip TV mode manually. Toggling back to the auto-detected value clears the
 * override. Applies the html.tv-mode class immediately and notifies
 * useSpatialNav so arrow-key navigation follows. Returns the new state.
 */
export function toggleTVMode(): boolean {
  const next = !detectTV();
  if (next === autoDetectTV()) {
    localStorage.removeItem(TV_OVERRIDE_KEY);
  } else {
    localStorage.setItem(TV_OVERRIDE_KEY, next ? '1' : '0');
  }
  document.documentElement.classList.toggle('tv-mode', next);
  window.dispatchEvent(new Event(TV_OVERRIDE_EVENT));
  return next;
}

function visibleFocusables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.focusable')).filter((el) => {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  });
}

type Direction = 'up' | 'down' | 'left' | 'right';

const DIR_VECTOR: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function nearestInDirection(from: HTMLElement, dir: Direction, candidates: HTMLElement[]): HTMLElement | null {
  const a = from.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  const [dx, dy] = DIR_VECTOR[dir];
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of candidates) {
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    const vx = bx - ax;
    const vy = by - ay;
    const primary = vx * dx + vy * dy; // distance along the arrow direction
    if (primary <= 4) continue; // must actually be in that direction
    const perp = Math.abs(dx === 0 ? vx : vy);
    // require meaningful directional alignment (cone check)
    if (perp > primary * 1.4 + 24) continue;
    const score = primary + perp * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

function applyRovingTabindex(current: HTMLElement | null): void {
  for (const el of visibleFocusables()) {
    el.tabIndex = el === current ? 0 : -1;
    el.classList.toggle('tv-focused', el === current);
  }
}

export interface SpatialNav {
  enabled: boolean;
}

export function useSpatialNav(): SpatialNav {
  const navigate = useNavigate();
  const location = useLocation();
  const [enabled, setEnabled] = useState<boolean>(() => detectTV());

  // Re-evaluate on resize / ?tv=1 changes / manual override; toggle html.tv-mode.
  useEffect(() => {
    const update = () => setEnabled(detectTV());
    update();
    window.addEventListener('resize', update);
    window.addEventListener(TV_OVERRIDE_EVENT, update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener(TV_OVERRIDE_EVENT, update);
    };
  }, [location.search]);

  useEffect(() => {
    document.documentElement.classList.toggle('tv-mode', enabled);
    if (!enabled) {
      applyRovingTabindex(null);
      return;
    }

    const ensureCurrent = (): HTMLElement | null => {
      const active = document.activeElement as HTMLElement | null;
      if (active && active.classList.contains('focusable') && active.tabIndex === 0) return active;
      const all = visibleFocusables();
      const current = all.find((el) => el.classList.contains('tv-focused')) ?? all[0] ?? null;
      applyRovingTabindex(current);
      return current;
    };

    // Seed roving tabindex shortly after mount / route change.
    const seed = window.setTimeout(() => ensureCurrent(), 50);

    const onKeyDown = (e: KeyboardEvent) => {
      const dir: Direction | null =
        e.key === 'ArrowUp' ? 'up'
        : e.key === 'ArrowDown' ? 'down'
        : e.key === 'ArrowLeft' ? 'left'
        : e.key === 'ArrowRight' ? 'right'
        : null;

      if (dir) {
        const current = ensureCurrent();
        if (!current) return;
        const next = nearestInDirection(current, dir, visibleFocusables());
        if (next) {
          e.preventDefault();
          applyRovingTabindex(next);
          next.focus({ preventScroll: true });
          next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        } else {
          e.preventDefault(); // keep focus inside the app in TV mode
        }
        return;
      }

      if (e.key === 'Enter') {
        const current = ensureCurrent();
        if (current && document.activeElement !== current) {
          e.preventDefault();
          current.click();
        }
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Escape') {
        // Let an open dialog handle Escape first.
        if (e.key === 'Escape' && document.querySelector('[role="dialog"], [data-modal-open]')) return;
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        navigate(-1);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.classList?.contains('focusable')) applyRovingTabindex(el);
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      window.clearTimeout(seed);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      document.documentElement.classList.remove('tv-mode');
    };
  }, [enabled, navigate, location.pathname]);

  return { enabled };
}
