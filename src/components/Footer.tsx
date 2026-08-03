/**
 * Marketing footer (design.md §10.2): deep navy, gradient hairline, 4 columns
 * (Brand / Explore / Product / Legal), bottom bar with copyright + version.
 */
import { Link } from 'react-router-dom';
import { Globe, Monitor, Smartphone, Tv } from 'lucide-react';
import Logo, { LogoMark } from '@/components/Logo';
import LanguageSwitch from '@/components/LanguageSwitch';
import { useT } from '@/i18n';


const EXPLORE = [
  { to: '/', label: 'Movies' },
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/providers', label: 'Addons' },
  { to: '/community', label: 'Community' },
  { to: '/support', label: 'Support' },
] as const;


const PRODUCT = [
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/technology', label: 'Technology' },
  { to: '/developers', label: 'Addon SDK' },
  { to: '/providers', label: 'Addon Directory' },
  { to: '/updates', label: 'Updates' },
  { to: '/support', label: 'Help Center' },
] as const;


const LEGAL = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/security', label: 'Security' },
  { to: '/support#licenses', label: 'Open content licenses' },
] as const;
