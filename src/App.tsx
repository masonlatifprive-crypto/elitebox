/**
 * Elitebox router. Lazy route-level code splitting; two nested-route shells:
 * MarketingShell (/ /sports /store /support /login /register /subscribe) and
 * AppShell (/app/*). All routes wired to real pages.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ToastHost } from '@/components/ui-elite';
import { TreeLoader } from '@/components/LivingTree';

const MarketingShell = lazy(() => import('@/components/Layout').then((m) => ({ default: m.MarketingShell })));
const AppShell = lazy(() => import('@/components/Layout').then((m) => ({ default: m.AppShell })));

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.default || m.Home })));
const Sports = lazy(() => import('@/pages/marketing/Sports').then((m) => ({ default: m.default || m.Sports })));
const Store = lazy(() => import('@/pages/marketing/Store').then((m) => ({ default: m.default || m.Store })));
const Support = lazy(() => import('@/pages/marketing/Support').then((m) => ({ default: m.default || m.Support })));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.default || m.NotFoundPage })));
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.default || m.Login })));
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.default || m.Register })));
const Subscribe = lazy(() => import('@/pages/auth/Subscribe').then((m) => ({ default: m.default || m.Subscribe })));
const FAQ = lazy(() => import('@/pages/marketing/FAQ').then((m) => ({ default: m.default || m.FAQ })));
const Downloads = lazy(() => import('@/pages/marketing/Downloads').then((m) => ({ default: m.default || m.Downloads })));

const AppHome = lazy(() => import('@/pages/app/AppHome').then((m) => ({ default: m.default || m.AppHome })));
const Discover = lazy(() => import('@/pages/app/Discover').then((m) => ({ default: m.default || m.Discover })));
const Collections = lazy(() => import('@/pages/app/Collections').then((m) => ({ default: m.default || m.Collections })));
const Detail = lazy(() => import('@/pages/app/Detail').then((m) => ({ default: m.default || m.Detail })));
const Player = lazy(() => import('@/pages/app/Player').then((m) => ({ default: m.default || m.Player })));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<TreeLoader />}>
        <Routes>
          <Route path="/" element={<MarketingShell />}>
            <Route index element={<Home />} />
            <Route path="sports" element={<Sports />} />
            <Route path="store" element={<Store />} />
            <Route path="support" element={<Support />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="subscribe" element={<Subscribe />} />
          </Route>

          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="discover" element={<Discover />} />
            <Route path="collections" element={<Collections />} />
            <Route path="detail/:id" element={<Detail />} />
            <Route path="player/:id" element={<Player />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <ToastHost />
    </BrowserRouter>
  );
}
