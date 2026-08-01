/**
 * MovieWall — the living hero backdrop: three seamless marquee rows of real
 * catalog artwork drifting at different speeds under a lunar veil. When live
 * catalog items are passed in (auth pages, onboarding), the wall shows the
 * actual titles in the public catalog; otherwise it falls back to the
 * bundled open-movie art (decorative only — never presented as a catalog).
 *
 * Performance: pure CSS transforms on composited layers, no JS animation.
 * Accessibility: purely decorative (aria-hidden), frozen under reduced motion.
 */
import { useReducedMotion } from 'framer-motion';
import type { MetaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const TITLES = [
  'sintel',
  'tears-of-steel',
  'big-buck-bunny',
  'cosmos-laundromat',
  'elephants-dream',
  'charge',
  'agent-327',
  'sprite-fright',
  'wing-it',
  'caminandes-1',
  'caminandes-2',
  'caminandes-3',
];

interface WallTile {
  key: string;
  src: string;
}

/** three rows, rotated so no two adjacent rows share an order */
function rotateRows<T>(base: T[]): T[][] {
  return [base, [...base.slice(4), ...base.slice(0, 4)], [...base.slice(8), ...base.slice(0, 8)]];
}

const SHOWCASE_ROWS: WallTile[][] = rotateRows(
  TITLES.map((t) => ({ key: t, src: `/art/backdrop-${t}.jpg` })),
);

/** Rows from real catalog items — backdrop art preferred, poster as backup. */
function rowsFromItems(items: MetaItem[]): WallTile[][] | undefined {
  const tiles = items
    .filter((m) => m.backdrop || m.poster)
    .slice(0, 12)
    .map((m) => ({ key: m.id, src: (m.backdrop ?? m.poster) as string }));
  return tiles.length >= 6 ? rotateRows(tiles) : undefined;
}

const ROW_DURATION = ['110s', '140s', '95s'];

function WallRow({ tiles, duration, reverse }: { tiles: WallTile[]; duration: string; reverse?: boolean }) {
  /* content duplicated once — translateX(-50%) loops seamlessly */
  const loop = [...tiles, ...tiles];
  return (
    <div className="flex overflow-hidden">
      <div
        className={cn('flex w-max gap-14 pr-14', reverse ? 'moviewall-drift-r' : 'moviewall-drift')}
        style={{ animationDuration: duration }}
      >
        {loop.map((tile, i) => (
          <img
            key={`${tile.key}-${i}`}
            src={tile.src}
            alt=""
            loading={i < 4 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className="h-[124px] w-[220px] select-none rounded-lg object-cover brightness-[.86] saturate-[.95] ring-1 ring-white/[.09] md:h-[156px] md:w-[278px]"
          />
        ))}
      </div>
    </div>
  );
}

export default function MovieWall({ className, items }: { className?: string; items?: MetaItem[] }) {
  const reduceMotion = useReducedMotion();
  const rows = (items && rowsFromItems(items)) ?? SHOWCASE_ROWS;
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      {/* the wall itself, slightly rotated for depth */}
      <div
        className="absolute -inset-x-[8%] -top-[12%] -bottom-[12%] flex flex-col justify-center gap-14"
        style={{ transform: 'rotate(-4deg) scale(1.12)' }}
      >
        {rows.map((row, r) =>
          reduceMotion ? (
            <div key={r} className="flex justify-center gap-14">
              {row.slice(0, 8).map((tile) => (
                <img
                  key={tile.key}
                  src={tile.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-[124px] w-[220px] select-none rounded-lg object-cover brightness-[.62] saturate-[.82] ring-1 ring-white/[.07] md:h-[152px] md:w-[270px]"
                />
              ))}
            </div>
          ) : (
            <WallRow key={r} tiles={row} duration={ROW_DURATION[r]} reverse={r === 1} />
          ),
        )}
      </div>

      {/* lunar veil: readability scrim in the center, art visible at the
          edges, on-palette color grading over everything */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep/90 via-deep/30 to-deep" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(52% 46% at 50% 52%, rgba(3,6,18,.78), rgba(3,6,18,.28) 58%, transparent 78%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 46% at 18% 12%, rgba(124,217,236,.16), transparent 62%), radial-gradient(52% 44% at 84% 88%, rgba(139,124,232,.17), transparent 60%)',
        }}
      />
    </div>
  );
}
