/**
 * Release Calendar — `/app/calendar`.
 *
 * Every announced premiere on one honest timeline: countdowns and .ics
 * export appear only for officially dated titles, everything else is
 * "date TBA" — never an invented day. Watchlisted premieres surface an
 * arrival toast once their confirmed date passes (local, per device).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, BellRing, Bookmark, BookmarkCheck, CalendarClock, CalendarPlus, Sparkles } from 'lucide-react';
import { findShowcaseMeta } from '@/data/showcase';
import { useCatalogItems } from '@/pages/app/Discover';
import { useLibrary } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import {
  countdownTo,
  downloadIcs,
  drainArrivedReleases,
  monthLabel,
  releaseMonthKey,
} from '@/lib/releases';
import { ButtonGhost, ButtonNeon, Eyebrow, GlassPanel, spring, toast } from '@/components/ui-elite';
import { useT } from '@/i18n';


/* ── live countdown (ticking every second) ─────────────────────────────── */


function Countdown({ iso }: { iso: string }) {
  const { t } = useT();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const c = countdownTo(iso, now);
