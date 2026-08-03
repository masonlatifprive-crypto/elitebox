/**
 * Elitebox router. Lazy route-level code splitting; two nested-route shells:
 * MarketingShell (/ /sports /store /support /login /register /subscribe) and
 * AppShell (/app/*). All routes wired to real pages.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastHost } from '@/components/ui-elite';
import { TreeLoader } from '@/components/LivingTree';

const MarketingShell = lazy(() => import('@/components/Layout').then((m) => ({ default: m.MarketingShell })));
const AppShell = lazy(() => import('@/components/Layout').then((m) => ({ default: m.AppShell })));

const Home = lazy(() => import('@/pages/Home'));
const Sports = lazy(() => import('@/pages/marketing/Sports'));
const Store = lazy(() => import('@/pages/marketing/Store'));
const Support = lazy(() => import('@/pages/marketing/Support'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Subscribe = lazy(() => import('@/pages/auth/Subscribe'));
const FAQ = lazy(() => import('@/pages/marketing/FAQ'));
const Downloads = lazy(() => import('@/pages/marketing/Downloads'));

const AppHome = lazy(() => import('@/pages/app/AppHome'));
const Discover = lazy(() => import('@/pages/app/Discover'));
const Catalog = lazy(() => import('@/pages/app/Catalog'));
const Detail = lazy(() => import('@/pages/app/Detail'));
const Player = lazy(() => import('@/pages/app/Player'));
const LibraryPage = lazy(() => import('@/pages/app/LibraryPage'));
const Search = lazy(() => import('@/pages/app/Search'));
const Collections = lazy(() => import('@/pages/app/Collections'));

function RoutedPages() {
  const location = useLocation();
  return (
    <AnimatePresence mode='wait'>
      <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Routes location={location}>
          <Route element={<MarketingShell />}>
            <Route path='/' element={<Home />} />
            <Route path='/faq' element={<FAQ />} />
            <Route path='/downloads' element={<Downloads />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
          <Route path='/app' element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path='discover' element={<Discover />} />
            <Route path='movies' element={<Catalog kind='movie' />} />
            <Route path='series' element={<Catalog kind='series' />} />
            <Route path='collections' element={<Collections />} />
            <Route path='search' element={<Search />} />
            <Route path='library' element={<LibraryPage />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (<BrowserRouter><Suspense fallback={<TreeLoader label='Loading EliteBox' />}><RoutedPages /></Suspense><ToastHost /></BrowserRouter>);
}
