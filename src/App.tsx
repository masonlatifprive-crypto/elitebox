import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/marketing/FAQ';
import Collections from './pages/app/Collections';
import Detail from './pages/app/Detail';
import { MarketingShell, AppShell } from './components/Layout';

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#050505] text-white">Loading...</div>}>
        <Routes>
          {/* Marketing Routes */}
          <Route element={<MarketingShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/faq" element={<FAQ />} />
          </Route>

          {/* App Routes */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="/app/collections" replace />} />
            <Route path="collections" element={<Collections />} />
            <Route path="movie/:id" element={<Detail />} />
            <Route path="tv/:id" element={<Detail />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
