/**
 * Detail — /app/detail/:type/:id (detail.md).
 *
 * The orbital title page: parallax backdrop hero with poster, meta row,
 * synopsis, episodes rail (series) and the signature stream-sources panel —
 * addonEngine.getStreams() grouped by addon with live health dots, mono
 * latency, quality badges and real circuit-breaker state (BENCHED countdown
 * + Recover wired to addonEngine.recover).
 *
 * Play gating: without access (useAuth().hasAccess()) every play action
 * opens a PaywallCard modal instead of navigating; otherwise it routes to
 * /app/player/:type/:id?src=<index>.
 */
const OPEN_CINEMA_IDS: string[] = [];
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
  Star,
} from 'lucide-react';
import { addonEngine } from '@/lib/addons/engine';
