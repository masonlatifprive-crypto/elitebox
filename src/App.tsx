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
const Collections = lazy(() => import('@/pages/app/Collections'));
const Detail = lazy(() => import('@/pages/app/Detail'));
const Player = lazy(() => import('@/pages/app/Player'));

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

          <Route path="app" element={<AppShell />}>
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
