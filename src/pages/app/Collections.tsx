import React, { useState, useEffect } from 'react';
import addonEngine from '../../lib/addons/engine';
import { AddonCatalog } from '../../lib/types';
import { useNavigate } from 'react-router-dom';

const Collections: React.FC = () => {
  const [catalogs, setCatalogs] = useState<{addonId: string, catalog: AddonCatalog}[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
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
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading catalogs...</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-[#0a0a0a] text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-gray-400">Browse content from your installed addons.</p>
      </header>

      {catalogs.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xl text-gray-400 mb-4">No catalogs found</p>
          <button 
            onClick={() => navigate('/app/addons')}
            className="px-6 py-2 bg-primary rounded-full hover:bg-primary/80 transition-colors"
          >
            Install Addons
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {catalogs.map((cat, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl font-semibold px-2">{cat.catalog.name || cat.catalog.id}</h2>
              <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide px-2">
                {/* Placeholder for items - in a real app, you would fetch items for this specific catalog */}
                <div className="flex-none w-48 h-72 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                  <span className="text-gray-500 text-sm">Loading {cat.catalog.name}...</span>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;
