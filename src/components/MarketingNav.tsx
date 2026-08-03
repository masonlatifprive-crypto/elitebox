/**
 * Marketing navbar (design.md §10.1): fixed glass pill, active cyan underline
 * beam, profile + "Open App" CTA, mobile full-screen glass overlay menu,
 * scroll progress hairline (§8). The Layout owns content offset — the nav
 * itself stays fixed overlay (full-bleed hero design).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, User, X } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import LanguageSwitch from '@/components/LanguageSwitch';
import openCommandPalette from '@/components/CommandPalette';
import { ButtonPrimary } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/', label: 'Movies', end: true },
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/providers', label: 'Addons' },
  { to: '/community', label: 'Community' },
  { to: '/developers', label: 'Developers' },
] as const;

export default function MarketingNav() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(winScroll > 20);
      if (height > 0) setProgress((winScroll / height) * 100);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={cn(
      'fixed inset-x-0 top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-deep/80 py-8 backdrop-blur-md border-b border-white/5' : 'bg-transparent py-16'
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-24">
        <Link to="/" className="relative z-50 flex items-center gap-12 group">
          <LogoMark className="h-32 w-32 text-cyan transition-transform group-hover:scale-105" />
          <span className="text-h3 font-bold tracking-tight text-ink">EliteBox</span>
        </Link>

        <div className="hidden items-center gap-32 lg:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => cn(
                'relative py-4 text-body font-medium transition-colors hover:text-cyan',
                isActive ? 'text-cyan' : 'text-muted'
              )}
            >
              {({ isActive }) => (
                <>
                  {t(link.label)}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-4 inset-x-0 h-2 bg-cyan shadow-[0_0_8px_rgba(124,217,236,.6)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-16">
          <button
            onClick={() => openCommandPalette()}
            className="flex h-40 w-40 items-center justify-center rounded-full text-muted transition-all hover:bg-white/5 hover:text-ink"
          >
            <Search size={20} />
          </button>
          <div className="hidden sm:block">
            <LanguageSwitch />
          </div>
          <Link to="/app">
            <ButtonPrimary className="hidden sm:flex">Open App</ButtonPrimary>
          </Link>
          <button
            className="flex h-40 w-40 items-center justify-center text-ink lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-1 bg-cyan/20 w-full">
        <motion.div
          className="h-full bg-cyan shadow-[0_0_8px_rgba(124,217,236,.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[60px] z-40 flex flex-col bg-deep/95 p-24 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-24">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-h2 font-bold text-ink"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(link.label)}
                </NavLink>
              ))}
              <hr className="border-white/10" />
              <div className="flex flex-col gap-16">
                <Link to="/login" className="text-body text-muted">Sign In</Link>
                <Link to="/register" className="text-body text-muted">Create Account</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
