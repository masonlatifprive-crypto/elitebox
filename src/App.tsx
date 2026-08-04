import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MarketingShell, AppShell } from './components/Layout';
import Home from './pages/Home';
import FAQ from './pages/marketing/FAQ';
import LoadingScreen from './components/ui/LoadingScreen';

const CollectionsPage = lazy(() => import('./pages/app/CollectionsPage'));
const MovieDetailsPage = lazy(() => import('./pages/app/MovieDetailsPage'));

function App() {
  return (
    <Router>
      <Routes>
        {/* Marketing Routes */}
        <Route path="/" element={<MarketingShell />}>
          <Route index element={<Home />} />
          <Route path="faq" element={<FAQ />} />
        </Route>

        {/* App Routes */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/collections" replace />} />
          <Route
            path="collections"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <CollectionsPage />
              </Suspense>
            }
          />
          <Route
            path="movie/:id"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <MovieDetailsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
