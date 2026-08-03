/**
 * Marketing navbar (design.md §10.1): fixed glass pill, active cyan underline
 * beam, profile + "Open App" CTA, mobile full-screen glass overlay menu,
 * scroll progress hairline (§8). The Layout owns content offset — the nav
 * itself stays fixed overlay (full-bleed hero design).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, User, X } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import LanguageSwitch from '@/components/LanguageSwitch';
import { openCommandPalette } from '@/components/CommandPalette';
import { ButtonPrimary, spring } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';


const LINKS = [
  { to: '/', label: 'Movies', end: true },
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/providers', label: 'Addons' },
  { to: '/community', label: 'Community' },
  { to: '/developers', label: 'Developers' },
] as const;




export default function MarketingNav() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  /* Logo breathes with intent: it fades away as you scroll down, and comes
     back the moment you scroll up — the mark never crowds the content. */
  const [logoVisible, setLogoVisible] = useState(true);
  const lastY = useRef(0);
