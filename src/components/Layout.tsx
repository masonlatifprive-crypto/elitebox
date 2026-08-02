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
import MagnetDrop from '@/components/MagnetDrop';
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
    <div className="grain-overlay relative min-h-[100dvh] overflow-x-hidden">
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
    <div className="grain-overlay relative min-h-[100dvh] overflow-x-hidden">
      <AmbienceCanvas />
      <AppRail />
      <main className="tv-safe relative z-10 min-h-[100dvh] w-full max-w-full overflow-x-hidden px-16 pb-104 pt-32 md:pl-[112px] md:pr-28 md:pb-56 xl:pl-[136px] xl:pr-48">
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
      {/* Global .torrent drop zone + shared magnet result sheet (every /app route) */}
      <MagnetDrop />
    </div>
  );
}

export default MarketingShell;
