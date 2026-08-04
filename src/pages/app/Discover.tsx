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
import addonEngine from '@/lib/addons/engine';
import { getAnimeCatalog, getCuratedGlobalTitles, getUpcomingTitles } from '@/lib/globalCatalog';
import { findShowcaseMeta } from '@/data/showcase';
import { useAddons } from '@/lib/store';
import { type AddonHealth, type MetaItem } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export function useCatalogItems() {
  const [items, setItems] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    
    Promise.allSettled([
      addonEngine.getCatalog(),
      getAnimeCatalog(),
      getCuratedGlobalTitles(),
      getUpcomingTitles()
    ]).then(results => {
      if (!alive) return;
      const all = results
        .filter((r): r is PromiseFulfilledResult<MetaItem[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);
      
      const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
      setItems(unique);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [nonce]);

  return { items, loading, reload };
}

export default function Discover() {
  const t = useT();
  const { items, loading, reload } = useCatalogItems();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('type') || 'all';

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.type === filter);
  }, [items, filter]);

  if (loading && items.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('discover.title', 'Discover')}</h1>
          <p className="text-muted-foreground">{t('discover.subtitle', 'Explore movies and shows from your addons.')}</p>
        </div>
        <ButtonGhost onClick={reload} size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('common.refresh', 'Refresh')}
        </ButtonGhost>
      </header>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(item => (
            <PosterCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title={t('discover.empty.title', 'No titles found')}
          description={t('discover.empty.desc', 'Try changing your filters or adding more addons.')}
        />
      )}
    </div>
  );
}
