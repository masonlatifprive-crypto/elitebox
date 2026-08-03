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
import { Outlet } from 'react-router-dom';
import AmbienceCanvas from '@/components/AmbienceCanvas';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import StorageBanner from '@/components/StorageBanner';
import AppRail from '@/components/AppRail';
import CommandPalette from '@/components/CommandPalette';
import MagnetDrop from '@/components/MagnetDrop';
import { useSpatialNav } from '@/lib/tvnav';

export function MarketingShell() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let cleanup = () => {};

    const initLenis = async () => {
      const [Lenis, { ScrollTrigger }, { default: gsap }] = await Promise.all([
        import('lenis'),
        import('gsap/ScrollTrigger'),
        import('gsap')
      ]);

      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis.default({ lerp: 0.09, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        lenis.destroy();
        gsap.ticker.remove(lenis.raf);
      };
    };

    initLenis();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center">
      <AmbienceCanvas />
      <MarketingNav />
      <main className="w-full flex flex-col items-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AppShell() {
  useSpatialNav();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neon-cyan/30">
      <AmbienceCanvas opacity={0.4} />
      <AppRail />
      <CommandPalette />
      <MagnetDrop />
      <div className="lg:pl-[72px] pb-20 lg:pb-0">
        <StorageBanner />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
