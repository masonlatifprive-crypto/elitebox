/**
 * App shell navigation (design.md §10.3):
 * - Desktop/TV: fixed left rail, 72px collapsed → 224px on hover/focus
 *   (spring.smooth), glass-2 over --deep, "E" monogram → /app, active item
 *   gets cyan icon + 3px gradient bar + ink label, profile avatar at bottom.
 * - Mobile (<768px): bottom solid glass nav with 5 items + safe-area inset.
 */
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  Compass,
  Film,
  Home,
  LibraryBig,
  MonitorPlay,
  Puzzle,
  Radio,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { LogoE } from '@/components/Logo';
import { openCommandPalette } from '@/components/CommandPalette';
import { spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { useProfiles } from '@/lib/store';
import { cn } from '@/lib/utils';

const RAIL_ITEMS = [
  { to: '/app', labelKey: 'app.rail.home', icon: Home, end: true },
  { to: '/app/discover', labelKey: 'app.rail.discover', icon: Compass },
  { to: '/app/movies', labelKey: 'app.rail.movies', icon: Film },
  { to: '/app/series', labelKey: 'app.rail.series', icon: MonitorPlay },
  { to: '/app/anime', labelKey: 'Anime', icon: MonitorPlay },
  { to: '/app/arabic', labelKey: 'Arabic', icon: Film },
  { to: '/app/bollywood', labelKey: 'Bollywood', icon: Film },
  { to: '/app/live', labelKey: 'app.rail.live', icon: Radio },
  { to: '/app/calendar', labelKey: 'app.rail.calendar', icon: CalendarDays },
  { to: '/app/search', labelKey: 'app.rail.search', icon: Search },
  { to: '/app/library', labelKey: 'app.rail.library', icon: LibraryBig },
  { to: '/app/addons', labelKey: 'app.rail.addons', icon: Puzzle },
  { to: '/app/stats', labelKey: 'app.rail.stats', icon: BarChart3 },
  { to: '/app/tv', labelKey: 'TV Focus', icon: MonitorPlay },
  { to: '/app/settings', labelKey: 'app.rail.settings', icon: Settings },
] as const;

const MOBILE_ITEMS = [
  { to: '/app', labelKey: 'app.rail.home', icon: Home, end: true },
  { to: '/app/discover', labelKey: 'app.rail.discover', icon: Compass },
  { to: '/app/search', labelKey: 'app.rail.search', icon: Search },
  { to: '/app/library', labelKey: 'app.rail.library', icon: LibraryBig },
  { to: '/app/tv', labelKey: 'TV Focus', icon: MonitorPlay },
  { to: '/app/settings', labelKey: 'app.rail.settings', icon: Settings },
] as const;

function ProfileAvatar({ size = 36 }: { size?: number }) {
  const { profiles, activeProfileId } = useProfiles();
  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  if (active?.avatar) {
    return (
      <img
        src={active.avatar}
        alt={active.name}
        className="rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="glass-1 flex items-center justify-center rounded-full text-muted"
      style={{ width: size, height: size }}
    >
      <User size={Math.round(size * 0.55)} strokeWidth={1.75} />
    </span>
  );
}

export default function AppRail() {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ── desktop / TV left rail ── */}
      <motion.aside
        className="glass-2 fixed left-0 top-0 z-40 hidden lg:flex h-[100dvh] flex-col border-y-0 border-l-0"
        initial={false}
        animate={{ width: expanded ? 224 : 72 }}
        transition={spring.smooth}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setExpanded(false);
        }}
        aria-label={t('app.rail.appNav')}
      >
        <Link
          to="/app"
          aria-label={t('app.rail.homeAria')}
          className="focusable mx-auto mt-16 flex h-48 w-48 items-center justify-center rounded-lg"
        >
          <LogoE height={30} />
        </Link>

        <nav className="mt-24 flex flex-1 flex-col gap-4 px-12">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label={t('app.rail.openCommandPalette')}
            title={t('app.rail.commandPalette')}
            className="focusable group relative flex items-center gap-16 rounded-lg px-12 py-12 text-muted transition-colors duration-[180ms] hover:text-ink hover:bg-white/[.05] cursor-pointer"
          >
            <Search size={22} strokeWidth={1.75} className="shrink-0" />
            <motion.span
              className="text-micro uppercase whitespace-nowrap"
              initial={false}
              animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
              transition={{ duration: 0.18 }}
            >
              {t('app.rail.command')}
            </motion.span>
            <motion.kbd
              className="glass-1 ml-auto rounded-md px-6 py-2 font-mono text-[10px] uppercase text-muted whitespace-nowrap"
              initial={false}
              animate={{ opacity: expanded ? 1 : 0 }}
              transition={{ duration: 0.18 }}
            >
              Ctrl K
            </motion.kbd>
          </button>
          {RAIL_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item && item.end}
              className={({ isActive }) =>
                cn(
                  'focusable group relative flex items-center gap-16 rounded-lg px-12 py-12 transition-colors duration-[180ms]',
                  isActive ? 'text-cyan' : 'text-muted hover:text-ink hover:bg-white/[.05]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="rail-active-bar"
                      className="absolute left-0 top-1/2 h-24 w-3 -translate-y-1/2 rounded-full bg-signature"
                      transition={spring.snappy}
                    />
                  )}
                  <item.icon size={22} strokeWidth={1.75} className="shrink-0" />
                  <motion.span
                    className={cn(
                      'text-micro uppercase whitespace-nowrap',
                      isActive ? 'text-ink' : '',
                    )}
                    initial={false}
                    animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {item.labelKey.includes('.') ? t(item.labelKey) : item.labelKey}
                  </motion.span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/app/profiles"
          aria-label={t('app.rail.profiles')}
          className="focusable mx-auto mb-24 flex items-center gap-12 rounded-full p-4"
        >
          <ProfileAvatar />
          <motion.span
            className="text-micro uppercase text-muted whitespace-nowrap"
            initial={false}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.18 }}
          >
            {t('app.rail.profiles')}
          </motion.span>
        </Link>
      </motion.aside>

      {/* ── mobile bottom nav ── */}
      <nav
        className="glass-solid fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 lg:hidden items-stretch border-x-0 border-b-0 overflow-x-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={t('app.rail.appNav')}
      >
        {MOBILE_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item && item.end}
            className={({ isActive }) =>
              cn(
                'relative flex min-w-0 flex-col items-center gap-3 px-1 py-10',
                isActive ? 'text-cyan' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-bar"
                    className="absolute top-0 h-2 w-24 rounded-full bg-signature"
                    transition={spring.snappy}
                  />
                )}
                <item.icon size={22} strokeWidth={1.75} />
                <span className="max-w-full truncate text-[9px] font-semibold uppercase tracking-[.04em]">
                  {item.labelKey.includes('.') ? t(item.labelKey) : item.labelKey}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
