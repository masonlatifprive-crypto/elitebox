/**


 * Library — `/app/library` (design library.md).
 * Tabs: Continue Watching / Watchlist / Favorites / History — all real data
 * from the profile-scoped `useLibrary` store. Stats strip (titles saved,
 * hours tracked, day streak), remove actions with toasts, honest empty
 * states with real CTAs.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  Clock,
  Flame,
  Heart,
  History as HistoryIcon,
  LibraryBig,
  Play,
  PlayCircle,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import PosterCard from '@/components/PosterCard';
import { ButtonNeon, EmptyState, spring, toast } from '@/components/ui-elite';
import { DEFAULT_PROFILE_ID, useLibrary, useProfiles } from '@/lib/store';
// Removed showcase import
import { useCatalogItems } from '@/pages/app/Discover';
import { addonEngine } from '@/lib/addons/engine';
import { getAnimeCatalog, getCuratedGlobalTitles, getKnownTitleAliases, getUpcomingTitles } from '@/lib/globalCatalog';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
import { cn } from '@/lib/utils';
import type { MetaItem } from '@/lib/types';
