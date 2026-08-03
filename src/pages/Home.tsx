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
}

function Home() {
  const { catalog: publicCinema } = usePublicCatalog();

  return (
    <div className="bg-white selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container-tight relative z-10">
          <div className="max-w-3xl">
            <Eyebrow>Open Source Media Hub</Eyebrow>
            <h1 className="mt-8 font-display text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.05em] text-ink">
              One app for all your <span className="text-primary">catalogs.</span>
            </h1>
            <p className="mt-10 text-body-l text-muted max-w-xl">
              EliteBox is the calmest way to browse, organize, and play your media. 
              Private, extensible, and beautifully simple.
            </p>
            <div className="mt-12 flex flex-wrap gap-5">
              <ButtonNeon size="lg" as={Link} to="/app">
                Launch Web App
              </ButtonNeon>
              <ButtonGhost size="lg" as={Link} to="/auth/signup">
                Create account
              </ButtonGhost>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 container-wide">
          <LivingTree />
        </div>
      </section>

      {/* Public Catalog Preview */}
      <section className="py-32 bg-slate-50/50">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 container-tight !mx-0">
            <SectionTitle 
              eyebrow="Free Collection"
              title="Open Cinema"
              subtitle="Public domain and Creative Commons films available to stream immediately, no addons required."
            />
            <ButtonPrimary as={Link} to="/app/explore">View full catalog</ButtonPrimary>
          </div>
          
          <Shelf items={publicCinema?.slice(0, 8) || []} />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32">
        <div className="container-tight">
          <SectionTitle 
            eyebrow="Features"
            title="Engineered for the modern viewer"
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

      {/* Platform Support */}
      <section className="py-24 border-y border-border/40 bg-slate-50/30">
        <div className="container-tight text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted">Available everywhere</p>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all">
            {PLATFORMS.map(p => (
              <span key={p} className="text-xl font-display font-semibold text-ink">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container-tight">
          <GlassPanel className="relative overflow-hidden bg-ink p-12 md:p-20 text-center border-none">
            <div className="relative z-10">
              <h2 className="text-white font-display text-4xl md:text-6xl font-bold tracking-tight">
                Ready to upgrade your<br />media experience?
              </h2>
              <p className="mt-6 text-white/60 text-lg max-w-xl mx-auto">
                Join thousands of users who have reclaimed their privacy and their library with EliteBox.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonNeon size="lg" as={Link} to="/app">
                  Open EliteBox Web
                </ButtonNeon>
                <ButtonPrimary size="lg" variant="secondary" className="bg-white text-ink hover:bg-white/90" as={Link} to="/auth/signup">
                  Create Free Account
                </ButtonPrimary>
              </div>
            </div>
            {/* Background glow */}
            <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-full h-full bg-primary/20 blur-[120px] rounded-full" />
          </GlassPanel>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 border-t border-border/50">
        <div className="container-tight">
          <SectionTitle 
            eyebrow="Support"
            title="Frequently Asked Questions"
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
