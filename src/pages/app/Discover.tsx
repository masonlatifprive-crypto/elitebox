/**
 * Discover — /app/discover (discover.md).
 * Filterable, sortable catalog grid across installed catalog addons with a
 * source switcher. Deep-linkable via ?type= ?genre= ?sort= ?collection= ?src=.
 *
 * This module also hosts the shared browsing helpers used by the other
 * browsing pages (catalog hook, smart-collection rules, sort control).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, SearchX, Store } from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import { ButtonGhost, EmptyState, HealthDot, spring } from '@/components/ui-elite';
import { addonEngine } from '@/lib/addons/engine';
import { getAnimeCatalog, getCuratedGlobalTitles, getUpcomingTitles } from '@/lib/globalCatalog';
import { findShowcaseMeta } from '@/data/showcase';
import { useAddons } from '@/lib/store';
import type { AddonHealth, MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';


/* ── Shared browsing helpers (also used by AppHome / Catalog / Search) ──── */


/** Live catalog across all enabled catalog addons. */
export function useCatalogItems(): { items: MetaItem[]; loading: boolean; reload: () => void } {
  const [items, setItems] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([addonEngine.getCatalog(), getAnimeCatalog()])
      .then((results) => {
        const metas = results[0].status === 'fulfilled' ? results[0].value : [];
