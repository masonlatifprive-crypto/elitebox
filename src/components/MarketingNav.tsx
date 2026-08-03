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
import { openCommandPalette } from '@/components/CommandPalette';
import { ButtonPrimary, spring } from '@/components/ui-elite';
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
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setProgress(scrolled);
      setScrolled(winScroll > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300",
      scrolled ? "py-3" : "py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className={cn(
          "mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-6 transition-all",
          scrolled ? "bg-surface/80 shadow-lg backdrop-blur-md" : "bg-transparent"
        )}>
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <LogoMark className="h-8 w-8 text-neon" />
              <span className="font-display text-xl font-bold tracking-tight text-ink">EliteBox</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors hover:text-neon",
                    isActive ? "text-neon" : "text-muted"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon"
                          transition={spring}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCommandPalette}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink"
            >
              <Search className="h-5 w-5" />
            </button>
            <LanguageSwitch />
            <Link to="/login" className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink">
              <User className="h-5 w-5" />
            </Link>
            <ButtonPrimary size="sm" className="hidden md:flex" asChild>
              <Link to="/app">Open App</Link>
            </ButtonPrimary>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted md:hidden"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-neon shadow-[0_0_8px_rgba(0,255,242,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-surface/95 pt-24 backdrop-blur-xl md:hidden"
          >
            <div className="container mx-auto px-6 space-y-4">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-2xl font-display font-semibold text-ink hover:text-neon"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/10 my-8" />
              <ButtonPrimary className="w-full justify-center text-lg py-6" asChild>
                <Link to="/app">Open App</Link>
              </ButtonPrimary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
