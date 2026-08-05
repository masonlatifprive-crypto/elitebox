/**
 * Layout (design.md §10): Root structural wrapper with ambient fade masks,
 * global navigation rail (AppRail), and responsive content area.
 */

import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppRail from './AppRail';
import MarketingNav from './MarketingNav';
import Footer from './Footer';
import AmbienceCanvas from './AmbienceCanvas';
import { useT } from '../i18n';

export const MarketingShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <MarketingNav />
      <main className="flex-1 relative overflow-hidden">
        <AmbienceCanvas />
        <Suspense fallback={<div className="h-screen w-full bg-black" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export const AppShell: React.FC = () => {
  const { t } = useT();

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      <AppRail />
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <AmbienceCanvas />
        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
    </div>
  );
};
