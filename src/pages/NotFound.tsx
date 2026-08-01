/**
 * Branded 404 (not-found.md) — catches every unmatched route, marketing and
 * app. Bare shell: its own AmbienceCanvas, no nav/rail. Rendered as a fixed
 * full-viewport stage so it covers whichever shell it was routed through.
 * Back is context-aware (history back, else `/` or `/app` by path prefix).
 */
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import AmbienceCanvas from '@/components/AmbienceCanvas';
import { LogoMark } from '@/components/Logo';
import { ButtonGhost, ButtonNeon, ButtonPrimary, spring } from '@/components/ui-elite';
import { useT } from '@/i18n';

const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function NotFound() {
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(location.pathname.startsWith('/app') ? '/app' : '/');
    }
  }, [navigate, location.pathname]);

  // Esc / Backspace triggers back (consistent with app navigation).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack]);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-deep">
      <AmbienceCanvas />
      <div className="nebula-wash pointer-events-none fixed inset-0" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center gap-24 px-16 py-64 text-center">
        <LogoMark height={48} glow />

        {/* the drifted poster */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: OUT_EXPO }}
          className={reduceMotion ? '' : 'animate-float-slow'}
        >
          <div
            className="glass-3 w-96 overflow-hidden rounded-lg shadow-aura-purple md:w-128"
            style={{ rotate: '6deg', filter: reduceMotion ? undefined : 'blur(1px)' }}
          >
            <img
              src="/art/poster-cosmos-laundromat.jpg"
              alt={t('marketing.notFound.posterAlt')}
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
        </motion.div>

        {/* 404 — the 0 is a slowly rotating cyan ring */}
        {reduceMotion ? (
          <p className="font-display text-[3rem] md:text-display-2xl text-chrome">404</p>
        ) : (
          <motion.p
            className="font-display flex items-center text-[3rem] md:text-display-2xl"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            aria-label="404"
          >
            <motion.span
              aria-hidden
              className="text-chrome inline-block"
              variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: spring.cinematic } }}
            >
              4
            </motion.span>
            <motion.span
              aria-hidden
              className="mx-[0.06em] inline-block h-[0.72em] w-[0.72em] self-center"
              variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: spring.cinematic } }}
            >
              <span
                className="block h-full w-full rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, var(--cyan), rgba(124,217,236,.12) 40%, var(--cyan))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent 58%, #000 62%)',
                  mask: 'radial-gradient(farthest-side, transparent 58%, #000 62%)',
                  animation: 'notfound-ring-spin 8s linear infinite',
                }}
              />
            </motion.span>
            <motion.span
              aria-hidden
              className="text-chrome inline-block"
              variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: spring.cinematic } }}
            >
              4
            </motion.span>
          </motion.p>
        )}
        <style>{`@keyframes notfound-ring-spin { to { transform: rotate(360deg); } }`}</style>

        <motion.h1
          className="font-display text-display-l text-ink"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45, ease: OUT_EXPO }}
        >
          {t('marketing.notFound.title')}
        </motion.h1>
        <motion.p
          className="max-w-md text-caption text-muted"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: OUT_EXPO }}
        >
          {t('marketing.notFound.copy')}
        </motion.p>

        {/* actions */}
        <motion.nav
          className="flex w-full max-w-md flex-col items-center gap-12 sm:flex-row sm:justify-center"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.55 } } }}
        >
          <motion.span
            className="max-sm:w-full"
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: spring.snappy } }}
          >
            <ButtonPrimary onClick={goBack} className="max-sm:w-full">
              {t('marketing.notFound.back')}
            </ButtonPrimary>
          </motion.span>
          <motion.span
            className="max-sm:w-full"
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: spring.snappy } }}
          >
            <ButtonNeon to="/app/discover" className="max-sm:w-full">
              {t('marketing.notFound.discover')}
            </ButtonNeon>
          </motion.span>
          <motion.span
            className="max-sm:w-full"
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: spring.snappy } }}
          >
            <ButtonGhost to="/" className="max-sm:w-full">
              {t('marketing.notFound.home')}
            </ButtonGhost>
          </motion.span>
        </motion.nav>

        {/* attempted path — helps bug reports */}
        <motion.p
          className="break-all font-mono text-micro text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.45 }}
        >
          {location.pathname}
        </motion.p>
      </div>
    </div>
  );
}
