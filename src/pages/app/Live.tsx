/**
 * Live TV — /app/live (live.md).
 * Real channels from installed live/catalog addons with health chips and
 * one-tap play. Channels show only their real metadata (name, art, live
 * status, description) — no program schedule is fabricated: without EPG
 * data the honest state is "Live now". 10-foot first; number keys 1–9
 * jump to channels on TV.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Copy, MoreHorizontal, Play, Radio, RefreshCw, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import { Badge, ButtonNeon, ButtonPrimary, EmptyState, HealthDot, spring, toast } from '../../components/ui-elite';
import { useCatalogItems } from './Discover';
import { addonEngine } from '../../lib/addons/engine';
import { getShowcaseStreams } from '../../data/showcase';
import { useAddons } from '../../lib/store';
import type { AddonHealth, MetaItem } from '../../lib/types';
import { useT } from '../../i18n';
import { cn } from '../../lib/utils';




function signalFor(health?: AddonHealth): 1 | 2 | 3 {
  if (!health || health.status === 'down') return 1;
  const ms = health.latencyMs ?? 0;
  if (health.status === 'degraded' || ms > 800) return 2;
  return 3;
}




export default function Live() {
  const { t } = useT();
  const { items, loading, reload } = useCatalogItems();
  const reduceMotion = useReducedMotion();
  const installed = useAddons((s) => s.installed);
  const [health, setHealth] = useState<Record<string, AddonHealth>>({});
