import { useMemo } from 'react';
import { Link } from 'react-router';
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
}

function splitCatalog(items: MetaItem[]) {
  const movies = items.filter((m) => m.type === 'movie').slice(0, 16);
  const series = items.filter((m) => m.type === 'series').slice(0, 16);
  return { movies, series };
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="eb-hero-halo pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-16 pt-40 sm:px-24 sm:pt-64">
        <div className="mx-auto flex h-[290px] items-center justify-center sm:h-[360px] lg:h-[390px]">
          <LivingTree className="w-full max-w-[760px] scale-100" />
        </div>
        <div className="mx-auto -mt-12 max-w-3xl text-center sm:-mt-20">
          <h1 className="hero-title font-display text-[clamp(2.5rem,7.2vw,3.75rem)] font-semibold leading-none tracking-[-0.025em] text-ink">
            Freedom to watch.<br /><span className="text-white/60">Everything in one calm app.</span>
          </h1>
          <p className="mx-auto mt-20 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
            EliteBox brings movies, series, anime, live channels, subtitles and legal open cinema into one fast, private experience across every screen.
          </p>
          <div className="mt-32 flex flex-wrap items-center justify-center gap-12">
            <ButtonPrimary to="/downloads" className="px-28 py-14" data-testid="hero-primary-cta">Download EliteBox</ButtonPrimary>
            <ButtonNeon to="/app" className="px-28 py-14" data-testid="hero-secondary-cta">Open Web App</ButtonNeon>
          </div>
          <div data-testid="hero-available-on" className="mt-32 flex flex-wrap items-center justify-center gap-8">
            {PLATFORMS.map((p) => (
              <span key={p} className="rounded-full border border-white/10 bg-white/[.035] px-12 py-5 text-xs text-white/70">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PosterWalls() {
  const { items, loading } = usePublicCatalog();
  const { movies, series } = useMemo(() => splitCatalog(items), [items]);
  return (
    <section className="mx-auto max-w-6xl space-y-48 px-16 py-80 sm:px-24">
      {loading && <p className="text-center text-caption text-muted">Loading real catalogs…</p>}
      {movies.length > 0 && <Shelf title="Trending movies" items={movies} seeAllTo="/app/movies" />}
      {series.length > 0 && <Shelf title="Popular series" items={series} seeAllTo="/app/series" />}
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-16 py-80 sm:px-24">
        <SectionTitle eyebrow="Why EliteBox" title="Watch and enjoy, the easy way" subtitle="A clean entertainment hub with addon-powered discovery, reliable playback tools, and a library that feels effortless." />
        <div className="mt-48 grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <GlassPanel key={f.title} level={1} className="p-24 transition hover:border-white/20">
                <Icon className="h-24 w-24 text-cyan" />
                <h3 className="mt-16 font-display text-title text-ink">{f.title}</h3>
                <p className="mt-8 text-caption text-muted">{f.body}</p>
              </GlassPanel>
            );
          })}
        </div>
        <div className="mt-40"><ButtonGhost to="/features">See all features</ButtonGhost></div>
      </div>
    </section>
  );
}

function BigScreen() {
  const { items } = usePublicCatalog();
  const posters = items.filter((m) => m.poster).slice(0, 8);
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto grid max-w-6xl items-center gap-40 px-16 py-80 sm:px-24 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="On the big screen" title="Big-screen browsing, made simple" subtitle="The EliteBox TV experience keeps discovery, search, subtitles and playback controls easy to reach from the couch." />
          <div className="mt-32"><ButtonPrimary to="/downloads">All downloads</ButtonPrimary></div>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#030612]">
          <div className="absolute inset-0 grid grid-cols-4 gap-8 p-16 opacity-80">
            {posters.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-md border border-white/10 bg-white/5">
                <img src={m.poster} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}

function FaqAndFinalCta() {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-3xl px-16 py-80 sm:px-24">
        <SectionTitle center eyebrow="FAQ" title="Good to know" />
        <div className="mt-40 divide-y divide-white/10" data-testid="home-faq">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-18">
              <summary className="cursor-pointer list-none text-base font-semibold text-ink marker:hidden">{f.q}</summary>
              <p className="mt-10 text-caption leading-7 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <GlassPanel level={1} className="mt-48 p-32 text-center">
          <h3 className="font-display text-2xl font-semibold text-ink">Start watching with EliteBox</h3>
          <p className="mt-8 text-caption text-muted">Open the web app, add legal providers, and build a library that follows your devices.</p>
          <div className="mt-20 flex justify-center"><ButtonPrimary to="/register">Get EliteBox for free</ButtonPrimary></div>
        </GlassPanel>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <PosterWalls />
      <FeatureGrid />
      <BigScreen />
      <FaqAndFinalCta />
      <div className="sr-only">
        <Link to="/app/tv">TV Focus Mode</Link>
      </div>
    </>
  );
}
