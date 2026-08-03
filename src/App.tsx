/**
 * Elitebox router. Lazy route-level code splitting; two nested-route shells:
 * MarketingShell (/ /sports /store /support /login /register /subscribe) and
 * AppShell (/app/*). All routes wired to real pages.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
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
