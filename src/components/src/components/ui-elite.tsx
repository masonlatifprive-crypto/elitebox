/**
 * Elitebox shared UI primitives (design.md §10.6–§10.10).
 * Every button is wired: renders as <Link>/<button> and always does something.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, OctagonX, X } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import type { AddonHealth } from '@/lib/types';


/* ── spring presets (design.md §7) ─────────────────────────────────────── */
export const spring = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  smooth: { type: 'spring', stiffness: 260, damping: 30 },
  cinematic: { type: 'spring', stiffness: 120, damping: 22 },
} as const;


/* ── Buttons ───────────────────────────────────────────────────────────── */


type CommonProps = {
  to?: string;
  /** External URL — renders a real <a target="_blank" rel="noopener noreferrer">. */
  href?: string;
  onClick?: () => void;
  /**
