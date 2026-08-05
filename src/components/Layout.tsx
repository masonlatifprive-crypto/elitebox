/**

 * Layout (design.md §10): Root structural wrapper with ambient fade masks,

 * global navigation rail (AppRail), and responsive content area.

 */



import React, { Suspense } from 'react';

import { Outlet } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

import AppRail from './AppRail';

import MarketingNav from './MarketingNav';

import Footer from './Footer';

import AmbienceCanvas from './AmbienceCanvas';

import { useT } from '../i18n';



export const MarketingShell: React.FC = () => {
  
  return (
    
    <div className=\"min-h-screen bg-[#050505] text-white flex flex-col\">
    
      <MarketingNav />
    
      <main className=\"flex-grow relative\">
      
        <AmbienceCanvas />
      
        <Outlet />
      
      </main>main>
    
      <Footer />
    
    </div>div>
    
  );
  
};



export const AppShell: React.FC = () => {
  
  const { t } = useT();
  

  
  return (
    
    <div className=\"flex h-screen bg-[#050505] text-white overflow-hidden\">
    
      <AppRail />
    
      
    
      <main className=\"flex-1 relative flex flex-col min-w-0\">
      
        <AmbienceCanvas opacity={0.4} />
      
        
      
        <div className=\"flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar\">
        
          <div className=\"container mx-auto px-4 py-8 pb-24 md:pb-8\">
          
            <Suspense fallback={
              
              <div className=\"flex items-center justify-center h-64\">
              
                <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-primary\"></div>div>
              
              </div>div>
            
              }>
            
              <Outlet />
            
            </Suspense>Suspense>
          
          </div>div>
        
        </div>div>
      

      
        <div className=\"absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none\" />
      
      </main>main>
    
    </div>div>
    
  );
  
};</div>

