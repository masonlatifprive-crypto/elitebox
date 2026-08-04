/**
 * App shell navigation (design.md §10.3):
 * - Desktop/TV: fixed left rail, 72px collapsed → 224px on hover/focus *
 *   (spring.smooth), glass-2 over --deep, \"E\" monogram → /app, active item *
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
  { id: 'collections', label: 'Collections', icon: Layers, path: '/app/collections' },
  { id: 'addons', label: 'Addons', icon: LayoutDashboard, path: '/app/addons' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, path: '/app/calendar' },
  { id: 'stats', label: 'Stats', icon: BarChart3, path: '/app/stats' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
];

export function AppRail() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Desktop Rail */}
      <motion.aside
        className=\"hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col bg-deep/80 backdrop-blur-xl border-r border-white/5 overflow-hidden\"
        initial={false}
        animate={{ width: isHovered ? 224 : 72 }}
        transition={spring.smooth}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className=\"flex flex-col h-full\">
          {/* Logo Section */}
          <div className=\"h-20 flex items-center px-6 mb-4\">
            <Link to=\"/app\" className=\"flex items-center gap-4 group\">
              <Logo className=\"h-6 w-6 text-cyan\" glow={true} />
              <motion.span
                className=\"font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 whitespace-nowrap\"
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              >
                EliteBox
              </motion.span
            </Link>
          </div>

          {/* Nav Items */}
          <nav className=\"flex-1 px-3 space-y-1\">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  cn(
                    \"flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative\",
                    isActive
                      ? \"bg-cyan/10 text-cyan\"
                      : \"text-white/40 hover:text-white/80 hover:bg-white/5\"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className=\"h-6 w-6 shrink-0\" />
                    <motion.span
                      className=\"font-medium whitespace-nowrap\"
                      animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                    >
                      {item.label}
                    </motion.span
                    {isActive && (
                      <motion.div
                        layoutId=\"activeBar\"
                        className=\"absolute left-0 w-1 h-6 bg-cyan rounded-r-full\"
                        transition={spring.smooth}
                      />
                    )}
                  </>
                )}
              </NavLink
            ))}
          </nav>

          {/* Footer/Profile */}
          <div className=\"p-3 border-t border-white/5\">
            <button className=\"flex items-center gap-4 px-3 py-3 w-full rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all group\">
              <User className=\"h-6 w-6 shrink-0\" />
              <motion.span
                className=\"font-medium whitespace-nowrap\"
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              >
                Profile
              </motion.span
            </button
          </div>
        </div>
      </motion.aside
>

      {/* Mobile Bottom Nav */}
      <nav className=\"md:hidden fixed bottom-0 left-0 right-0 h-16 bg-deep/90 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-50 pb-safe\">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              cn(
                \"flex flex-col items-center justify-center gap-1 transition-colors\",
                isActive ? \"text-cyan\" : \"text-white/40\"
              )
            }
          >
            <item.icon className=\"h-6 w-6\" />
          </NavLink
        ))}
      </nav
>
    </>
  );
}
