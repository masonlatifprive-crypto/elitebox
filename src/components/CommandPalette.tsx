/**
 * CommandPalette — global Ctrl/Cmd+K launcher (mounted once per shell).
 *
 * Three groups: "Go to" (routes for the current shell), "Catalog" (showcase
 * titles → their Detail page) and "Actions" (Subscribe, TV mode, install an
 * addon). Arrow keys move, Enter executes, hover selects, Esc/backdrop close.
 * role="dialog" + aria-modal, autofocus input, Tab cycles within the panel.
 * Open from anywhere with openCommandPalette() (rail/nav buttons use it).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Clapperboard,
  Compass,
  CreditCard,
  Film,
  Home,
  LibraryBig,
  LifeBuoy,
  MonitorPlay,
  Play,
  Puzzle,
  Radio,
  Search,
  Settings,
  Store,
  Tv,
  User,
} from 'lucide-react';
import { SHOWCASE_CATALOG } from '@/data/showcase';
import { toggleTVMode } from '@/lib/tvnav';
import { toast } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
