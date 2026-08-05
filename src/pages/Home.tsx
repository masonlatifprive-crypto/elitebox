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
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-6 text-lg leading-8 text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export default function Home() {
  const { items: movies, loading: moviesLoading } = usePublicCatalog('movie');
  const { items: series, loading: seriesLoading } = usePublicCatalog('series');

  const featuredMovie = useMemo(() => {
    if (!movies.length) return null;
    return movies[Math.floor(Math.random() * Math.min(movies.length, 5))];
  }, [movies]);

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 z-0">
        <LivingTree />
      </div>

      <div className="relative z-10">
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-8">
                <Eyebrow>The Future of Media</Eyebrow>
              </div>
              <h1 className="max-w-4xl bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
                Your Content, <br /> Perfectly Organized.
              </h1>
              <p className="mt-8 max-w-2xl text-lg text-zinc-400">
                A secure, open-source media hub designed for the modern era. 
                Experience your favorite content with unprecedented speed and privacy.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link to="/app">
                  <ButtonNeon size="lg">Launch Web App</ButtonNeon>
                </Link>
                <Link to="/downloads">
                  <ButtonGhost size="lg">Download for Desktop</ButtonGhost>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-6">
            <Shelf title="Free Movies" items={movies} loading={moviesLoading} />
            <div className="mt-12">
              <Shelf title="Popular Series" items={series} loading={seriesLoading} />
            </div>
          </div>
        </section>

        <section className="py-24 bg-zinc-950/50 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <SectionTitle
              eyebrow="Features"
              title="Everything you need for the perfect view."
              center
            />
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <GlassPanel key={feature.title} className="p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-4 text-zinc-400">{feature.body}</p>
                </GlassPanel>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <SectionTitle
              eyebrow="Platforms"
              title="Available on all your devices."
              subtitle="Pick up right where you left off. EliteBox syncs your library across every screen."
              center
            />
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {PLATFORMS.map((platform) => (
                <div key={platform} className="rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-2 text-sm font-medium text-zinc-300">
                  {platform}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-zinc-900">
          <div className="container mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <SectionTitle title="Frequently Asked Questions" />
                <p className="mt-4 text-zinc-400">
                  Have more questions? Check our documentation or reach out to the community.
                </p>
              </div>
              <div className="space-y-8">
                {FAQ.map((faq) => (
                  <div key={faq.q}>
                    <h4 className="text-lg font-medium text-white">{faq.q}</h4>
                    <p className="mt-2 text-zinc-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-zinc-900">
          <div className="container mx-auto px-6 text-center text-zinc-500">
            <p>© {new Date().getFullYear()} EliteBoxMovies. Built for privacy and freedom.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
