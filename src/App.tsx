import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/marketing/FAQ';
import Downloads from './pages/marketing/Downloads';
import Collections from './pages/app/Collections';
import Detail from './pages/app/Detail';
import { MarketingShell, AppShell } from './components/Layout';


// Lazy load app pages to ensure they exist or show loading
const Search = lazy(() => import('./pages/app/Search'));
const Addons = lazy(() => import('./pages/app/Addons'));
const Library = lazy(() => import('./pages/app/LibraryPage'));
const Settings = lazy(() => import('./pages/app/Settings'));


const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#050505] text-white">Loading...</div>}>
        <Routes>
          {/* Marketing Routes */}
          <Route element={<MarketingShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/downloads" element={<Downloads />} />
          </Route>


          {/* App Routes */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="/app/collections" replace />} />
            <Route path="collections" element={<Collections />} />
            <Route path="search" element={<Search />} />
            <Route path="addons" element={<Addons />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<Settings />} />
            <Route path="movie/:id" element={<Detail />} />
