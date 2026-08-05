/**
 * Branded 404 (not-found.md) — catches every unmatched route, marketing and
 * app. Bare shell: its own AmbienceCanvas, no nav/rail. Rendered as a fixed
 * full-viewport stage so it covers whichever shell it was routed through.
 * Back is context-aware (history back, else `/` or `/app` by path prefix).
 */
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import AmbienceCanvas from '../components/AmbienceCanvas';
import { LogoMark } from '../components/Logo';
import { ButtonGhost, ButtonNeon, ButtonPrimary, spring } from '../components/ui-elite';
import { useT } from '../i18n';


const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];


export default function NotFound() {
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();


  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(location.pathname.startsWith('/app') ? '/app' : '/');
    }
  }, [navigate, location.pathname]);


  // Esc / Backspace triggers back (consistent with app navigation).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        goBack();
