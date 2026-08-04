import React, { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  Grid, 
  Play, 
  ChevronRight, 
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
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
        console.error('Failed to load catalogs', err);
        setError('Failed to load available catalogs');
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const handleCatalogClick = (addonId: string, type: string, id: string) => {
    navigate(`/app/catalog/${addonId}/${type}/${id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading catalogs...</p>
      </div>
    );
  }

  if (error || catalogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold">{error || 'No Catalogs Found'}</h2>
        <p className="text-muted-foreground max-w-md">
          {error ? 'Try checking your connection or re-installing addons.' : 'Install metadata addons in the Addons section to browse catalogs.'}
        </p>
        <button 
          onClick={() => navigate('/app/addons')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:brightness-110 transition-all"
        >
          Manage Addons
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-end justify-between px-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">COLLECTIONS</h1>
          <p className="text-muted-foreground">Explore curated content from your installed addons</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
            <Filter className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {catalogs.map((item, idx) => (
          <div 
            key={`${item.addonId}-${item.catalog.id}-${idx}`}
            onClick={() => handleCatalogClick(item.addonId, item.catalog.type, item.catalog.id)}
            className="group relative overflow-hidden rounded-2xl bg-secondary/20 border border-white/5 hover:border-primary/50 transition-all cursor-pointer aspect-[16/9]"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            
            <div className="absolute inset-0 scale-105 group-hover:scale-100 transition-transform duration-700 opacity-60">
              <div className="w-full h-full bg-secondary/40 flex items-center justify-center">
                <Play className="w-12 h-12 text-white/20" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary px-2 py-0.5 rounded bg-primary/10">
                  {item.catalog.type}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                  {item.addonId}
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {item.catalog.name}
              </h3>
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white/60">Browse collection</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collections;
