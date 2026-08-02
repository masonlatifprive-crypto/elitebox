import { motion } from 'framer-motion';
import { Archive, Captions, Clapperboard, Database, Film, MonitorPlay, Puzzle, Radio, ShieldCheck, Tv } from 'lucide-react';
import { ButtonPrimary, Eyebrow, GlassPanel } from '@/components/ui-elite';

const CATEGORIES = [
  { icon: Database, title: 'Metadata providers', body: 'Movie, series, anime, cast, poster, rating, season, and episode metadata through legal manifests and public catalog APIs.' },
  { icon: Clapperboard, title: 'Catalog providers', body: 'Popular, new, genre, anime, open cinema, public-domain, regional, and curated rows where the provider has rights to list the data.' },
  { icon: MonitorPlay, title: 'Stream providers', body: 'Only legal, licensed, open, or user-owned stream sources. EliteBox does not run piracy indexers or unauthorized stream scrapers.' },
  { icon: Captions, title: 'Subtitle providers', body: 'Subtitle manifests can provide VTT/SRT tracks, language codes, sync metadata, and styling support.' },
  { icon: Archive, title: 'Open cinema', body: 'Playable public-domain and Creative-Commons films are supported as a first-class legal source.' },
  { icon: Tv, title: 'Live & TV', body: 'Legal live channels, public broadcasts, and user-configured providers can appear in the Live and TV Focus interfaces.' },
  { icon: Radio, title: 'Audio and radio', body: 'Audio/video feeds are supported where providers declare rights and compatible resources.' },
  { icon: Puzzle, title: 'Manifest install', body: 'Advanced users can install HTTPS manifest URLs. EliteBox checks resources, permissions, privacy, safety, and health before use.' },
  { icon: ShieldCheck, title: 'Blocked sources', body: 'Known piracy addons and copyright-infringing sources are blocked or warned against before installation.' },
];

export default function Providers() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-52 px-16 pb-128 pt-160 md:px-24">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <Eyebrow>Addon directory</Eyebrow>
        <h1 className="max-w-[15ch] font-display text-display-xl text-ink">Legal providers, full control.</h1>
        <p className="mt-14 max-w-[72ch] text-body-l text-muted">EliteBox follows a Stremio-style manifest model with its own safety layer. Addons can provide catalogs, metadata, streams, subtitles, and directories when they are lawful, transparent, and privacy-aware.</p>
        <div className="mt-24"><ButtonPrimary to="/app/addons">Open addon manager</ButtonPrimary></div>
      </motion.header>
      <section className="grid gap-18 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((item, i) => {
          const Icon = item.icon;
          return <motion.article key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.05 }}><GlassPanel level={1} className="h-full p-22"><Icon className="h-24 w-24 text-cyan" /><h2 className="mt-14 font-display text-title text-ink">{item.title}</h2><p className="mt-8 text-caption leading-7 text-muted">{item.body}</p></GlassPanel></motion.article>;
        })}
      </section>
      <section className="rounded-2xl border border-cyan/20 bg-cyan/[.035] p-28">
        <div className="flex items-center gap-12"><ShieldCheck className="text-cyan" /><h2 className="font-display text-title text-ink">Blocked Sources & Safety</h2></div>
        <p className="mt-10 max-w-[82ch] text-caption leading-7 text-muted">EliteBox does not ship piracy add-ons, unauthorized copyrighted streams, provider bypass tools, or scraping integrations. The app supports broad discovery and legal playback through lawful providers, public/open media, official trailers, subtitles, user-owned files, and manifest URLs that pass the safety screen.</p>
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/70 p-28">
        <div className="flex items-center gap-12"><Film className="text-cyan" /><h2 className="font-display text-title text-ink">Anime and global discovery</h2></div>
        <p className="mt-10 max-w-[82ch] text-caption leading-7 text-muted">Global coverage is handled through metadata/catalog providers. Cinemeta covers large movie and series catalogs, while the /anime and /global-catalog routes point users into the same legal discovery engine. Anime-specific coverage can be expanded through lawful metadata/catalog manifests without adding unauthorized streams.</p>
      </section>
    </div>
  );
}
