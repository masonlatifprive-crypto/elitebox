import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Grid, Play, ChevronRight, Filter, Loader2, AlertCircle } from 'lucide-react';
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
              allCatalogs.push({ addonId: addon.manifest.id, catalog: cat });
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-muted-foreground">Loading catalogs...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Collections</h1>
          <p className="text-muted-foreground">Explore content from your installed addons</p>
        </div>
      </div>
      <hr className="border-white/10" />
      {catalogs.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white">No Catalogs Found</h3>
          <p className="text-muted-foreground">Install metadata addons to see collections here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogs.map((cat, idx) => (
            <div 
              key={idx}
              onClick={() => navigate(`/app/catalog/${cat.addonId}/${cat.catalog.type}/${cat.catalog.id}`)}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{cat.catalog.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">{cat.catalog.type}</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;
