import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import { LogoMark } from './Logo';
import LanguageSwitch from './LanguageSwitch';
import { ButtonNeon, ButtonGhost } from './ui-elite';
import { useT } from '../i18n';
import { cn } from '../lib/utils';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/app/explore', label: 'Discover' },
  { to: '/faq', label: 'Support' },
] as const;

export default function MarketingNav() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        scrolled
          ? 'bg-black/80 backdrop-blur-md border-white/10 py-3'
          : 'bg-transparent border-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <LogoMark className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
          <span className="font-bold text-xl tracking-tighter">ELITEBOX</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-white' : 'text-white/60'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitch />
          <Link to="/app/explore">
            <ButtonGhost size="sm">Sign In</ButtonGhost>
          </Link>
          <Link to="/downloads">
            <ButtonNeon size="sm">Download</ButtonNeon>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-white/10 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-2xl font-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <hr className="border-white/10" />
              <div className="flex flex-col gap-4">
                <Link to="/downloads" className="w-full">
                  <ButtonNeon className="w-full">Download Now</ButtonNeon>
                </Link>
                <Link to="/app/explore" className="w-full text-center">
                  <span className="text-sm text-white/60">Go to App</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
