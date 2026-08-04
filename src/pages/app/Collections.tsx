import React, { useState, useEffect } from 'react';
import { addonEngine } from '../../lib/addons/engine';
import { AddonCatalog } from '../../lib/addons/types';
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
        for (const addon of addons) {
          if (addon.manifest.catalogs) {
            addon.manifest.catalogs.forEach(cat => {
              allCatalogs.push({ addonId: addon.manifest.id, catalog: cat });
            });
          }
        }
        setCatalogs(allCatalogs);
      } catch (err) {
        console.error('Failed to load catalogs', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Discover</h1>
        <p className="text-gray-400">Explore real content from your installed addons.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : catalogs.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
          <h3 className="text-xl font-semibold mb-4">No Catalogs Found</h3>
          <p className="text-gray-400 mb-8">Install addons to start browsing movies and series.</p>
          <button 
            onClick={() => navigate('/app/addons')} 
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Browse Addons
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {catalogs.map((item, idx) => (
            <section key={idx} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold capitalize">{item.catalog.name || item.catalog.id}</h2>
                <span className="text-xs font-medium px-2 py-1 bg-gray-800 rounded uppercase tracking-wider text-gray-400">
                  {item.addonId}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                <div className="aspect-[2/3] bg-[#1a1a1a] rounded-lg animate-pulse flex items-center justify-center text-gray-600">
                  Loading...
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
