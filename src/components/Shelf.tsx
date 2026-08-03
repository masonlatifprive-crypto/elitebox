/**
 * Shelf (design.md §10.5): horizontal snap rail with edge fade masks, glass
 * chevron scroll buttons on hover (desktop), staggered entrance, TV spatial
 * focus enlargement handled by the `focusable` contract (tvnav.ts).
 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import type { MetaItem } from '@/lib/types';
import { spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';


interface ShelfProps {
  /** omit when the surrounding section renders its own header */
  title?: string;
  items: MetaItem[];
  seeAllTo?: string;
  /** per-item resume progress lookup (0–1) */
  progressFor?: (id: string) => number | undefined;
  /** slow auto-drift (0.5px/frame) after 4s idle; pauses on interaction */
  autoScroll?: boolean;
  className?: string;
}


export default function Shelf({ title, items, seeAllTo, progressFor, autoScroll, className }: ShelfProps) {
  const { t } = useT();
  const railRef = useRef<HTMLDivElement>(null);


  // Idle auto-scroll (home.md S2): 0.5px/frame after 4s idle, pause on
  // hover/focus/touch, wrap around at the end.
  useEffect(() => {
    const rail = railRef.current;
    if (!autoScroll || !rail) return;
