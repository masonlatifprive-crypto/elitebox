import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { TreeLoader } from '@/components/LivingTree'
import { ToastHost } from '@/components/ui-elite'

// Lazy load components with fallback for default/named exports
const AppShell = lazy(() => import('@/components/layout/AppShell').then(m => ({ default: m.default || m.AppShell })));

// Marketing Pages
const Home = lazy(() => import('@/pages/marketing/Home').then(m => ({ default: m.default || m.Home })));
const Sports = lazy(() => import('@/pages/marketing/Sports').then(m => ({ default: m.default || m.Sports })));
const Store = lazy(() => import('@/pages/marketing/Store').then(m => ({ default: m.default || m.Store })));
const Support = lazy(() => import('@/pages/marketing/Support').then(m => ({ default: m.default || m.Support })));
const FAQ = lazy(() => import('@/pages/marketing/FAQ').then(m => ({ default: m.default || m.FAQ })));
const Downloads = lazy(() => import('@/pages/marketing/Downloads').then(m => ({ default: m.default || m.Downloads })));

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then(m => ({ default: m.default || m.Login })));
const Register = lazy(() => import('@/pages/auth/Register').then(m => ({ default: m.default || m.Register })));
const Subscribe = lazy(() => import('@/pages/auth/Subscribe').then(m => ({ default: m.default || m.Subscribe })));

// App Pages
const AppHome = lazy(() => import('@/pages/app/AppHome').then(m => ({ default: m.default || m.AppHome })));
const Discover = lazy(() => import('@/pages/app/Discover').then(m => ({ default: m.default || m.Discover })));
const Collections = lazy(() => import('@/pages/app/Collections').then(m => ({ default: m.default || m.Collections })));
const Detail = lazy(() => import('@/pages/app/Detail').then(m => ({ default: m.default || m.Detail })));
const Player = lazy(() => import('@/pages/app/Player').then(m => ({ default: m.default || m.Player })));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.default || m.NotFoundPage })));

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <Suspense fallback={<TreeLoader />}>
        <Routes>
          {/* Marketing Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/store" element={<Store />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/downloads" element={<Downloads />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/subscribe" element={<Subscribe />} />

          {/* App Routes */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="discover" element={<Discover />} />
            <Route path="collections" element={<Collections />} />
            <Route path="view/:id" element={<Detail />} />
            <Route path="play/:id" element={<Player />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
