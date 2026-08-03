import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MarketingShell, AppShell } from './components/Layout';
;
const TreeLoader = () => <div className='flex items-center justify-center h-screen'>Loading...</div>;;
import { Toaster as ToastHost } from './components/ui/sonner';


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
