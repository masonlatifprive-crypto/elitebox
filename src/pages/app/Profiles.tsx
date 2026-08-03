/**
 * Profiles — `/app/profiles` (profiles.md).
 * "Who's watching?" gate + manage mode in one page:
 *  - Gate: orb tiles (hover/focus glow + scale), PIN pad modal for locked
 *    profiles (shake on wrong, dots sweep on right), add-profile tile (max 6).
 *  - Manage: rename inline, change avatar (orb grid modal), set/change/remove
 *    PIN, delete with type-name confirm (last profile cannot be deleted).
 * PINs are stored as a simple local hash — honest on-device security.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Check,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
import { scopedKey, switchProfile, useProfiles } from '@/lib/store';
import type { Profile } from '@/lib/store';
import { LogoMark } from '@/components/Logo';
import {
  ButtonDanger,
  ButtonGhost,
  ButtonNeon,
  EmptyState,
