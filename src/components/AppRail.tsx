/** * App shell navigation (design.md §10.3): * - Desktop/TV: fixed left rail, 72px collapsed → 224px on hover/focus *   (spring.smooth), glass-2 over --deep, "E" monogram → /app, active item *   gets cyan icon + 3px gradient bar + ink label, profile avatar at bottom. * - Mobile (<768px): bottom solid glass nav with 5 items + safe-area inset. */
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  Home,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  Radio,
  Search,
  Settings,
  Tv,
  User,
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';
import { spring } from './ui-elite';




const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/app' },
  { id: 'search', label: 'Search', icon: Search, path: '/app/search' },
  { id: 'live', label: 'Live TV', icon: Radio, path: '/app/live' },
  { id: 'library', label: 'Library', icon: Library, path: '/app/library' },
  { id: 'calendar', label: 'Schedule', icon: CalendarDays, path: '/app/calendar' },
];




export function AppRail() {
  const [isHovered, setIsHovered] = useState(false);




export default AppRail;
