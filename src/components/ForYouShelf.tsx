/**
 * "From your taste" shelf — on-device personalization, no cloud profile.
 *
 * Scoring (transparent, computed from this device's library only):
 *   genre affinity   60% — how often each genre appears in what you watched,
 *                     favorited or continued
 *   unfinished       25% — series you started but haven't finished
 *   freshness        15% — titles not yet touched get a small discovery boost
 * Everything it uses lives in localStorage; clear your library and the shelf
 * honestly disappears.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLibrary } from '@/lib/store';
import type { MetaItem } from '@/lib/types';
import PosterCard from '@/components/PosterCard';
import { spring } from '@/components/ui-elite';

const GENRE_WEIGHT = 0.6;
const UNFINISHED_WEIGHT = 0.25;
const FRESH_WEIGHT = 0.15;

export function scoreForYou(
  items: MetaItem[],
  lookup: (id: string) => MetaItem | undefined,
  state: { watched: string[]; favorites: string[]; continueWatching: Array<{ id: string; progress?: number }> },
): MetaItem[] {
  const { watched, favorites, continueWatching } = state;

  /* genre frequency across everything the user engaged with */
  const genreHits = new Map<string, number>();
  let engaged = 0;
  const bump = (m: MetaItem | undefined, weight: number) => {
    if (!m) return;
    engaged += weight;
    for (const g of m.genres) genreHits.set(g, (genreHits.get(g) ?? 0) + weight);
  };
  for (const id of watched) bump(lookup(id), 1);
  for (const id of favorites) bump(lookup(id), 1.5);
  for (const e of continueWatching) bump(lookup(e.id), 0.75);
  if (engaged < 2) return [];

  const maxGenre = Math.max(1, ...genreHits.values());
  const affinity = (m: MetaItem) =>
    m.genres.length === 0
      ? 0
      : m.genres.reduce((acc, g) => acc + (genreHits.get(g) ?? 0) / maxGenre, 0) / m.genres.length;

  const watchedSet = new Set(watched);
  const continuingIds = new Set(continueWatching.map((e) => e.id));

  return items
    .filter((m) => !m.upcoming && !m.live && !watchedSet.has(m.id))
    .map((m) => {
      const unfinished =
        m.type === 'series'
          ? (m.videos ?? []).some((v) => continuingIds.has(v.id)) && !watchedSet.has(m.id)
            ? 1
            : 0
          : continuingIds.has(m.id)
            ? 1
            : 0;
      const fresh = continuingIds.has(m.id) || favorites.includes(m.id) ? 0 : 1;
      const score = affinity(m) * GENRE_WEIGHT + unfinished * UNFINISHED_WEIGHT + fresh * FRESH_WEIGHT * 0.5;
      return { m, score };
    })
    .filter(({ score }) => score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ m }) => m);
}

export default function ForYouShelf({
  items,
  lookup,
}: {
  items: MetaItem[];
  lookup: (id: string) => MetaItem | undefined;
}) {
  const watched = useLibrary((s) => s.watched);
  const favorites = useLibrary((s) => s.favorites);
  const continueWatching = useLibrary((s) => s.continueWatching);

  const picks = useMemo(
    () => scoreForYou(items, lookup, { watched, favorites, continueWatching }),
    [items, lookup, watched, favorites, continueWatching],
  );

  if (picks.length < 3) return null;

  return (
    <section className="flex flex-col gap-16" aria-label="From your taste">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-title text-ink">From your taste</h2>
        <span className="text-caption text-muted">
          Tuned on this device from what you watch — nothing leaves your browser.
        </span>
      </div>
      <div className="shelf-fade-x no-scrollbar -mx-16 flex gap-16 overflow-x-auto overscroll-x-contain px-16 py-8 snap-x snap-mandatory md:-mx-24 md:px-24 xl:-mx-48 xl:px-48">
        {picks.map((item, i) => (
          <motion.div
            key={item.id}
            className="snap-start"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring.smooth, delay: Math.min(i, 8) * 0.05 }}
          >
            <PosterCard item={item} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
