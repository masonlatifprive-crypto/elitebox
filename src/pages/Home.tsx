import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Gauge, Layers, MonitorSmartphone, ShieldCheck, Subtitles } from 'lucide-react';
import LivingTree from '../components/LivingTree';
import Shelf from '../components/Shelf';
import { ButtonGhost, ButtonNeon, ButtonPrimary, Eyebrow, GlassPanel } from '../components/ui-elite';
import { usePublicCatalog } from '../lib/usePublicCatalog';
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
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-6 text-lg leading-8 text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export default function Home() {
  const { items: catalogItems, loading: catalogLoading } = usePublicCatalog();

  const featuredMovie = useMemo(() => {
    if (!catalogItems.length) return null;
    return catalogItems[0];
  }, [catalogItems]);

  const shelfItems = useMemo(() => {
    return catalogItems.slice(1, 13);
  }, [catalogItems]);

  return (
    <div className="relative min-h-screen bg-black selection:bg-neon-cyan/30">
      <div className="fixed inset-0 z-0">
        <LivingTree />
      </div>

      <div className="relative z-10">
        <div className="px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:items-center lg:gap-x-12">
              <div>
                <SectionTitle
                  eyebrow="Cinematic Entertainment"
                  title="The Future of Streaming is Yours to Control"
                  subtitle="EliteBoxMovies is the world's most advanced media hub. Fast, private, and open. Connect your favorite sources and enjoy your library anywhere."
                />
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link to="/app/search">
                    <ButtonNeon size="lg">Launch Web App</ButtonNeon>
                  </Link>
                  <Link to="/downloads">
                    <ButtonPrimary size="lg">Download for Free</ButtonPrimary>
                  </Link>
                </div>
                <div className="mt-12 flex flex-wrap gap-x-6 gap-y-4 text-sm font-medium text-zinc-500">
                  {PLATFORMS.map((p) => (
                    <span key={p} className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-neon-cyan" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <GlassPanel className="overflow-hidden border-white/5 p-2 ring-1 ring-white/10">
                  <div className="aspect-[16/10] overflow-hidden rounded-lg bg-zinc-900/50">
                    {featuredMovie ? (
                      <div className="relative h-full w-full">
                        <img
                          src={featuredMovie.poster || featuredMovie.background}
                          alt={featuredMovie.name}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <p className="text-sm font-medium text-neon-cyan">Featured Discovery</p>
                          <h3 className="mt-1 text-2xl font-bold text-white">{featuredMovie.name}</h3>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-12 w-12 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
                          <p className="text-sm text-zinc-500">Initializing interface...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionTitle
              center
              eyebrow="Library"
              title="Explore the Collection"
              subtitle="Dive into our curated discovery catalog featuring the best in public domain and open-source cinema."
            />
            <div className="mt-16">
              <Shelf 
                title="Popular Now" 
                items={shelfItems} 
                loading={catalogLoading}
              />
            </div>
            <div className="mt-12 text-center">
              <Link to="/app/search">
                <ButtonGhost size="lg" className="group">
                  View Full Catalog
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                </ButtonGhost>
              </Link>
            </div>
          </div>
        </div>

        <div className="py-24 sm:py-32 bg-zinc-950/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionTitle
              center
              eyebrow="Features"
              title="Built for Power Users"
              subtitle="Every detail has been engineered for the ultimate viewing experience."
            />
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <GlassPanel key={feature.title} className="p-8 transition-colors hover:bg-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/10">
                    <feature.icon className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-zinc-400 leading-relaxed">{feature.body}</p>
                </GlassPanel>
              ))}
            </div>
          </div>
        </div>

        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-24">
              <div>
                <SectionTitle
                  eyebrow="FAQ"
                  title="Questions? We have answers."
                  subtitle="Learn more about how EliteBoxMovies works and how it protects your privacy."
                />
                <div className="mt-10">
                  <Link to="/app/settings">
                    <ButtonNeon>Visit Help Center</ButtonNeon>
                  </Link>
                </div>
              </div>
              <div className="space-y-8">
                {FAQ.map((item) => (
                  <div key={item.q} className="border-b border-white/5 pb-8">
                    <h3 className="text-lg font-semibold text-white">{item.q}</h3>
                    <p className="mt-3 text-zinc-400 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-white/5 bg-black py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple p-1">
                  <div className="h-full w-full rounded-[6px] bg-black" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">ELITEBOX<span className="text-neon-cyan">MOVIES</span></span>
              </div>
              <p className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} EliteBoxMovies. Built for the future of media.</p>
              <div className="flex gap-6 text-sm text-zinc-400">
                <a href="#" className="hover:text-white">Privacy</a>
                <a href="#" className="hover:text-white">Terms</a>
                <a href="#" className="hover:text-white">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
