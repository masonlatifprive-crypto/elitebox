/**
 * Poster card (design.md §10.4): 2:3 art (16:9 for live channels), pointer-
 * tracked 3D tilt (max 8°, perspective 900px) with glare highlight, Focus
 * glow, corner badges (HD / LIVE), resume progress bar, gradient scrim with
 * title + meta. Click → /app/detail/:type/:id.
 */
import { memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Badge, spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import type { MetaItem } from '@/lib/types';
import { cn } from '@/lib/utils';


const TILT_MAX = 8;


interface PosterCardProps {
  item: MetaItem;
  /** 0–1 resume progress; renders the cyan bar at the bottom edge */
  progress?: number;
  className?: string;
}


const PosterCard = memo(function PosterCard({ item, progress, className }: PosterCardProps) {
  const { t } = useT();
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();


  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const sRotateX = useSpring(rotateX, { stiffness: 260, damping: 30 });
  const sRotateY = useSpring(rotateY, { stiffness: 260, damping: 30 });
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18) 0%, transparent 55%)`;
