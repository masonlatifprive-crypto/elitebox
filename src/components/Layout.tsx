/**
 * Shell layouts (nested-route pattern — every Layout renders <Outlet/>).
 *
 * MarketingShell: AmbienceCanvas + MarketingNav + Footer + Lenis smooth
 * scroll (lerp 0.09, GSAP ScrollTrigger sync) for / /sports /store /support
 * /login /register /subscribe. The nav is a fixed overlay by design
 * (full-bleed heroes), so no content offset is applied here.
 *
 * AppShell: AmbienceCanvas + AppRail + spatial TV navigation for /app/*.
 * Content clears the 72px rail on desktop and the bottom nav on mobile.
 */
import { useEffect } from 'react';
import { Outlet } from 'react-router';
import AmbienceCanvas from '@/components/AmbienceCanvas';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import StorageBanner from '@/components/StorageBanner';
import AppRail from '@/components/AppRail';
import CommandPalette from '@/components/CommandPalette';
import { useSpatialNav } from '@/lib/tvnav';

export function MarketingShell() {
  // Lenis smooth scroll (lerp 0.09) synced to GSAP ScrollTrigger, code-split
  // out of the eager chunk (design.md §8/§14).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      const [{ default: Lenis }, { ScrollTrigger }, { default: gsap }] = await Promise.all([
        import('lenis'),
        import('gsap/ScrollTrigger'),
        import('gsap'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.09 });
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className="grain-overlay relative min-h-[100dvh]">
      <AmbienceCanvas />
      <MarketingNav />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Footer />
      <StorageBanner />
      <CommandPalette />
    </div>
  );
}

export function AppShell() {
  useSpatialNav();
  return (
    <div className="grain-overlay relative min-h-[100dvh]">
      <AmbienceCanvas />
      <AppRail />
      <main className="tv-safe relative z-10 min-h-[100dvh] px-16 pb-96 pt-24 md:pl-[96px] md:pr-24 md:pb-48 xl:px-48 xl:pl-[120px]">
        <div className="mx-auto max-w-[1600px]">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}

export default MarketingShell;
