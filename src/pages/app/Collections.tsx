import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Grid, Play, ChevronRight, Filter, Loader2, AlertCircle, PlusCircle, ExternalLink, Info } from 'lucide-react';
import addonEngine from '../../lib/addons/engine';
import { AddonCatalog, MetaItem } from '../../lib/types';
import { useNavigate } from 'react-router-dom';
\u00A0
const Collections: React.FC = () => {
  const [catalogs, setCatalogs] = useState<{addonId: string, catalog: AddonCatalog}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
\u00A0
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoading(true);
        const addons = addonEngine.getAddons();
        const allCatalogs: {addonId: string, catalog: AddonCatalog}[] = [];
        
        addons.forEach(addon => {
          if (addon.manifest?.catalogs) {
            addon.manifest.catalogs.forEach(cat => {
              allCatalogs.push({
                addonId: addon.manifest.id,
                catalog: cat
              });
            });
          }
        });
        
        setCatalogs(allCatalogs);
      } catch (err) {
        setError('Failed to load catalogs');
      } finally {
        setLoading(false);
      }
    };
\u00A0
    loadCatalogs();
  }, []);
\u00A0
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin opacity-50" />
        <p className="text-zinc-500 animate-pulse">Initializing catalogs...</p>
      </div>
    );
  }
\u00A0
  if (catalogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 md:p-12">
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px]" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <Info className="w-3 h-3" />
                Guided Setup
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  No Catalogs Found
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  EliteBoxMovies uses the Addon Protocol to fetch metadata. To see movies and shows here, you'll need to install a metadata addon like Cinemeta.
                </p>
              </div>
\u00A0
              <div className="flex flex-col sm:row gap-4 pt-4">
                <button 
                  onClick={() => navigate('/app/addons')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                >
                  <PlusCircle className="w-5 h-5" />
                  Browse Addon Store
                </button>
                <a 
                  href="https://web.stremio.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-all border border-zinc-700/50"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                  Learn More
                </a>
              </div>
            </div>
\u00A0
            <div className="w-full md:w-72 grid grid-cols-2 gap-3 opacity-40 grayscale pointer-events-none">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
\u00A0
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Grid, title: 'Centralized', desc: 'Manage all your catalogs in one clean, unified interface.' },
            { icon: SearchIcon, title: 'Discovery', desc: 'Find new content across various legal providers.' },
            { icon: Play, title: 'Seamless', desc: 'One-click playback for your favorite media sources.' }
          ].map((feature, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30">
              <feature.icon className="w-6 h-6 text-blue-500 mb-3" />
              <h3 className="text-white font-medium mb-1">{feature.title}</h3>
              <p className="text-sm text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
\u00A0
  return (
    <div className="space-y-8 pb-12">
      {catalogs.map((item, idx) => (
        <section key={idx} className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-xl font-bold text-white">{item.catalog.name}</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-500 rounded border border-zinc-700">
                {item.catalog.type}
              </span>
            </div>
            <button className="group flex items-center gap-1 text-sm text-zinc-500 hover:text-white transition-colors">
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 no-scrollbar">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-none w-[140px] md:w-[180px] aspect-[2/3] rounded-xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center"
                >
                  <Play className="w-8 h-8 text-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};
\u00A0
export default Collections;
