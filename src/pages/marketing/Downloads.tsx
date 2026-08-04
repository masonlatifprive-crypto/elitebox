/**
 * /downloads — the full platform matrix, stremio-grade, with Premium-gated
 * native builds.
 *
 * Honesty model (do-not-do rules 6/19):
 *  • Web/PWA is live — direct launch.
 *  • Native variants read the companion server's /api/builds manifest when
 *    the API is linked (VITE_API_URL): real size, sha256, staged status.
 *  • Bytes only ever leave the server for an active Premium subscription
 *    via short-lived signed URLs — this page renders that gate faithfully:
 *    locked → subscribe CTA, unstaged → "being packaged", no invented files.
 *  • Local mode (no API linked) shows the same matrix with the gate logic
 *    intact and an honest note that the build service isn't linked here.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Crown,
  Download,
  FileLock2,
  Globe,
  Loader2,
  Lock,
  Monitor,
  Package,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  Tv,
} from 'lucide-react';
import { API_URL, authToken, useAuth } from '@/lib/auth';
import { ButtonGhost, ButtonPrimary, Eyebrow, GlassPanel, toast } from '@/components/ui-elite';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
