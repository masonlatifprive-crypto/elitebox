import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { TreeLoader } from '@/components/LivingTree'
import { ToastHost } from '@/components/ui-elite'

// Lazy load components from Layout.tsx
const LayoutModule = import('@/components/Layout')
const AppShell = lazy(() => LayoutModule.then(m => ({ default: m.AppShell || m.default })))
const MarketingShell = lazy(() => LayoutModule.then(m => ({ default: m.MarketingShell || m.default })))

// Marketing Pages
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.default || m.Home })))
const Sports = lazy(() => import('@/pages/marketing/Sports').then(m => ({ default: m.default || m.Sports })))
const Store = lazy(() => import('@/pages/marketing/Store').then(m => ({ default: m.default || m.Store })))
const Support = lazy(() => import('@/pages/marketing/Support').then(m => ({ default: m.default || m.Support })))
const FAQ = lazy(() => import('@/pages/marketing/FAQ').then(m => ({ default: m.default || m.FAQ })))
const Downloads = lazy(() => import('@/pages/marketing/Downloads').then(m => ({ default: m.default || m.Downloads })))

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then(m => ({ default: m.default || m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then(m => ({ default: m.default || m.Register })))
const Subscribe = lazy(() => import('@/pages/auth/Subscribe').then(m => ({ default: m.default || m.Subscribe })))

// App Pages
const AppHome = lazy(() => import('@/pages/app/AppHome').then(m => ({ default: m.default || m.AppHome })))
const Discover = lazy(() => import('@/pages/app/Discover').then(m => ({ default: m.default || m.Discover })))
const Collections = lazy(() => import('@/pages/app/Collections').then(m => ({ default: m.default || m.Collections })))
const Detail = lazy(() => import('@/pages/app/Detail').then(m => ({ default: m.default || m.Detail })))
const Player = lazy(() => import('@/pages/app/Player').then(m => ({ default: m.default || m.Player })))
const NotFoundPage = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.default || m.NotFoundPage })))

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

          {/* Protected App Routes */}
          <Route element={<AppShell />}>
            <Route path="/app" element={<AppHome />} />
            <Route path="/app/discover" element={<Discover />} />
            <Route path="/app/collections" element={<Collections />} />
            <Route path="/app/movie/:id" element={<Detail />} />
            <Route path="/app/tv/:id" element={<Detail />} />
          </Route>

          {/* Player (Full Screen) */}
          <Route path="/app/player/:id" element={<Player />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
