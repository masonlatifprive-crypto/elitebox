/**
 * Layout (design.md §10): The core app shell.
 * Includes the AppRail (left sidebar), the main scrollable content area,
 * and the global CommandPalette/TrailerModal/Player layers.
 */
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppRail from '@/components/AppRail';
import CommandPalette from '@/components/CommandPalette';
import TrailerModal from '@/components/TrailerModal';
import AmbienceCanvas from '@/components/AmbienceCanvas';
import { useSpatialNav } from '@/lib/tvnav';
import { cn } from '@/lib/utils';


export default function Layout() {
  const location = useLocation();
  const [isCPOpen, setIsCPOpen] = useState(false);
  
  // Initialize TV spatial navigation logic
  useSpatialNav();


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCPOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black text-white selection:bg-neon-blue/30">
      {/* Background Ambience (design.md §3.1) */}

export default Layout;
