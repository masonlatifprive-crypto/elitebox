**
 * Addons — `/app/addons` (design addons.md).
 * The Addon Manager: install by manifest URL with permission preview,
 * enable/disable, reorder, remove with confirm, and the live Addon Health
 * Monitor (latency, success rate, circuit breaker with BENCHED countdown +
 * Recover). Directory section is honest: the builtin Showcase plus category
 * slots explaining that community addons install via manifest URL.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Clapperboard,
  Flag,
  GripVertical,
  Loader2,
  Puzzle,
  Radio,
  RefreshCw,
  Archive,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Tv,
} from 'lucide-react';
import { addonBlockReason, addonEngine, addonTorrentHint, manifestUrlForTransport } from '../../lib/addons/engine';
import type { OfficialAddonEntry } from '../../lib/addons/engine';
import { useReports } from '../../lib/reports';
import { useAddons } from '../../lib/store';
import type { AddonHealth, AddonInfo } from '../../lib/types';
