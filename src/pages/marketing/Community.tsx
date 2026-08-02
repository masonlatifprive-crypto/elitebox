import { motion } from 'framer-motion';
import { Bug, Code2, HeartHandshake, MessageSquare, Rocket, ShieldCheck, TestTube2, Users } from 'lucide-react';
import { ButtonNeon, ButtonPrimary, Eyebrow, GlassPanel } from '@/components/ui-elite';

const WAYS = [
  { icon: MessageSquare, title: 'Share feedback', body: 'Report bugs, suggest features, and tell us which legal providers or platforms should be easier to use.' },
  { icon: TestTube2, title: 'Beta testing', body: 'Try new TV, mobile, and desktop builds before public release and help us catch device-specific issues.' },
  { icon: Code2, title: 'Build addons', body: 'Create legal catalog, metadata, subtitle, or open-media addons using the Elitebox manifest protocol.' },
  { icon: ShieldCheck, title: 'Safety review', body: 'Help keep the directory useful and lawful by reporting broken manifests, unsafe permissions, or rights issues.' },
];

const COMMUNITIES = ['GitHub', 'Reddit-style discussions', 'Beta testers', 'Addon builders', 'Open cinema curators', 'Device QA'];

export default function Community() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-56 px-16 pb-128 pt-160 md:px-24">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-14">
        <Eyebrow>Community</Eyebrow>
        <h1 className="max-w-[16ch] font-display text-display-xl text-ink">Shape the future of EliteBox.</h1>
        <p className="max-w-[68ch] text-body-l text-muted">EliteBox is built around a simple idea: a calm, legal, addon-powered media hub should feel fast everywhere. Developers, testers, designers, accessibility reviewers, and fans can all help make it better.</p>
        <div className="mt-8 flex flex-wrap gap-12">
          <ButtonPrimary to="/developers">Build an addon</ButtonPrimary>
          <ButtonNeon to="/support">Send feedback</ButtonNeon>
        </div>
      </motion.header>

      <section className="grid gap-18 md:grid-cols-2">
        {WAYS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.article key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <GlassPanel level={1} className="h-full p-24">
                <Icon className="h-24 w-24 text-cyan" />
                <h2 className="mt-16 font-display text-title text-ink">{item.title}</h2>
                <p className="mt-8 text-caption leading-7 text-muted">{item.body}</p>
              </GlassPanel>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-24 lg:grid-cols-[1fr_.85fr]">
        <GlassPanel level={2} className="p-28">
          <div className="flex items-center gap-12"><Users className="text-cyan" /><h2 className="font-display text-title text-ink">Ways to get involved</h2></div>
          <div className="mt-20 grid gap-10 sm:grid-cols-2">
            {COMMUNITIES.map((c) => <span key={c} className="rounded-full border border-white/10 bg-white/[.04] px-14 py-8 text-caption text-muted">{c}</span>)}
          </div>
        </GlassPanel>
        <GlassPanel level={1} className="p-28">
          <Rocket className="h-28 w-28 text-cyan" />
          <h2 className="mt-16 font-display text-title text-ink">Developer-friendly by design</h2>
          <p className="mt-10 text-caption leading-7 text-muted">The addon system is manifest-driven, remote by default, timeout-protected, and reviewed through a safety screen. You can provide catalogs, metadata, streams you have rights to serve, subtitles, or addon directories.</p>
        </GlassPanel>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/70 p-28">
        <div className="flex items-center gap-12"><Bug className="text-cyan" /><h2 className="font-display text-title text-ink">Found a problem?</h2></div>
        <p className="mt-10 max-w-[70ch] text-caption leading-7 text-muted">Send a route, screenshot, device, browser, and what happened. The fastest reports include whether it happened on Web, Android, Android TV, or Windows.</p>
        <div className="mt-18"><ButtonPrimary to="/support">Open support</ButtonPrimary></div>
      </section>
    </div>
  );
}
