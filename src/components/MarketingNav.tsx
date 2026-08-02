/**
 * Marketing navbar (design.md §10.1): fixed glass pill, active cyan underline
 * beam, profile + "Open App" CTA, mobile full-screen glass overlay menu,
 * scroll progress hairline (§8). The Layout owns content offset — the nav
 * itself stays fixed overlay (full-bleed hero design).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
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
  /* Logo breathes with intent: it fades away as you scroll down, and comes
     back the moment you scroll up — the mark never crowds the content. */
  const [logoVisible, setLogoVisible] = useState(true);
  const lastY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      const delta = y - lastY.current;
      if (y < 24) setLogoVisible(true);
      else if (delta > 6) setLogoVisible(false);
      else if (delta < -6) setLogoVisible(true);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation; lock body scroll while open.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-16">
        <nav
          className={cn(
            'mx-auto mt-16 flex max-w-[1180px] items-center justify-between gap-8 overflow-hidden rounded-full border transition-all duration-300',
            scrolled
              ? 'glass-solid py-8 pl-14 pr-8 shadow-panel'
              : 'glass-3 py-10 pl-16 pr-10 border-white/10',
          )}
          aria-label={t('common.nav.navLabel')}
        >
          <Link
            to="/"
            aria-label={t('common.nav.home')}
            className="focusable rounded-full shrink-0"
          >
            <motion.span
              className="block"
              animate={{ opacity: logoVisible ? 1 : 0, y: logoVisible ? 0 : -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <LogoMark height={34} />
            </motion.span>
          </Link>

          {/* center links (desktop) */}
          <div className="hidden xl:flex items-center gap-3">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={'end' in l && l.end}
                className={({ isActive }) =>
                  cn(
                    'focusable relative rounded-full px-10 py-7 text-[12px] xl:text-caption transition-colors duration-150',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-beam"
                        className="absolute inset-x-12 -bottom-2 h-2 rounded-full bg-signature"
                        transition={spring.snappy}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* right actions */}
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label={t('common.nav.openCommandPalette')}
              title={t('common.nav.commandPalette')}
              onClick={openCommandPalette}
              className="focusable hidden xl:flex items-center gap-8 rounded-full px-12 py-8 text-muted hover:text-ink hover:bg-white/[.06] transition-colors cursor-pointer"
            >
              <Search size={20} strokeWidth={1.75} />
              <kbd className="glass-1 rounded-md px-6 py-2 font-mono text-[10px] uppercase text-muted">
                Ctrl K
              </kbd>
            </button>
            <Link
              to="/app/profiles"
              aria-label={t('common.nav.profiles')}
              className="focusable hidden xl:flex rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06] transition-colors"
            >
              <User size={20} strokeWidth={1.75} />
            </Link>
            <LanguageSwitch className="hidden xl:flex" />
            <ButtonPrimary to="/app" className="hidden xl:inline-flex px-16 py-8 text-[12px] xl:px-20 xl:text-caption">
              {t('common.nav.openApp')}
            </ButtonPrimary>
            <button
              type="button"
              aria-label={menuOpen ? t('common.nav.closeMenu') : t('common.nav.openMenu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="focusable xl:hidden rounded-full p-8 text-ink hover:bg-white/[.06] cursor-pointer"
            >
              {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </button>
          </div>

          {/* scroll progress hairline */}
          <div className="absolute inset-x-24 -bottom-1 h-2 overflow-hidden rounded-full">
            <div
              className="h-full bg-signature origin-left"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </nav>
      </header>

      {/* mobile full-screen glass overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden glass-solid flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {LINKS.map((l, i) => (
              <motion.div
                key={l.to}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ delay: 0.06 * i, duration: 0.25 }}
              >
                <NavLink
                  to={l.to}
                  end={'end' in l && l.end}
                  className={({ isActive }) =>
                    cn(
                      'font-display text-display-l px-24 py-12',
                      isActive ? 'text-gradient-signature' : 'text-ink',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ delay: 0.06 * LINKS.length, duration: 0.25 }}
              className="mt-16"
            >
              <ButtonPrimary to="/app">{t('common.nav.openApp')}</ButtonPrimary>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ delay: 0.06 * (LINKS.length + 1), duration: 0.25 }}
            >
              <LanguageSwitch />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
