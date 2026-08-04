import React, { useState, useEffect } from 'react';
import { addonEngine } from '../../lib/addons/engine';
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
