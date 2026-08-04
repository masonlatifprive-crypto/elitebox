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
}

function Home() {
  const { catalog: publicCinema } = usePublicCatalog();

  return (
    <div className="bg-white selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container-tight relative z-10">
          <div className="max-w-3xl">
            <Eyebrow>EliteBox Streaming Hub</Eyebrow>
            <h1 className="mt-8 font-display text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.05em] text-ink">
              Freedom to <span className="text-primary">Stream.</span>
            </h1>
            <p className="mt-10 text-body-l text-muted max-w-xl">
              Enjoy a modern and seamless entertainment experience. Discover, organize, and watch your favorite content in one beautifully simple app.
            </p>
            <div className="mt-12 flex flex-wrap gap-5">
              <ButtonNeon size="lg" as={Link} to="/app">
                Launch Web App
              </ButtonNeon>
              <ButtonGhost size="lg" as={Link} to="/auth/signup">
                Get Started Free
              </ButtonGhost>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 container-wide">
          <LivingTree />
        </div>
      </section>

      {/* Discovery Section */}
      <section className="py-32 bg-slate-50/50">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 container-tight !mx-0">
            <SectionTitle 
              eyebrow="Watch & Enjoy"
              title="Discover Open Cinema"
              subtitle="Explore a curated collection of public-domain films and Creative Commons content, ready to stream instantly."
            />
            <ButtonPrimary as={Link} to="/app/explore">Explore All Features</ButtonPrimary>
          </div>
          
          <Shelf items={publicCinema?.slice(0, 8) || []} />
        </div>
      </section>

      {/* Features */}
      <section className="py-32">
        <div className="container-tight">
          <SectionTitle 
            eyebrow="Easy to Use"
            title="Streaming, Reimagined"
          />
          
          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {FEATURES.map((feature, i) => (
              <div key={i} className="group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="mt-8 text-xl font-semibold text-ink">{feature.title}</h3>
                <p className="mt-4 text-muted leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-platform */}
      <section className="py-24 border-y border-border/40 bg-slate-50/30">
        <div className="container-tight text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted">Available Across All Screens</p>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all">
            {PLATFORMS.map(p => (
              <span key={p} className="text-xl font-display font-semibold text-ink">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Join the party */}
      <section className="py-32 relative overflow-hidden">
        <div className="container-tight">
          <GlassPanel className="relative overflow-hidden bg-ink p-12 md:p-20 text-center border-none">
            <div className="relative z-10">
              <h2 className="text-white font-display text-4xl md:text-6xl font-bold tracking-tight">
                Join the party now.
              </h2>
              <p className="mt-6 text-white/60 text-lg max-w-xl mx-auto">
                Experience the ultimate choice for a worry-free, high-quality streaming experience with EliteBoxMovies.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonNeon size="lg" as={Link} to="/app">
                  Get EliteBox Now
                </ButtonNeon>
                <ButtonPrimary size="lg" variant="secondary" className="bg-white text-ink hover:bg-white/90" as={Link} to="/auth/signup">
                  Create Free Account
                </ButtonPrimary>
              </div>
            </div>
            <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-full h-full bg-primary/20 blur-[120px] rounded-full" />
          </GlassPanel>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 border-t border-border/50">
        <div className="container-tight">
          <SectionTitle 
            eyebrow="Support"
            title="Questions & Answers"
          />
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
            {FAQ.map(item => (
              <div key={item.q}>
                <h3 className="text-lg font-semibold text-ink">{item.q}</h3>
                <p className="mt-3 text-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
