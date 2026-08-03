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
