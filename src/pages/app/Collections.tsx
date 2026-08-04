import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Grid, Play, ChevronRight, Filter, Loader2, AlertCircle, PlusCircle, ExternalLink, Info } from 'lucide-react';
import addonEngine from '../../lib/addons/engine';
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Collections
          </h1>
          <p className="text-muted-foreground mt-1">Explore catalogs from your installed addons</p>
        </div>
        <button 
          onClick={() => navigate('/app/addons')}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all border border-primary/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add More</span>
        </button>
      </div>

      {catalogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50" />
            <div className="relative w-20 h-20 bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
              <Grid className="w-10 h-10 text-primary/60" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-3">No Catalogs Found</h2>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
            Install addons to discover movies, TV shows, and more. We recommend starting with Cinemeta for official metadata.
          </p>
          
          <div className="grid gap-4 w-full max-w-lg">
            <button 
              onClick={() => navigate('/app/addons')}
              className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Browse Addon Store</div>
                  <div className="text-sm text-muted-foreground">Find official legal metadata sources</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </button>

            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <p>EliteBoxMovies is a legal media browser. We do not provide content directly.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-8">
          {catalogs.map(({ addonId, catalog }) => (
            <section key={`${addonId}-${catalog.id}`} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {catalog.name}
                  <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                    {addonId}
                  </span>
                </h2>
                <button className="text-sm text-primary hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="aspect-[2/3] bg-card/50 rounded-lg animate-pulse border border-white/5"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;
