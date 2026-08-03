/**
 * App shell navigation (design.md §10.3):
 * - Desktop/TV: fixed left rail, 72px collapsed → 224px on hover/focus *
 *   (spring.smooth), glass-2 over --deep, "E" monogram → /app, active item *
 *   gets cyan icon + 3px gradient bar + ink label, profile avatar at bottom.
 * - Mobile (<768px): bottom solid glass nav with 5 items + safe-area inset.
 */
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  Home,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  Radio,
  Search,
  Settings,
  Tv,
  User,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';
import { spring } from './ui-elite';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/app' },
  { id: 'search', label: 'Search', icon: Search, path: '/app/search' },
  { id: 'live', label: 'Live TV', icon: Radio, path: '/app/live' },
  { id: 'library', label: 'Library', icon: Library, path: '/app/library' },
  { id: 'calendar', label: 'Schedule', icon: CalendarDays, path: '/app/calendar' },
];

export function AppRail() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Desktop Rail */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-white/5 bg-deep/80 backdrop-blur-xl md:flex",
          isHovered ? "w-56" : "w-[72px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        transition={spring.smooth}
      >
        <div className="flex h-16 items-center px-6">
          <Link to="/app" className="flex items-center gap-3">
            <Logo className="h-6 w-6 text-cyan" />
            {isHovered && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold tracking-tight text-white"
              >
                ELITEBOX
              </motion.span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-10 items-center gap-3 rounded-lg px-3 transition-colors",
                  isActive ? "text-cyan" : "text-ink hover:bg-white/5 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="active-rail"
                      className="absolute left-0 h-6 w-1 rounded-r-full bg-cyan"
                      transition={spring.smooth}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3">
          <button className="group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-ink hover:bg-white/5 hover:text-white">
            <User className="h-5 w-5 shrink-0" />
            {isHovered && <span className="text-sm font-medium">Profile</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-white/5 bg-deep/80 px-4 pb-safe backdrop-blur-xl md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-cyan" : "text-ink"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default AppRail;
