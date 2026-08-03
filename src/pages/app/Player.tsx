/**
 * Player — /app/player/:type/:id (player.md). Wrapped in SubscriptionGate,
 * except the built-in CC-BY showcase ("open cinema — free & legal"), which
 * plays for everyone without a subscription.
 *
 * The cinematic playback surface: HTML5 video (+ hls.js for .m3u8), glass
 * auto-hiding chrome, resume + per-title memory (speed / tracks / subtitle
 * offset via usePlaybackMemory), WebVTT subtitles with style controls,
 * skip-intro markers, next-episode countdown, touch double-tap seeking,
 * full keyboard map and the signature unified error recovery (auto-retry
 * once after 4s, then Try next source / Lower quality / Retry).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type Hls from 'hls.js';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  AudioLines,
  Cast,
  Check,
  ChevronLeft,
  CircleHelp,
  ClosedCaption,
  Gauge,
  ListVideo,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RefreshCw,
  RotateCw,
