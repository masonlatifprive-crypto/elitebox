import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Gauge, Layers, MonitorSmartphone, ShieldCheck, Subtitles } from 'lucide-react';
import LivingTree from '../components/LivingTree';
import Shelf from '../components/Shelf';
import { ButtonGhost, ButtonNeon, ButtonPrimary, Eyebrow, GlassPanel } from '../components/ui-elite';
import usePublicCatalog from '../lib/usePublicCatalog';
import type { MetaItem } from '../lib/types';


const PLATFORMS = ['Android', 'Android TV', 'Windows', 'macOS', 'Linux', 'LG TV', 'Web'];


const FEATURES = [
  { icon: Gauge, title: 'Streaming Enhanced', body: 'Experience a secure, modern, and seamless entertainment hub with 4K support and instant discovery.' },
  { icon: Boxes, title: 'Freedom to Extend', body: 'The ultimate choice for a worry-free experience. Install the addons you want and customize your library.' },
  { icon: ShieldCheck, title: 'Private & Secure', body: 'Built with a commitment to security. We don\'t track what you watch, keeping your streaming truly personal.' },
  { icon: Subtitles, title: 'Perfectly Synced', body: 'Studio-grade subtitles with custom styling and timing offsets that follow you across every device.' },
  { icon: MonitorSmartphone, title: 'Seamless Across Devices', body: 'Available for Windows, Mac, Android and more. Just log in and pick up exactly where you left off.' },
  { icon: Layers, title: 'One Unified Library', body: 'Organize movies, series, and public domain cinema in a clean, intuitive interface designed for clarity.' },
];


const FAQ = [
  { q: 'What is EliteBoxMovies?', a: 'EliteBoxMovies is a premium media hub designed to bring your catalogs, addons, and player into one cinematic interface.' },
  { q: 'How do I start watching?', a: 'Simply launch the web app, explore the free collections, or add your favorite sources via our addon system.' },
  { q: 'Is it really private?', a: 'Yes. We believe in privacy by design. Your watch history stays yours, and we only sync what\'s necessary for your experience.' },
  { q: 'Can I use it on my TV?', a: 'Absolutely. EliteBox is built for the big screen, featuring a dedicated TV mode and support for Android TV devices.' },
  { q: 'What makes it different?', a: 'Unlike traditional players, EliteBox offers a unified library across all screens with a focus on speed and ease of use.' },
];


function SectionTitle({ eyebrow, title, subtitle, center = false }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.7rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">{title}</h2>
      {subtitle && <p className="mt-5 text-body-l text-muted">{subtitle}</p>}
    </div>
  );
