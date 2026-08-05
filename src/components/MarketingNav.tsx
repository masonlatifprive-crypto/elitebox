import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import { LogoMark } from './Logo';
import LanguageSwitch from './LanguageSwitch';
import { ButtonNeon, ButtonGhost } from './ui-elite';
import { useT } from '../i18n';
import { cn } from '../lib/utils';


const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/app/explore', label: 'Discover' },
  { to: '/faq', label: 'Support' },
] as const;


export default function MarketingNav() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  useEffect(() => {
    setMenuOpen(false);
  }, [location]);


  return (
    <nav className={cn(
      'fixed top-0 inset-x-0 z-[100] transition-all duration-500 border-b',
      scrolled 
