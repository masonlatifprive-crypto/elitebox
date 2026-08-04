import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Grid, Play, ChevronRight, Filter, Loader2, AlertCircle, PlusCircle, ExternalLink, Info } from 'lucide-react';
import { addonEngine } from '../../lib/addons/engine';
import { AddonCatalog, MetaItem } from '../../lib/types';
import { useNavigate } from 'react-router-dom';

const Collections: React.FC = () => {
  const [catalogs, setCatalogs] = useState<{addonId: string, catalog: AddonCatalog}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

    loadCatalogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black/95 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin opacity-50" />
          <p className="text-gray-400 font-medium animate-pulse">Initializing Catalogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Media Collections
            </h1>
            <p className="text-gray-400 mt-2">Browse legal community-provided metadata</p>
          </div>
          <button 
            onClick={() => navigate('/app/addons')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            Add Sources
          </button>
        </div>

        {catalogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex flex-col items-center p-12 bg-black border border-white/10 rounded-2xl max-w-md text-center space-y-6">
                <div className="p-4 bg-blue-500/10 rounded-full">
                  <Grid className="w-12 h-12 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">No Catalogs Found</h3>
                  <p className="text-gray-400 leading-relaxed">
                    EliteBoxMovies is a clean shell. To browse content, please install a legal metadata addon from our store.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => navigate('/app/addons')}
                    className="w-full py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    Browse Addon Store
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg text-xs text-gray-500 text-left">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Cinemeta is recommended for official movie/TV metadata.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogs.map((cat, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(`/app/catalog/${cat.addonId}/${cat.catalog.type}/${cat.catalog.id}`)}
                className="group relative cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-semibold capitalize">{cat.catalog.name || cat.catalog.type}</h4>
                      <p className="text-sm text-gray-500 mt-1">Source ID: {cat.addonId}</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-wider rounded border border-blue-500/20">
                      {cat.catalog.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
