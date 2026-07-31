/**
 * Store marketing page `/store` (store.md).
 * S1 hero (addon-engine-visual.png) · S2 addon directory (real install for
 * the builtin Showcase, honest manifest-URL flow for community addons) ·
 * S3 premium plan presentation ($4.99/month) · S4 developer strip.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  Code2,
  Link2,
  PackageOpen,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  EmptyState,
  GlassPanel,
  HealthDot,
  Modal,
  spring,
  toast,
  Eyebrow,
} from '@/components/ui-elite';
import SpotlightCard from '@/components/SpotlightCard';
import { addonEngine } from '@/lib/addons/engine';
import { SHOWCASE_ADDON, useAddons } from '@/lib/store';
import { cn } from '@/lib/utils';

const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── S1 — Hero ─────────────────────────────────────────────────────────── */

const H1_WORDS = ['Addons.', 'Catalogs.', 'Channels.'];

function Hero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative flex min-h-[50dvh] md:min-h-[60dvh] items-center justify-center overflow-hidden">
      {/* addon-engine-visual as a low, wide drifting band (30%, masked) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 top-[30%] z-0 [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]"
      >
        <motion.img
          src="/addon-engine-visual.webp"
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-30"
          animate={reduceMotion ? undefined : { x: [-20, 20, -20] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-gradient-to-t from-deep via-deep/30 to-deep/70"
      />

      <div className="relative z-[2] flex max-w-3xl flex-col items-center gap-24 px-16 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}
          >
            <Eyebrow className="mb-16">The Elitebox Store</Eyebrow>
          </motion.div>
          <h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.035em] font-extrabold md:text-display-xl">
            {H1_WORDS.map((word, i) => (
              <motion.span
                key={word}
                className="text-chrome mr-[0.28em] inline-block will-change-transform"
                variants={{
                  hidden: { opacity: 0, y: 36 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: OUT_EXPO, delay: i * 0.04 },
                  },
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
        </motion.div>
        <motion.p
          className="max-w-[60ch] text-body-l text-muted"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45, ease: OUT_EXPO }}
        >
          Install an addon. Its catalog appears. That's it. You preview exactly what an addon can
          access before anything installs.
        </motion.p>
      </div>
    </section>
  );
}

/* ── S2 — Addon directory ──────────────────────────────────────────────── */

type Category = 'All' | 'Catalogs' | 'Live' | 'Subtitles' | 'Tools';
const CATEGORIES: Category[] = ['All', 'Catalogs', 'Live', 'Subtitles', 'Tools'];

interface DirectoryEntry {
  id: string;
  name: string;
  version: string;
  icon: string;
  description: string;
  scope: string;
  permissions: string[];
  permissionNote: string;
  category: Exclude<Category, 'All'>;
  builtin?: boolean;
}

const DIRECTORY: DirectoryEntry[] = [
  {
    id: SHOWCASE_ADDON.id,
    name: SHOWCASE_ADDON.name,
    version: SHOWCASE_ADDON.version,
    icon: '/art/addon-icon-showcase.jpg',
    description:
      'Built-in open-content catalog: Blender Studio open movies, the Caminandes series and open live channels. Works fully offline.',
    scope: 'Catalogs · Meta · Streams',
    permissions: ['no network', 'no storage'],
    permissionNote:
      'The Showcase addon ships inside Elitebox and answers locally. It makes no network calls and cannot read your library.',
    category: 'Catalogs',
    builtin: true,
  },
  {
    id: 'community.cinema-catalog',
    name: 'Cinema Catalog',
    version: '1.2.0',
    icon: '/art/addon-icon-cinema.jpg',
    description:
      'A community movie and series catalog addon. Distributed as a manifest URL by its maintainer.',
    scope: 'Catalogs · Meta',
    permissions: ['network', 'no storage'],
    permissionNote:
      'This addon can fetch catalogs and metadata from its own server. It cannot read your library or watch history.',
    category: 'Catalogs',
  },
  {
    id: 'community.live-waves',
    name: 'Live Waves',
    version: '0.9.4',
    icon: '/art/addon-icon-live.jpg',
    description:
      'Live channel directory addon — sports, news and event streams from community-maintained sources.',
    scope: 'Catalogs · Streams',
    permissions: ['network', 'no storage'],
    permissionNote:
      'This addon can fetch channel lists and stream addresses from its own server. It cannot read your library.',
    category: 'Live',
  },
  {
    id: 'community.archive-vault',
    name: 'Archive Vault',
    version: '2.0.1',
    icon: '/art/addon-icon-archive.jpg',
    description:
      'Public-domain film archive addon. Classic cinema catalog with multi-quality stream sources.',
    scope: 'Catalogs · Meta · Streams',
    permissions: ['network', 'no storage'],
    permissionNote:
      'This addon can fetch catalogs and streams from its own server. It cannot read your library.',
    category: 'Catalogs',
  },
  {
    id: 'community.radio-garden',
    name: 'Radio Garden',
    version: '1.1.0',
    icon: '/art/addon-icon-radio.jpg',
    description:
      'Live radio streams from around the world, mapped into the Elitebox Live TV guide.',
    scope: 'Catalogs · Streams',
    permissions: ['network', 'no storage'],
    permissionNote:
      'This addon can fetch station lists and audio streams from its own server. It cannot read your library.',
    category: 'Live',
  },
  {
    id: 'community.docuverse',
    name: 'Docuverse',
    version: '0.7.2',
    icon: '/art/addon-icon-docs.jpg',
    description:
      'Documentary catalog addon with per-episode metadata and subtitle tracks where provided.',
    scope: 'Catalogs · Meta · Subtitles',
    permissions: ['network', 'no storage'],
    permissionNote:
      'This addon can fetch catalogs, metadata and subtitle files from its own server. It cannot read your library.',
    category: 'Subtitles',
  },
];

function InstallButton({ entry }: { entry: DirectoryEntry }) {
  const navigate = useNavigate();
  const installed = useAddons((s) => s.installed);
  const installAddon = useAddons((s) => s.installAddon);
  const isInstalled = installed.some((a) => a.id === entry.id);

  if (isInstalled) {
    return (
      <span className="focusable inline-flex items-center gap-6 rounded-full border-[1.5px] border-cyan px-16 py-8 text-[12px] font-bold text-cyan">
        <Check size={14} strokeWidth={2.5} /> Installed
      </span>
    );
  }

  const onInstall = () => {
    if (entry.builtin) {
      // Real mutation: re-install the builtin Showcase addon.
      installAddon(SHOWCASE_ADDON);
      toast('Elitebox Showcase installed');
      return;
    }
    // Community addons install from a manifest URL inside the app — the
    // honest path is the Addon Manager, where permissions preview first.
    toast('Community addons install from a manifest URL in the app.');
    navigate('/app/addons');
  };

  return (
    <ButtonPrimary onClick={onInstall} className="px-16 py-8 text-[12px]">
      Install
    </ButtonPrimary>
  );
}

function AddonCard({
  entry,
  index,
  onPermissions,
}: {
  entry: DirectoryEntry;
  index: number;
  onPermissions: (entry: DirectoryEntry) => void;
}) {
  const installed = useAddons((s) => s.installed);
  const isInstalled = installed.some((a) => a.id === entry.id);
  const health = isInstalled ? addonEngine.health(entry.id) : undefined;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: OUT_EXPO }}
      whileHover={{ y: -4 }}
    >
      <SpotlightCard className="h-full rounded-xl">
        <GlassPanel
          level={2}
          className="flex h-full flex-col gap-16 rounded-xl p-24 transition-shadow duration-[180ms] hover:shadow-aura-purple"
        >
        {/* row 1 — icon, name, version */}
        <div className="flex items-center gap-16">
          <img
            src={entry.icon}
            alt={`${entry.name} icon`}
            loading="lazy"
            className="glass-1 h-48 w-48 rounded-xl object-cover"
          />
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <h3 className="font-display text-title text-ink truncate">{entry.name}</h3>
            <span className="glass-1 shrink-0 rounded-md px-8 py-2 font-mono text-micro text-muted">
              v{entry.version}
            </span>
          </div>
          {entry.builtin && (
            <span className="glass-1 shrink-0 rounded-md px-8 py-2 text-micro uppercase text-cyan">
              Pre-installed
            </span>
          )}
        </div>
        {/* row 2 — description */}
        <p className="text-caption text-muted line-clamp-2">{entry.description}</p>
        {/* row 3 — metadata */}
        <div className="flex flex-wrap items-center gap-12">
          {health ? (
            <HealthDot status={health.status} latencyMs={health.latencyMs} />
          ) : (
            <span className="inline-flex items-center gap-6" title="Not installed yet">
              <span className="inline-block h-8 w-8 rounded-full bg-muted/40" />
              <span className="font-mono text-[11px] text-muted">not installed</span>
            </span>
          )}
          <span className="text-[12px] text-muted">{entry.scope}</span>
          {entry.permissions.map((p) => (
            <span
              key={p}
              className="glass-1 inline-flex items-center gap-4 rounded-md px-8 py-2 font-mono text-[11px] text-muted"
            >
              <ShieldCheck size={12} strokeWidth={1.75} className="text-cyan" />
              {p}
            </span>
          ))}
        </div>
        {/* row 4 — actions */}
        <div className="mt-auto flex items-center gap-12">
          <InstallButton entry={entry} />
          <ButtonGhost onClick={() => onPermissions(entry)}>Permissions</ButtonGhost>
        </div>
        </GlassPanel>
      </SpotlightCard>
    </motion.div>
  );
}

function Directory() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [permsFor, setPermsFor] = useState<DirectoryEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIRECTORY.filter(
      (e) =>
        (category === 'All' || e.category === category) &&
        (!q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-32 px-16 py-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-col gap-8"
      >
        <Eyebrow>Directory</Eyebrow>
        <h2 className="font-display text-display-l text-ink">Every addon, health-checked.</h2>
      </motion.div>

      {/* filter bar */}
      <div className="glass-solid sticky top-80 z-20 flex flex-col gap-16 rounded-xl p-16 md:flex-row md:items-center">
        <label className="glass-1 flex flex-1 items-center gap-10 rounded-lg px-16 py-10">
          <Search size={16} strokeWidth={1.75} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search addons…"
            aria-label="Search addons"
            className="w-full bg-transparent font-mono text-caption text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-8" role="tablist" aria-label="Addon categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'focusable relative rounded-full px-16 py-8 text-caption font-semibold transition-colors duration-150 cursor-pointer',
                category === c ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {c}
              {category === c && (
                <motion.span
                  layoutId="addon-cat-beam"
                  className="bg-signature absolute inset-x-12 -bottom-2 h-2 rounded-full"
                  transition={spring.snappy}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Nothing here yet."
          caption="No directory entries match. Community addons install from a manifest URL inside the app."
          action={<ButtonNeon to="/app/addons">Open Addon Manager</ButtonNeon>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-24 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e, i) => (
            <AddonCard key={e.id} entry={e} index={i} onPermissions={setPermsFor} />
          ))}
        </div>
      )}

      {/* honest community-addon card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
      >
        <GlassPanel
          level={1}
          className="flex flex-col items-start justify-between gap-16 rounded-xl p-24 md:flex-row md:items-center"
        >
          <div className="flex items-start gap-16">
            <span className="glass-1 flex h-48 w-48 shrink-0 items-center justify-center rounded-xl">
              <Link2 size={24} strokeWidth={1.75} className="text-cyan" />
            </span>
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-title text-ink">Community addons via manifest URL</h3>
              <p className="max-w-[60ch] text-caption text-muted">
                The wider addon ecosystem installs from a single manifest URL. Paste it in the
                app's Addon Manager — permissions preview before anything is installed.
              </p>
            </div>
          </div>
          <ButtonNeon to="/app/addons" className="shrink-0">
            Open Addon Manager
          </ButtonNeon>
        </GlassPanel>
      </motion.div>

      {/* permissions modal */}
      <Modal
        open={permsFor !== null}
        onClose={() => setPermsFor(null)}
        title={permsFor ? `${permsFor.name} permissions` : undefined}
      >
        {permsFor && (
          <div className="flex flex-col gap-16">
            <p className="break-all font-mono text-[12px] text-muted">
              {permsFor.builtin
                ? 'builtin://elitebox.showcase (no manifest URL — ships inside Elitebox)'
                : `https://addons.example/${permsFor.id}/manifest.json — provided by the addon's maintainer`}
            </p>
            <ul className="flex flex-col gap-12">
              {permsFor.permissions.map((p) => (
                <li key={p} className="flex items-start gap-10">
                  <ShieldCheck size={16} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                  <span className="text-caption text-ink">{p}</span>
                </li>
              ))}
            </ul>
            <p className="text-caption text-muted">{permsFor.permissionNote}</p>
            <div className="flex flex-wrap items-center gap-12">
              {permsFor.builtin ? (
                <ButtonPrimary
                  onClick={() => {
                    useAddons.getState().installAddon(SHOWCASE_ADDON);
                    toast('Elitebox Showcase installed');
                    setPermsFor(null);
                  }}
                >
                  Install anyway
                </ButtonPrimary>
              ) : (
                <ButtonPrimary to="/app/addons">Open Addon Manager</ButtonPrimary>
              )}
              <ButtonGhost onClick={() => setPermsFor(null)}>Cancel</ButtonGhost>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

/* ── S3 — Premium plan presentation ────────────────────────────────────── */

const FREE_FEATURES = [
  'The full Elitebox engine, free forever',
  'Showcase catalog of open films, built in',
  'Local profiles and playback memory',
  'Community addons via manifest URL',
];

const PREMIUM_FEATURES = [
  'Every movie and series in the catalog. Completely.',
  'Live channels in one health-checked guide',
  'Resume and library sync across devices',
  'Cancel any time — your local library stays yours',
];

function Plans() {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-48 px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-col items-center gap-12 text-center"
      >
        <Eyebrow>Plans</Eyebrow>
        <h2 className="font-display text-display-l text-ink">Free, or $4.99 a month.</h2>
        <p className="max-w-[64ch] text-caption text-muted">
          The Elitebox engine is free and open. Premium adds the full catalog — one plan, one
          price, cancel anytime.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 items-stretch gap-24 lg:grid-cols-2">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: OUT_EXPO }}
          whileHover={{ y: -6 }}
        >
          <GlassPanel level={2} className="flex h-full flex-col gap-24 rounded-2xl p-32">
            <div className="flex flex-col gap-8">
              <h3 className="font-display text-title text-ink">Open</h3>
              <p className="text-caption text-muted">The engine, free.</p>
              <p className="font-display text-display-l text-ink">$0</p>
            </div>
            <ul className="flex flex-col gap-12">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-10">
                  <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
                  <span className="text-caption text-ink">{f}</span>
                </li>
              ))}
            </ul>
            <ButtonNeon to="/app/onboarding" className="mt-auto w-full">
              Start free
            </ButtonNeon>
          </GlassPanel>
        </motion.div>

        {/* Premium — elevated, gradient border */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1, duration: 0.55, ease: OUT_EXPO }}
          whileHover={{ y: -6 }}
          className="lg:-my-12"
        >
          <div className="bg-signature h-full rounded-2xl p-[1.5px] shadow-[0_0_32px_rgba(169,155,240,.25)]">
            <div className="glass-3 flex h-full flex-col gap-24 rounded-[22.5px] bg-deep/80 p-32">
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between gap-12">
                  <h3 className="font-display text-title text-ink">Elitebox Premium</h3>
                  <span className="bg-signature rounded-full px-12 py-4 text-micro uppercase text-deep">
                    One plan
                  </span>
                </div>
                <p className="text-caption text-muted">For the everyday watcher.</p>
                <p className="font-display text-display-l text-ink">
                  $4.99<span className="text-title text-muted">/month</span>
                </p>
              </div>
              <ul className="flex flex-col gap-12">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-10">
                    <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
                    <span className="text-caption text-ink">{f}</span>
                  </li>
                ))}
              </ul>
              <ButtonPrimary to="/subscribe" className="mt-auto w-full">
                Subscribe — $4.99/month
              </ButtonPrimary>
              <p className="text-center text-[12px] text-muted">
                Sign in to manage or cancel from your account at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── S4 — Developer strip ──────────────────────────────────────────────── */

const MANIFEST_TOKENS =
  '{ "id": "my.addon", "name": "My Addon", "version": "1.0.0", "resources": ["catalog", "meta", "stream", "subtitles"], "types": ["movie", "series", "channel"] }';

function DevStrip() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative z-10 mx-auto w-full max-w-[1280px] px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
      >
        <GlassPanel
          level={2}
          className="relative flex flex-col items-start justify-between gap-24 overflow-hidden rounded-2xl p-32 md:flex-row md:items-center"
        >
          {/* manifest token marquee behind */}
          {!reduceMotion && (
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden opacity-30">
              <motion.div
                className="flex whitespace-nowrap font-mono text-[12px] text-muted"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <span className="pr-48">{MANIFEST_TOKENS}</span>
                <span className="pr-48">{MANIFEST_TOKENS}</span>
              </motion.div>
            </div>
          )}
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-12">
              <Code2 size={24} strokeWidth={1.75} className="text-cyan" />
              <h2 className="font-display text-title text-ink">Build your own addon.</h2>
            </div>
            <p className="text-caption text-muted">
              One JSON manifest. Four resources. Documented, versioned, open.
            </p>
          </div>
          <ButtonGhost to="/support" className="relative shrink-0">
            Read the protocol
          </ButtonGhost>
        </GlassPanel>
      </motion.div>
    </section>
  );
}

export default function Store() {
  return (
    <>
      <Hero />
      <Directory />
      <Plans />
      <DevStrip />
    </>
  );
}
