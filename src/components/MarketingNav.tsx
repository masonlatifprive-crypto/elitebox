import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import LogoMark from '@/components/Logo';
import LanguageSwitch from '@/components/LanguageSwitch';
import { ButtonNeon, ButtonGhost } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

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
    <nav className={cn(
      'fixed top-0 inset-x-0 z-[100] transition-all duration-500 border-b',
      scrolled 
        ? 'bg-[#050505]/80 backdrop-blur-xl border-white/5 py-3' 
        : 'bg-transparent border-transparent py-5'
    )}>
      <div className="container-wide flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <LogoMark className="w-10 h-10 text-primary transition-transform group-hover:scale-110" />
          <span className="font-display text-xl font-bold tracking-tight text-white">EliteBox</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => cn(
                'text-sm font-medium transition-colors hover:text-white',
                isActive ? 'text-white' : 'text-white/60'
              )}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="h-4 w-px bg-white/10 mx-2" />
          <ButtonGhost size="sm" as={Link} to="/auth/login" className="text-white/70 hover:text-white">
            Sign in
          </ButtonGhost>
          <ButtonNeon size="sm" as={Link} to="/app">
            Launch App
          </ButtonNeon>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full inset-x-0 bg-[#0A0A0A] border-b border-white/5 p-6 flex flex-col gap-6 md:hidden backdrop-blur-3xl"
          >
            {LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-lg font-medium text-white/70"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <ButtonGhost as={Link} to="/auth/login">Sign in</ButtonGhost>
              <ButtonNeon as={Link} to="/app">Launch</ButtonNeon>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
