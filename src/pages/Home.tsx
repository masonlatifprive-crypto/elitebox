import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Gauge, Layers, MonitorSmartphone, ShieldCheck, Subtitles } from 'lucide-react';
import LivingTree from '@/components/LivingTree';
import Shelf from '@/components/Shelf';
import { ButtonGhost, ButtonNeon, ButtonPrimary, Eyebrow, GlassPanel } from '@/components/ui-elite';
import { usePublicCatalog } from '@/lib/usePublicCatalog';
import type { MetaItem } from '@/lib/types';

const PLATFORMS = ['Android', 'Android TV', 'Windows', 'macOS', 'Linux', 'LG TV', 'Web'];

const FEATURES = [
  { icon: Gauge, title: 'Built for speed', body: 'A lean engine and same-origin catalog mean instant browsing, quick search, and smooth playback on every device.' },
  { icon: Boxes, title: 'Powered by addons', body: 'Add the catalogs and sources you want. EliteBox stays yours — install, reorder, and remove in seconds.' },
  { icon: ShieldCheck, title: 'Private by design', body: 'We keep only the minimum needed to sync your library. No history of what you watch or where you stream it.' },
  { icon: Subtitles, title: 'Studio-grade subtitles', body: 'Upload your own tracks, fine-tune timing, and save styling per title so it looks perfect on any screen.' },
  { icon: MonitorSmartphone, title: 'Seamless across devices', body: 'Start on your phone, finish on your TV. Your library and progress follow you everywhere you sign in on.' },
  { icon: Layers, title: 'One clean library', body: 'Movies, series, live and free public-domain cinema — organised in a single, calm interface.' },
];

const FAQ = [
  { q: 'What is EliteBox?', a: 'EliteBox is a modern media hub that brings your catalogs, addons and player together in one calm, cinematic interface.' },
  { q: 'How does it work?', a: 'Launch the app, pick the addons you want, and start browsing. Your library and watch progress stay available across the app.' },
  { q: 'What can I watch?', a: 'Real movie and series metadata powers discovery, plus a free Open Cinema collection of public-domain and Creative-Commons films you can play right away.' },
  { q: 'Is EliteBox safe and private?', a: 'Yes. EliteBox runs a legal addon architecture, blocks known piracy sources, and keeps the browser experience honest.' },
  { q: 'Does it cost anything?', a: 'The core web experience is free. Premium comfort features can be added without changing the calm interface.' },
];

function SectionTitle({ eyebrow, title, subtitle, center = false }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.7rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">{title}</h2>
      {subtitle && <p className="mt-5 text-body-l text-muted">{subtitle}</p>}
    </div>
  );
