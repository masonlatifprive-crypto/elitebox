/**
 * AppRail Component
 * 
 * - Desktop (>=768px): fixed side bar + ink label, profile avatar at bottom.
 * - Mobile (<768px): bottom solid glass nav with 5 items + safe-area inset.
 */
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  Search, 
  Library, 
  Settings, 
  PlusCircle,
  LayoutGrid,
  User
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/app' },
  { id: 'search', label: 'Search', icon: Search, path: '/app/search' },
  { id: 'collections', label: 'Collections', icon: LayoutGrid, path: '/app/collections' },
  { id: 'addons', label: 'Addons', icon: PlusCircle, path: '/app/addons' },
  { id: 'library', label: 'Library', icon: Library, path: '/app/library' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
]

export default function AppRail() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{ width: isHovered ? 240 : 80 }}
        className="fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-white/5 bg-deep/80 backdrop-blur-xl transition-all duration-300 md:flex"
      >
        {/* Logo Section */}
        <div className="flex h-20 items-center px-6">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-6 w-6 text-cyan" glow={true} />
            <motion.span
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              className="whitespace-nowrap text-lg font-bold tracking-tight text-white"
            >
              EliteBox<span className="text-cyan">Movies</span>
            </motion.span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center rounded-xl p-3 transition-all duration-200',
                  isActive
                    ? 'bg-cyan/10 text-cyan'
                    : 'text-silver/60 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <motion.span
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                    className="ml-3 whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </motion.span>

                  {isActive && (
                    <motion.div
                      layoutId="active-bar"
                      className="absolute left-0 h-5 w-0.5 rounded-r-full bg-gradient-to-b from-cyan to-purple"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
              <User className="h-4 w-4 text-silver" />
            </div>
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="text-xs font-medium text-silver">Guest User</div>
              <div className="text-[10px] text-silver/40">Free Plan</div>
            </motion.div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full border-t border-white/5 bg-deep/80 pb-safe backdrop-blur-xl md:hidden">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center py-2 transition-colors',
                isActive ? 'text-cyan' : 'text-silver/40'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
