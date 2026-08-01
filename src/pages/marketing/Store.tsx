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
import { useT } from '@/i18n';

const OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── S1 — Hero ─────────────────────────────────────────────────────────── */

function Hero() {
  const { t } = useT();
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
            <Eyebrow className="mb-16">{t('marketing.store.hero.eyebrow')}</Eyebrow>
          </motion.div>
          <h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.035em] font-extrabold md:text-display-xl">
            {t('marketing.store.hero.title').split(' ').map((word, i) => (
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
          {t('marketing.store.hero.sub')}
        </motion.p>
      </div>
    </section>
  );
}

/* ── S2 — Addon directory ──────────────────────────────────────────────── */

type Category = 'All' | 'Catalogs' | 'Live' | 'Subtitles' | 'Tools';
const CATEGORIES: Category[] = ['All', 'Catalogs', 'Live', 'Subtitles', 'Tools'];

type PermissionSlug = 'network' | 'noNetwork' | 'noStorage';

interface DirectoryEntry {
  id: string;
  slug: string;
  name: string;
  version: string;
  icon: string;
  permissionSlugs: PermissionSlug[];
  category: Exclude<Category, 'All'>;
  builtin?: boolean;
}

const DIRECTORY: DirectoryEntry[] = [
  {
    id: SHOWCASE_ADDON.id,
    slug: 'showcase',
    name: SHOWCASE_ADDON.name,
    version: SHOWCASE_ADDON.version,
    icon: '/art/addon-icon-showcase.jpg',
    permissionSlugs: ['noNetwork', 'noStorage'],
    category: 'Catalogs',
    builtin: true,
  },
  {
    id: 'community.cinema-catalog',
    slug: 'cinemaCatalog',
    name: 'Cinema Catalog',
    version: '1.2.0',
    icon: '/art/addon-icon-cinema.jpg',
    permissionSlugs: ['network', 'noStorage'],
    category: 'Catalogs',
  },
  {
    id: 'community.live-waves',
    slug: 'liveWaves',
    name: 'Live Waves',
    version: '0.9.4',
    icon: '/art/addon-icon-live.jpg',
    permissionSlugs: ['network', 'noStorage'],
    category: 'Live',
  },
  {
    id: 'community.archive-vault',
    slug: 'archiveVault',
    name: 'Archive Vault',
    version: '2.0.1',
    icon: '/art/addon-icon-archive.jpg',
    permissionSlugs: ['network', 'noStorage'],
    category: 'Catalogs',
  },
  {
    id: 'community.radio-garden',
    slug: 'radioGarden',
    name: 'Radio Garden',
    version: '1.1.0',
    icon: '/art/addon-icon-radio.jpg',
    permissionSlugs: ['network', 'noStorage'],
    category: 'Live',
  },
  {
    id: 'community.docuverse',
    slug: 'docuverse',
    name: 'Docuverse',
    version: '0.7.2',
    icon: '/art/addon-icon-docs.jpg',
    permissionSlugs: ['network', 'noStorage'],
    category: 'Subtitles',
  },
];

function InstallButton({ entry }: { entry: DirectoryEntry }) {
  const { t } = useT();
  const navigate = useNavigate();
  const installed = useAddons((s) => s.installed);
  const installAddon = useAddons((s) => s.installAddon);
  const isInstalled = installed.some((a) => a.id === entry.id);

  if (isInstalled) {
    return (
      <span className="focusable inline-flex items-center gap-6 rounded-full border-[1.5px] border-cyan px-16 py-8 text-[12px] font-bold text-cyan">
        <Check size={14} strokeWidth={2.5} /> {t('marketing.store.card.installed')}
      </span>
    );
  }

  const onInstall = () => {
    if (entry.builtin) {
      // Real mutation: re-install the builtin Showcase addon.
      installAddon(SHOWCASE_ADDON);
      toast(t('marketing.store.toasts.showcaseInstalled'));
      return;
    }
    // Community addons install from a manifest URL inside the app — the
    // honest path is the Addon Manager, where permissions preview first.
    toast(t('marketing.store.toasts.communityInstall'));
    navigate('/app/addons');
  };

  return (
    <ButtonPrimary onClick={onInstall} className="px-16 py-8 text-[12px]">
      {t('marketing.store.card.install')}
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
  const { t } = useT();
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
            alt={t('marketing.store.card.iconAlt', { name: entry.name })}
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
              {t('marketing.store.card.preInstalled')}
            </span>
          )}
        </div>
        {/* row 2 — description */}
        <p className="text-caption text-muted line-clamp-2">{t(`marketing.store.entries.${entry.slug}.description`)}</p>
        {/* row 3 — metadata */}
        <div className="flex flex-wrap items-center gap-12">
          {health ? (
            <HealthDot status={health.status} latencyMs={health.latencyMs} />
          ) : (
            <span className="inline-flex items-center gap-6" title={t('marketing.store.card.notInstalledTitle')}>
              <span className="inline-block h-8 w-8 rounded-full bg-muted/40" />
              <span className="font-mono text-[11px] text-muted">{t('marketing.store.card.notInstalled')}</span>
            </span>
          )}
          <span className="text-[12px] text-muted">{t(`marketing.store.entries.${entry.slug}.scope`)}</span>
          {entry.permissionSlugs.map((p) => (
            <span
              key={p}
              className="glass-1 inline-flex items-center gap-4 rounded-md px-8 py-2 font-mono text-[11px] text-muted"
            >
              <ShieldCheck size={12} strokeWidth={1.75} className="text-cyan" />
              {t(`marketing.store.perms.${p}`)}
            </span>
          ))}
        </div>
        {/* row 4 — actions */}
        <div className="mt-auto flex items-center gap-12">
          <InstallButton entry={entry} />
          <ButtonGhost onClick={() => onPermissions(entry)}>{t('marketing.store.card.permissions')}</ButtonGhost>
        </div>
        </GlassPanel>
      </SpotlightCard>
    </motion.div>
  );
}

function Directory() {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [permsFor, setPermsFor] = useState<DirectoryEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIRECTORY.filter(
      (e) =>
        (category === 'All' || e.category === category) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          t(`marketing.store.entries.${e.slug}.description`).toLowerCase().includes(q)),
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
        <Eyebrow>{t('marketing.store.directory.eyebrow')}</Eyebrow>
        <h2 className="font-display text-display-l text-ink">{t('marketing.store.directory.title')}</h2>
      </motion.div>

      {/* filter bar */}
      <div className="glass-solid sticky top-80 z-20 flex flex-col gap-16 rounded-xl p-16 md:flex-row md:items-center">
        <label className="glass-1 flex flex-1 items-center gap-10 rounded-lg px-16 py-10">
          <Search size={16} strokeWidth={1.75} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('marketing.store.directory.searchPlaceholder')}
            aria-label={t('marketing.store.directory.searchAria')}
            className="w-full bg-transparent font-mono text-caption text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-8" role="tablist" aria-label={t('marketing.store.directory.categoriesAria')}>
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
              {t(`marketing.store.categories.${c.toLowerCase()}`)}
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
          title={t('marketing.store.empty.title')}
          caption={t('marketing.store.empty.caption')}
          action={<ButtonNeon to="/app/addons">{t('marketing.store.empty.action')}</ButtonNeon>}
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
              <h3 className="font-display text-title text-ink">{t('marketing.store.community.title')}</h3>
              <p className="max-w-[60ch] text-caption text-muted">
                {t('marketing.store.community.copy')}
              </p>
            </div>
          </div>
          <ButtonNeon to="/app/addons" className="shrink-0">
            {t('marketing.store.community.action')}
          </ButtonNeon>
        </GlassPanel>
      </motion.div>

      {/* permissions modal */}
      <Modal
        open={permsFor !== null}
        onClose={() => setPermsFor(null)}
        title={permsFor ? t('marketing.store.modal.title', { name: permsFor.name }) : undefined}
      >
        {permsFor && (
          <div className="flex flex-col gap-16">
            <p className="break-all font-mono text-[12px] text-muted">
              {permsFor.builtin
                ? t('marketing.store.modal.builtinUrl')
                : t('marketing.store.modal.manifestUrl', { id: permsFor.id })}
            </p>
            <ul className="flex flex-col gap-12">
              {permsFor.permissionSlugs.map((p) => (
                <li key={p} className="flex items-start gap-10">
                  <ShieldCheck size={16} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                  <span className="text-caption text-ink">{t(`marketing.store.perms.${p}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-caption text-muted">{t(`marketing.store.entries.${permsFor.slug}.permissionNote`)}</p>
            <div className="flex flex-wrap items-center gap-12">
              {permsFor.builtin ? (
                <ButtonPrimary
                  onClick={() => {
                    useAddons.getState().installAddon(SHOWCASE_ADDON);
                    toast(t('marketing.store.toasts.showcaseInstalled'));
                    setPermsFor(null);
                  }}
                >
                  {t('marketing.store.modal.installAnyway')}
                </ButtonPrimary>
              ) : (
                <ButtonPrimary to="/app/addons">{t('marketing.store.modal.openManager')}</ButtonPrimary>
              )}
              <ButtonGhost onClick={() => setPermsFor(null)}>{t('marketing.store.modal.cancel')}</ButtonGhost>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

/* ── S3 — Premium plan presentation ────────────────────────────────────── */

const FREE_FEATURES = ['f1', 'f2', 'f3', 'f4'] as const;
const PREMIUM_FEATURES = ['f1', 'f2', 'f3', 'f4'] as const;

function Plans() {
  const { t } = useT();
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-48 px-16 pb-96 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: OUT_EXPO }}
        className="flex flex-col items-center gap-12 text-center"
      >
        <Eyebrow>{t('marketing.store.plans.eyebrow')}</Eyebrow>
        <h2 className="font-display text-display-l text-ink">{t('marketing.store.plans.title')}</h2>
        <p className="max-w-[64ch] text-caption text-muted">
          {t('marketing.store.plans.sub')}
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
              <h3 className="font-display text-title text-ink">{t('marketing.store.plans.free.name')}</h3>
              <p className="text-caption text-muted">{t('marketing.store.plans.free.tagline')}</p>
              <p className="font-display text-display-l text-ink">$0</p>
            </div>
            <ul className="flex flex-col gap-12">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-10">
                  <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
                  <span className="text-caption text-ink">{t(`marketing.store.plans.free.${f}`)}</span>
                </li>
              ))}
            </ul>
            <ButtonNeon to="/app/onboarding" className="mt-auto w-full">
              {t('marketing.store.plans.free.cta')}
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
                  <h3 className="font-display text-title text-ink">{t('marketing.store.plans.premium.name')}</h3>
                  <span className="bg-signature rounded-full px-12 py-4 text-micro uppercase text-deep">
                    {t('marketing.store.plans.premium.badge')}
                  </span>
                </div>
                <p className="text-caption text-muted">{t('marketing.store.plans.premium.tagline')}</p>
                <p className="font-display text-display-l text-ink">
                  $4.99<span className="text-title text-muted">{t('marketing.store.plans.premium.perMonth')}</span>
                </p>
              </div>
              <ul className="flex flex-col gap-12">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-10">
                    <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
                    <span className="text-caption text-ink">{t(`marketing.store.plans.premium.${f}`)}</span>
                  </li>
                ))}
              </ul>
              <ButtonPrimary to="/subscribe" className="mt-auto w-full">
                {t('marketing.store.plans.premium.cta')}
              </ButtonPrimary>
              <p className="text-center text-[12px] text-muted">
                {t('marketing.store.plans.premium.note')}
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
  const { t } = useT();
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
              <h2 className="font-display text-title text-ink">{t('marketing.store.dev.title')}</h2>
            </div>
            <p className="text-caption text-muted">
              {t('marketing.store.dev.copy')}
            </p>
          </div>
          <ButtonGhost to="/support" className="relative shrink-0">
            {t('marketing.store.dev.cta')}
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
