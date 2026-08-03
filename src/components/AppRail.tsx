/** * App shell navigation (design.md §10.3): * - Desktop/TV: fixed left rail, 72px collapsed → 224px on hover/focus *   (spring.smooth), glass-2 over --deep, "E" monogram → /app, active item *   gets cyan icon + 3px gradient bar + ink label, profile avatar at bottom. * - Mobile (<768px): bottom solid glass nav with 5 items + safe-area inset. */
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
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col bg-deep/80 backdrop-blur-xl border-r border-white/5"
        initial={{ width: 72 }}
        animate={{ width: isHovered ? 224 : 72 }}
        transition={spring.smooth}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="p-4 mb-8">
          <Link to="/app" className="block">
            <Logo variant="monogram" className="w-10 h-10" />
          </Link>
        </div>


        <nav className="flex-1 px-3 space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center h-12 rounded-xl transition-all duration-300 group relative',
                  isActive 
                    ? 'bg-cyan/10 text-cyan' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="w-12 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <motion.span
                    className="font-medium whitespace-nowrap overflow-hidden"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                  >
                    {item.label}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="activeRail"
                      className="absolute left-0 w-[3px] h-6 bg-gradient-to-b from-cyan to-blue rounded-r-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>


        <div className="p-3 mt-auto border-t border-white/5">
          <button className="flex items-center w-full h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <div className="w-12 flex items-center justify-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 border border-white/10 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            {isHovered && (
              <span className="font-medium ml-2">Profile</span>
            )}
          </button>
        </div>
      </motion.aside>


      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-deep/90 backdrop-blur-2xl border-t border-white/5 px-4 pb-safe">
        <div className="flex items-center justify-between h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1',
                  isActive ? 'text-cyan' : 'text-white/40'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
