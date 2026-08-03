import { lazy, Suspense, memo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppShell, MarketingShell } from '@/components/Layout';
import { TreeLoader } from '@/components/LivingTree';
import { ToastHost } from '@/components/ui-elite';

// Marketing Pages
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home || m.default })));
const Sports = lazy(() => import('@/pages/marketing/Sports').then(m => ({ default: m.Sports || m.default })));
const Store = lazy(() => import('@/pages/marketing/Store').then(m => ({ default: m.Store || m.default })));
const Support = lazy(() => import('@/pages/marketing/Support').then(m => ({ default: m.Support || m.default })));
const FAQ = lazy(() => import('@/pages/marketing/FAQ').then(m => ({ default: m.FAQ || m.default })));
const Downloads = lazy(() => import('@/pages/marketing/Downloads').then(m => ({ default: m.Downloads || m.default })));

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then(m => ({ default: m.Login || m.default })));
const Register = lazy(() => import('@/pages/auth/Register').then(m => ({ default: m.Register || m.default })));
const Subscribe = lazy(() => import('@/pages/auth/Subscribe').then(m => ({ default: m.Subscribe || m.default })));

// App Pages
const AppHome = lazy(() => import('@/pages/app/AppHome').then(m => ({ default: m.AppHome || m.default })));
const Discover = lazy(() => import('@/pages/app/Discover').then(m => ({ default: m.Discover || m.default })));
const Collections = lazy(() => import('@/pages/app/Collections').then(m => ({ default: m.Collections || m.default })));
const Detail = lazy(() => import('@/pages/app/Detail').then(m => ({ default: m.Detail || m.default })));
const Player = lazy(() => import('@/pages/app/Player').then(m => ({ default: m.Player || m.default })));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFoundPage || m.default })));

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <Suspense fallback={<TreeLoader loader />}>
        <Routes>
          {/* Marketing Routes */}
          <Route element={<MarketingShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/store" element={<Store />} />
            <Route path="/support" element={<Support />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/downloads" element={<Downloads />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/subscribe" element={<Subscribe />} />

          {/* App Routes */}
          <Route element={<AppShell />}>
            <Route path="/app" element={<AppHome />} />
            <Route path="/app/discover" element={<Discover />} />
            <Route path="/app/collections" element={<Collections />} />
            <Route path="/app/movie/:id" element={<Detail />} />
            <Route path="/app/tv/:id" element={<Detail />} />
            <Route path="/app/player/:id" element={<Player />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
