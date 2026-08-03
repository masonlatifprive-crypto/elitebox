import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type TVMode = 'off' | 'on';
const STORAGE_KEY = 'elitebox-tv-mode';

export function getTVMode(): TVMode {
  if (typeof window === 'undefined') return 'off';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'on' ? 'on' : 'off';
}

export function setTVMode(mode: TVMode): TVMode {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent('tvnav:change', { detail: { mode } }));
    if (mode === 'on') document.documentElement.classList.add('tv-mode');
    else document.documentElement.classList.remove('tv-mode');
  }
  return mode;
}

export function toggleTVMode(): TVMode {
  const nextMode: TVMode = getTVMode() === 'on' ? 'off' : 'on';
  return setTVMode(nextMode);
}

export function isTVModeEnabled(): boolean {
  return getTVMode() === 'on';
}

/**
 * useSpatialNav: A safe hook for TV spatial navigation.
 * Contract: interactive elements carry the 'focusable' class.
 */
export function useSpatialNav() {
  const [active, setActive] = useState(isTVModeEnabled());

  useEffect(() => {
    const handleToggle = (e: any) => setActive(e.detail.mode === 'on');
    window.addEventListener('tvnav:change', handleToggle);
    return () => window.removeEventListener('tvnav:change', handleToggle);
  }, []);

  return { isTVMode: active };
}
