import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Play, Plus, Share2, Star, Clock, 
  ChevronRight, Calendar, Info, AlertCircle,
  Bookmark, BookmarkCheck, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addonEngine } from '@/lib/addons/engine';
import { useAddons } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const Detail = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { installedAddons } = useAddons();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!type || !id) return;
      setLoading(true);
      try {
        const result = await addonEngine.getMeta(type, id);
        if (result) {
          setMeta(result);
          fetchStreams(type, id);
        } else {
          toast.error('Metadata not found');
        }
      } catch (err) {
        console.error('Failed to fetch meta:', err);
        toast.error('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [type, id, installedAddons]);

  const fetchStreams = async (type: string, id: string) => {
    setLoadingStreams(true);
    try {
      const results = await addonEngine.getStreams(type, id);
      setStreams(results || []);
    } catch (err) {
      console.error('Failed to fetch streams:', err);
    } finally {
      setLoadingStreams(false);
    }
  };

  const handlePlay = (stream: any) => {
    if (!stream) return;
    // Navigate to player with stream info
    navigate('/app/player', { 
      state: { 
        stream,
        meta: {
          title: meta.name,
          type: meta.type,
          poster: meta.poster,
          background: meta.background
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-8 pt-20 animate-pulse">
        <div className="h-96 w-full bg-muted rounded-xl mb-8" />
        <div className="h-12 w-1/3 bg-muted rounded mb-4" />
        <div className="h-6 w-2/3 bg-muted rounded" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background pt-20">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Item not found</h2>
        <Button variant="link" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 w-full h-[70vh] z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
        <img 
          src={meta.background || meta.poster} 
          alt="" 
          className="w-full h-full object-cover opacity-40"
        />
      </div>

      <div className="relative z-20 container mx-auto px-6 pt-32 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12">
          {/* Poster Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:block"
          >
            <img 
              src={meta.poster} 
              alt={meta.name} 
              className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border border-white/10"
            />
          </motion.div>

          {/* Info Column */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 uppercase tracking-wider">
                  {meta.type}
                </Badge>
                {meta.releaseInfo && <span className="text-muted-foreground">{meta.releaseInfo}</span>}
                {meta.runtime && <span className="text-muted-foreground">{meta.runtime}</span>}
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">{meta.name}</h1>
              
              <div className="flex items-center gap-6 mb-8 text-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{meta.imdbRating || 'N/A'}</span>
                </div>
                {meta.genres?.map((g: string) => (
                  <span key={g} className="text-muted-foreground">{g}</span>
                ))}
              </div>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mb-10">
                {meta.description}
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                {streams.length > 0 ? (
                  <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2" onClick={() => handlePlay(streams[0])}>
                    <Play className="w-6 h-6 fill-current" /> Watch Now
                  </Button>
                ) : (
                  <Button size="lg" disabled className="h-14 px-8 text-lg font-bold gap-2 bg-muted">
                    {loadingStreams ? 'Looking for streams...' : 'No Streams Found'}
                  </Button>
                )}
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold gap-2 border-white/10 bg-white/5 hover:bg-white/10">
                  <Plus className="w-6 h-6" /> Add to Library
                </Button>
                <Button size="icon" variant="outline" className="h-14 w-14 border-white/10 bg-white/5">
                  <Share2 className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>

            {/* Streams Section */}
            <AnimatePresence>
              {streams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Play className="w-6 h-6 text-primary" /> Available Streams
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {streams.map((stream, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handlePlay(stream)}
                        className="group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {stream.name || 'Stream #' + (idx + 1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{stream.description || stream.title}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!loadingStreams && streams.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-white/10 bg-white/5 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No streams found for this item. Install more addons to find more sources.</p>
                <Link to="/app/addons">
                  <Button variant="link" className="text-primary">Manage Addons</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
