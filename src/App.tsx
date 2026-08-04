import React, { Suspense, lazy } from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MarketingShell from './components/layout/MarketingShell';

import AppShell from './components/layout/AppShell';

import LandingPage from './pages/LandingPage';

import FAQPage from './pages/FAQPage';

import LoadingScreen from './components/ui/LoadingScreen';



const CollectionsPage = lazy(() => import('./pages/app/CollectionsPage'));

const MovieDetailsPage = lazy(() => import('./pages/app/MovieDetailsPage'));



function App() {
  
  return (
    
    <Router>
    
      <Routes>
      
        {/* Marketing Routes */}
      
        <Route path=\"/\" element={<MarketingShell />}>
        
          <Route index element={<LandingPage />} />
        
          <Route path=\"faq\" element={<FAQPage />} />
        
        </Route>Route>
      

      
        {/* App Routes */}
      
        <Route path=\"/app\" element={<AppShell />}>
        
          <Route index element={<Navigate to=\"/app/collections\" replace />} />
        
          <Route
            
            path=\"collections\"
        
            element={
              
              <Suspense fallback={<LoadingScreen />}>
              
                <CollectionsPage />
              
              </Suspense>Suspense>
          
            }
          
          />
          
          <Route
            
            path=\"movie/:id\"
          
            element={
              
              <Suspense fallback={<LoadingScreen />}>
              
                <MovieDetailsPage />
              
              </Suspense>Suspense>
          
            }
          
          />
          
          </Route>Route>
          

          
            {/* Fallback */}
          
        <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
          
          </Route>Routes>
        
        </Route>Router>
      
  );
      
        }
      

      
export default App;</Router>

