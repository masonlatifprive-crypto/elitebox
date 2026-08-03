import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCheck,
  ChevronRight,
  Clapperboard,
  Clock,
  Eye,
  EyeOff,
  Orbit,
  Play,
  Plus,
  RefreshCw,
  Satellite,
  Share2,
  Sparkles,
  Star
} from 'lucide-react';

interface DetailData {
  title: string;
  type: string;
  id: string;
}

const Detail = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailData | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData({
        title: 'EliteBox Recovery Movie',
        type: type || 'movie',
        id: id || '0'
      });
      setLoading(false);
    }, 1000);
  }, [type, id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center">Data not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <motion.div 
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="capitalize">{data.type}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="aspect-[2/3] bg-muted rounded-xl flex items-center justify-center overflow-hidden relative group">
             <Clapperboard size={48} className="text-muted-foreground" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => navigate(`/player/${data.type}/${data.id}`)} className="bg-primary text-primary-foreground p-4 rounded-full">
                   <Play fill="currentColor" />
                </button>
             </div>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-4xl font-bold">{data.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1"><Star className="fill-yellow-500 text-yellow-500" size={16}/> 8.5</div>
              <div className="flex items-center gap-1"><Clock size={16}/> 124 min</div>
              <div className="flex items-center gap-1"><Satellite size={16}/> 4K HDR</div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Experience the best in streaming with EliteBoxMovies. This content is optimized for your device and ready to play.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                <Play size={18} fill="currentColor"/> Watch Now
              </button>
              <button className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                <Plus size={18}/> Watchlist
              </button>
              <button className="bg-secondary text-secondary-foreground p-2 rounded-lg">
                <Share2 size={18}/>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Detail;
