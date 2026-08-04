import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Play, Info, Plus, ChevronRight, Filter } from 'lucide-react';
import { addonEngine } from '@/lib/addons/engine';
import { useAddons } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addons } = useAddons();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const searchResults = await addonEngine.searchAll(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to fetch results from addons.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) handleSearch(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Search</h1>
          <p className="text-slate-400">Find movies and series across your installed addons</p>
        </div>
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setSearchParams({ q: e.target.value })}
            placeholder="Search titles, actors, or genres..."
            className="pl-10 bg-slate-900/50 border-slate-800 text-white focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded-xl bg-slate-800/50" />
              <Skeleton className="h-4 w-3/4 bg-slate-800/50" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map((item: any) => (
            <Card 
              key={item.id} 
              className="group relative overflow-hidden border-none bg-transparent cursor-pointer transition-transform duration-300 hover:scale-105"
              onClick={() => navigate(`/app/detail/${item.type}/${item.id}`)}
            >
              <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={item.poster || '/placeholder-poster.jpg'}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex gap-2 mb-2">
                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8">
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-full h-8 w-8 bg-black/40 border-white/20">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-2">
                <h3 className="font-medium text-sm text-slate-200 line-clamp-1">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{item.releaseInfo || item.year}</span>
                  <Badge variant="outline" className="text-[10px] h-4 border-slate-800 text-slate-400 capitalize">
                    {item.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <SearchIcon className="h-8 w-8 text-slate-700" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
          <p className="text-slate-500 max-w-xs">
            We couldn't find anything matching "{query}". Try adding more addons in the Addons section.
          </p>
          <Button 
            variant="outline" 
            className="mt-6 border-slate-800 text-slate-300 hover:bg-slate-900"
            onClick={() => navigate('/app/addons')}
          >
            Manage Addons
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6">
            <Filter className="h-10 w-10 text-slate-700 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-300 mb-2">Ready to explore?</h2>
          <p className="text-slate-500">Start typing to search across movies, series, and more.</p>
        </div>
      )}
    </div>
  );
}

