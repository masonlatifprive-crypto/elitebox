/**
 * TV / 10-foot spatial navigation (design.md §9).
 *
 * Contract: interactive elements carry the `focusable` class. When TV mode is
 * active (forced via `?tv=1`, or auto-detected from TV user agents at
 * viewport ≥1280px) this hook provides:
 *  - roving tabindex across all .focusable elements
 *  - nearest-neighbor arrow-key movement (geometric, center-of-rect scoring)
 *  - Enter = activate, Backspace/Esc = back
 *  - "html.tv-mode" class → 1.15× UI scale + 3px focus rings (index.css)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TV_OVERRIDE_KEY = 'elitebox.v1.tv-override';
export const TV_OVERRIDE_EVENT = 'elitebox:tv-override';

export type TVMode = 'off' | 'on';

/** Manual TV-mode override: '1' forces on, '0' forces off, absent = auto. */
export function getTVOverride(): boolean | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(TV_OVERRIDE_KEY);
  if (stored === '1') return true;
  if (stored === '0') return false;
  return null;
}

export function setTVMode(mode: TVMode): TVMode {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TV_OVERRIDE_KEY, mode === 'on' ? '1' : '0');
    window.dispatchEvent(new CustomEvent(TV_OVERRIDE_EVENT, { detail: { mode } }));
  }
  return mode;
}

export function getTVMode(): TVMode {
  const override = getTVOverride();
  if (override !== null) return override ? 'on' : 'off';
  return autoDetectTV() ? 'on' : 'off';
}

export function toggleTVMode(): TVMode {
  const nextMode: TVMode = getTVMode() === 'on' ? 'off' : 'on';
  return setTVMode(nextMode);
}

function autoDetectTV(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('tv') === '1') return true;
  const ua = navigator.userAgent;
  return /(Smart-?TV|SMART-TV|Android TV|AFT[A-Z0-9]|BRAVIA|CrKey|AppleTV|Web0S|webOS.TV|Tizen)/i.test(ua);
}

export function useTVNavigation() {
  const [isTV, setIsTV] = useState(getTVMode() === 'on');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOverride = () => setIsTV(getTVMode() === 'on');
    window.addEventListener(TV_OVERRIDE_EVENT, handleOverride);
    return () => window.removeEventListener(TV_OVERRIDE_EVENT, handleOverride);
  }, []);

  useEffect(() => {
    if (isTV) {
      document.documentElement.classList.add('tv-mode');
    } else {
      document.documentElement.classList.remove('tv-mode');
    }
  }, [isTV]);

  return { isTV, toggleTVMode };
}
