import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
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

const Detail = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Recreating recovery logic for data fetching
    setLoading(true);
    setTimeout(() => {
      setData({ title: 'EliteBox Recovery Movie', type, id });
      setLoading(false);
    }, 1000);
  }, [type, id]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-4xl font-bold mb-4">{data?.title || 'Loading...'}</h1>
        <div className="flex gap-4 mb-8">
          <button className="bg-white text-black px-6 py-2 rounded flex items-center gap-2">
            <Play fill="black" /> Play
          </button>
          <button className="bg-gray-800 px-6 py-2 rounded flex items-center gap-2">
            <Plus /> My List
          </button>
        </div>
        <p className="text-gray-400">Type: {type} | ID: {id}</p>
      </motion.div>
    </div>
  );
};

export default Detail;
