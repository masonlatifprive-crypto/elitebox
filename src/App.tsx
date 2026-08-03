import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MarketingShell from './components/layout/MarketingShell';
import AppShell from './components/layout/AppShell';
import TreeLoader from './components/ui/TreeLoader';
import { ToastHost } from './components/ui/Toast';

// Marketing Pages
const Home = lazy(() => import('./pages/Home'));
const Sports = lazy(() => import('./pages/marketing/Sports'));
const Store = lazy(() => import('./pages/marketing/Store'));
const Support = lazy(() => import('./pages/marketing/Support'));
const FAQ = lazy(() => import('./pages/marketing/FAQ'));
const Downloads = lazy(() => import('./pages/marketing/Downloads'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Subscribe = lazy(() => import('./pages/auth/Subscribe'));

// App Pages
const AppHome = lazy(() => import('./pages/app/AppHome'));
const Discover = lazy(() => import('./pages/app/Discover'));
const Collections = lazy(() => import('./pages/app/Collections'));
const Detail = lazy(() => import('./pages/app/Detail'));
const Player = lazy(() => import('./pages/app/Player'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <Suspense fallback={<TreeLoader />}>
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
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="discover" element={<Discover />} />
            <Route path="collections" element={<Collections />} />
            <Route path="watch/:id" element={<Detail />} />
            <Route path="player/:id" element={<Player />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
