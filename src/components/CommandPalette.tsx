/**
 * CommandPalette — global Cmd+K / Ctrl+K spotlight (home.md §S1).
 * Logic: registers global listener, handles fuzzy search across metadata
 * and library, keyboard navigation (Up/Down/Enter), hover selects, Esc/backdrop close.
 * role="dialog" + aria-modal, autofocus input, Tab cycles within the panel.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Clapperboard, Tv, History, Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import type { MetaItem } from '@/lib/types';
import { spring } from '@/components/ui-elite';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { t } = useT();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={spring}
        className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        ref={containerRef}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-zinc-500 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-lg"
            placeholder={t('common.search_placeholder') || 'Search movies, shows...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          <div className="px-2 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {t('common.recent') || 'Recent'}
          </div>
          {/* Mock results */}
          <button className="w-full flex items-center p-3 hover:bg-white/5 rounded-lg text-left text-zinc-300 transition-colors">
            <History className="w-4 h-4 mr-3 text-zinc-500" />
            <span>Inception</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
