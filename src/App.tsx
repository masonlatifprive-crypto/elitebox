import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MarketingShell, AppShell } from './components/Layout';
import { Toaster as ToastHost } from './components/ui/sonner';




// Stub missing components
const TreeLoader = () => <div className='p-4 text-center'>Loading...</div>;




const Landing = lazy(() => import('./pages/Home'));
const Collections = lazy(() => import('./pages/app/Collections'));
const Detail = lazy(() => import('./pages/app/Detail'));
const FAQ = lazy(() => import('./pages/Home'));




function App() {
  return (
    <Router>
      <Suspense fallback={<TreeLoader />}>
        <Routes>
          <Route element={<MarketingShell />}>
            <Route path='/' element={<Landing />} />
            <Route path='/faq' element={<FAQ />} />
          </Route>
          <Route element={<AppShell />}>
            <Route path='/app/collections' element={<Collections />} />
            <Route path='/app/movie/:id' element={<Detail />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastHost />
    </Router>
  );
}

