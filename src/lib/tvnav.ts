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
import { useNavigate, useLocation } from 'react-router-dom';

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

export function useTVNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    const check = () => {
      const override = getTVOverride();
      const detected = override !== null ? override : autoDetectTV();
      setIsTV(detected);
      document.documentElement.classList.toggle('tv-mode', detected);
    };

    check();
    window.addEventListener(TV_OVERRIDE_EVENT, check);
    return () => window.removeEventListener(TV_OVERRIDE_EVENT, check);
  }, []);

  useEffect(() => {
    if (!isTV) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (window.history.length > 1) {
          e.preventDefault();
          navigate(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTV, navigate]);

  return { isTV };
}
