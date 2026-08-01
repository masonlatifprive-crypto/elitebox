/**
 * Onboarding — `/app/onboarding` (onboarding.md).
 * First-run ritual: brand immersion → create profile → addon starter pack → /app.
 * Bare immersive flow: progress dots, spring.cinematic step transitions,
 * skippable at any point. Progress (current step) is persisted so re-entering
 * resumes where the user left off.
 *
 * Named exports shared with Profiles.tsx (same scope pair):
 *   AVATARS, hashPin, AvatarOrbGrid, PinEntry, SilverButton, TransitionVeil, ProfileForm
 */
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Activity,
  Check,
  CheckCircle2,
  Delete,
  Eye,
  Puzzle,
  Sparkles,
  Tv,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AddonInfo } from '@/lib/types';
import { switchProfile, useAddons, useProfiles, useSettings } from '@/lib/store';
import { LogoMark } from '@/components/Logo';
import MovieWall from '@/components/MovieWall';
import { ButtonGhost, GlassPanel, spring, toast } from '@/components/ui-elite';
import { usePublicCatalog } from '@/lib/usePublicCatalog';
import { useT } from '@/i18n';

/* ── shared profile helpers (also used by Profiles.tsx) ────────────────── */

export const AVATARS = ['nova', 'ember', 'frost', 'pulse', 'drift', 'quark', 'halo', 'zen'].map(
  (n) => `/art/avatar-${n}.jpg`,
);

export const MAX_PROFILES = 6;

/**
 * Simple djb2 hash for local PIN storage. Honest local security: keeps casual
 * snoops out of the raw value, never transmitted anywhere.
 */
export function hashPin(pin: string): string {
  const s = `elitebox.pin.${pin}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

export function newProfileId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ── shared building blocks ────────────────────────────────────────────── */

/** Silver primary pill (ui-elite ButtonPrimary + disabled support). */
export function SilverButton({
  onClick,
  disabled,
  className,
  children,
  type = 'button',
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'focusable inline-flex select-none items-center justify-center gap-8 rounded-full px-24 py-12 font-sans text-caption font-bold',
        'bg-chrome text-deep shadow-btn-glow transition-[filter,box-shadow] duration-150 hover:brightness-110 active:scale-[0.97] cursor-pointer',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Avatar orb grid — 8 glass-orb portraits, selected gets Focus glow + scale. */
export function AvatarOrbGrid({
  value,
  onChange,
  orbSize = 64,
  className,
}: {
  value: string;
  onChange: (avatar: string) => void;
  orbSize?: number;
  className?: string;
}) {
  const { t } = useT();
  return (
    <div className={cn('grid grid-cols-4 justify-items-center gap-16', className)} role="radiogroup" aria-label={t('app.onboarding.chooseAvatar')}>
      {AVATARS.map((src, i) => {
        const selected = src === value;
        return (
          <motion.button
            key={src}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t('app.onboarding.avatarAria', { n: i + 1 })}
            onClick={() => onChange(src)}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: selected ? 1.1 : 1 }}
            transition={{ ...spring.snappy, delay: i * 0.05 }}
            whileHover={{ scale: selected ? 1.1 : 1.06 }}
            className={cn(
              'focusable cursor-pointer rounded-full p-2',
              selected && 'shadow-focus-glow',
            )}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className={cn(
                'rounded-full object-cover ring-1 transition-[box-shadow,border-color] duration-150',
                selected ? 'ring-2 ring-cyan' : 'ring-white/10',
              )}
              style={{ width: orbSize, height: orbSize }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

export type PinStatus = 'idle' | 'error' | 'ok';

/**
 * 4-digit PIN pad: glass numeric keys, dots fill cyan as typed. Wrong entries
 * shake + turn error for 600ms (status controlled by the parent). Physical
 * digit keys work too (ignored while typing in text inputs).
 */
export function PinEntry({
  status,
  onComplete,
  className,
}: {
  status: PinStatus;
  onComplete: (pin: string) => void;
  className?: string;
}) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const [digits, setDigits] = useState('');
  const doneRef = useRef(false);

  useEffect(() => {
    if (digits.length === 4 && !doneRef.current) {
      doneRef.current = true;
      onComplete(digits);
    } else if (digits.length < 4) {
      doneRef.current = false;
    }
  }, [digits, onComplete]);

  // Clear shortly after an error so the user can retry.
  useEffect(() => {
    if (status !== 'error') return;
    const t = window.setTimeout(() => setDigits(''), 600);
    return () => window.clearTimeout(t);
  }, [status]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (/^[0-9]$/.test(e.key)) {
        setDigits((prev) => (prev.length >= 4 ? prev : prev + e.key));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setDigits((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const push = (d: string) => setDigits((prev) => (prev.length >= 4 ? prev : prev + d));
  const filled = status === 'idle' ? digits.length : 4;

  return (
    <div className={cn('flex flex-col items-center gap-24', className)}>
      {/* dot slots */}
      <motion.div
        className="flex items-center gap-16"
        animate={status === 'error' && !reduceMotion ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ scale: i < filled ? 1 : 0.85 }}
            transition={spring.snappy}
            className={cn(
              'h-14 w-14 rounded-full border transition-colors duration-150',
              status === 'error'
                ? 'border-error bg-error shadow-[0_0_10px_rgba(255,77,109,.6)]'
                : i < filled
                  ? 'border-cyan bg-cyan shadow-[0_0_10px_rgba(124,217,236,.6)]'
                  : 'border-white/20 bg-white/[.04]',
            )}
          />
        ))}
      </motion.div>

      {/* numeric keys */}
      <div className="grid grid-cols-3 gap-12">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => push(d)}
            className="focusable glass-1 flex h-56 w-56 cursor-pointer items-center justify-center rounded-full font-display text-body-l text-ink hover:bg-white/[.08] active:scale-[0.94]"
          >
            {d}
          </button>
        ))}
        <span aria-hidden className="h-56 w-56" />
        <button
          type="button"
          onClick={() => push('0')}
          className="focusable glass-1 flex h-56 w-56 cursor-pointer items-center justify-center rounded-full font-display text-body-l text-ink hover:bg-white/[.08] active:scale-[0.94]"
        >
          0
        </button>
        <button
          type="button"
          aria-label={t('app.onboarding.deleteDigitAria')}
          onClick={() => setDigits((prev) => prev.slice(0, -1))}
          className="focusable glass-1 flex h-56 w-56 cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink hover:bg-white/[.08] active:scale-[0.94]"
        >
          <Delete size={20} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/** Full-screen crossfade veil used when transitioning into /app. */
export function TransitionVeil({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-deep"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <LogoMark height={72} glow />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── profile create form (onboarding Step 2 + Profiles "New profile") ──── */

export interface PendingProfile {
  name: string;
  avatar: string;
  pin?: string;
}

function PinToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { t } = useT();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="focusable flex cursor-pointer items-center gap-12"
    >
      <span
        className={cn(
          'relative h-24 w-44 rounded-full border transition-colors duration-150',
          checked ? 'border-cyan/60 bg-[rgba(124,217,236,.18)]' : 'border-white/15 bg-white/[.06]',
        )}
      >
        <motion.span
          layout
          transition={spring.snappy}
          className={cn(
            'absolute top-2 h-18 w-18 rounded-full',
            checked ? 'right-2 bg-cyan shadow-[0_0_10px_rgba(124,217,236,.6)]' : 'left-2 bg-muted',
          )}
        />
      </span>
      <span className="text-caption text-ink">{t('app.onboarding.lockWithPin')}</span>
    </button>
  );
}

export function ProfileForm({
  submitLabel,
  onSubmit,
  secondary,
  autoFocus = true,
}: {
  submitLabel: string;
  onSubmit: (p: PendingProfile) => void;
  secondary?: ReactNode;
  autoFocus?: boolean;
}) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  const nameValid = name.trim().length > 0;
  const pinValid = !pinEnabled || pin.length === 4;
  const canSubmit = nameValid && pinValid;

  const reject = () => {
    if (!reduceMotion) shake.start({ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.4 } });
    inputRef.current?.focus();
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!nameValid) {
      reject();
      return;
    }
    if (!pinValid) return;
    onSubmit({
      name: name.trim().slice(0, 20),
      avatar,
      pin: pinEnabled && pin ? hashPin(pin) : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-24">
      {/* live preview */}
      <div className="flex items-center gap-16">
        <img
          src={avatar}
          alt=""
          draggable={false}
          className="h-56 w-56 rounded-full object-cover ring-2 ring-cyan/60 shadow-focus-glow"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate font-display text-title text-ink">{name.trim() || t('app.onboarding.yourName')}</p>
          <p className="text-micro uppercase text-muted">{t('app.onboarding.profilePreview')}</p>
        </div>
      </div>

      {/* name input */}
      <motion.div animate={shake}>
        <label htmlFor="profile-name" className="mb-8 block text-micro uppercase text-muted">
          {t('app.onboarding.profileName')}
        </label>
        <input
          id="profile-name"
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          maxLength={20}
          autoFocus={autoFocus}
          placeholder={t('app.onboarding.namePlaceholder')}
          autoComplete="off"
          className="focusable glass-1 w-full rounded-lg px-16 py-12 text-body-l text-ink placeholder:text-muted/60 focus:border-cyan/50 focus:outline-none"
        />
      </motion.div>

      {/* avatar grid */}
      <div>
        <p className="mb-12 text-micro uppercase text-muted">{t('app.onboarding.pickAvatar')}</p>
        <AvatarOrbGrid value={avatar} onChange={setAvatar} />
      </div>

      {/* optional PIN */}
      <div className="flex flex-col gap-16">
        <PinToggle
          checked={pinEnabled}
          onChange={(v) => {
            setPinEnabled(v);
            if (!v) setPin('');
          }}
        />
        <AnimatePresence initial={false}>
          {pinEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.smooth}
              className="overflow-hidden"
            >
              {pin ? (
                <div className="flex items-center justify-center gap-16 py-8">
                  <span className="flex items-center gap-8 text-caption text-cyan">
                    <CheckCircle2 size={16} strokeWidth={1.75} /> {t('app.profiles.toastPinSaved')}
                  </span>
                  <ButtonGhost onClick={() => setPin('')}>{t('app.profiles.changePin')}</ButtonGhost>
                </div>
              ) : (
                <PinEntry status="idle" onComplete={setPin} />
              )}
              <p className="mt-8 text-center text-micro uppercase text-muted">
                {t('app.onboarding.pinStoredNote')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-16">
        <SilverButton type="submit" disabled={!canSubmit} className="flex-1">
          {submitLabel}
        </SilverButton>
        {secondary}
      </div>
    </form>
  );
}

/* ── onboarding page ───────────────────────────────────────────────────── */

const STEP_KEY = 'elitebox.v1.onboarding.step';

const FEATURES = [
  { icon: Puzzle, labelKey: 'app.onboarding.featAddons' },
  { icon: Activity, labelKey: 'app.onboarding.featHealth' },
  { icon: Users, labelKey: 'app.onboarding.featProfiles' },
  { icon: Tv, labelKey: 'app.onboarding.featTv' },
] as const;

const SUGGESTED_ADDONS: AddonInfo[] = [
  {
    id: 'elitebox.cinema-catalog',
    name: 'Cinema Catalog',
    version: '1.0.0',
    description: 'Community-maintained catalog of open and public-domain films.',
    icon: '/art/addon-icon-cinema.jpg',
    resources: ['catalog', 'meta'],
  },
  {
    id: 'elitebox.live-waves',
    name: 'Live Waves',
    version: '1.0.0',
    description: 'Free-to-air live channel index with health-checked streams.',
    icon: '/art/addon-icon-live.jpg',
    resources: ['catalog', 'stream'],
  },
];

function loadStep(): number {
  try {
    const raw = localStorage.getItem(STEP_KEY);
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 2) : 0;
  } catch {
    return 0;
  }
}

/** Character-level split headline (onboarding.md Step 1 animation). */
function SplitHeadline({ text, className }: { text: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <h1 aria-label={text} className={className}>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.15, delay: i * 0.01 } : { ...spring.cinematic, delay: 0.15 + i * 0.025 }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </h1>
  );
}

export default function Onboarding() {
  const { t } = useT();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  /* Real catalog art for the wall; showcase art only while loading/failed. */
  const { items: wallItems } = usePublicCatalog();
  const profiles = useProfiles((s) => s.profiles);
  const onboarded = useSettings((s) => s.onboarded);
  const installedAddons = useAddons((s) => s.installed);
  const installAddon = useAddons((s) => s.installAddon);

  const [step, setStep] = useState(loadStep);
  const [pending, setPending] = useState<PendingProfile | null>(null);
  const [veil, setVeil] = useState(false);

  // Persist progress so re-entering resumes at the unfinished step.
  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY, String(step));
    } catch {
      /* storage unavailable — onboarding still works in-memory */
    }
  }, [step]);

  const finish = () => {
    if (pending) {
      const id = newProfileId();
      useProfiles.getState().addProfile({ id, name: pending.name, avatar: pending.avatar, pin: pending.pin });
      switchProfile(id);
    }
    useSettings.getState().setOnboarded(true);
    try {
      localStorage.removeItem(STEP_KEY);
    } catch {
      /* ignore */
    }
    if (reduceMotion) {
      navigate('/app');
      return;
    }
    setVeil(true);
    window.setTimeout(() => navigate('/app'), 750);
  };

  const addSuggested = (info: AddonInfo) => {
    installAddon(info);
    toast(t('app.onboarding.toastAddonAdded'));
  };

  // Returning users with ≥1 profile never see onboarding again.
  if (onboarded && profiles.length > 0) return <Navigate to="/app" replace />;

  const stepMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, x: 60 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -60 },
        transition: spring.cinematic,
      };

  const stagger: Variants = {
    animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const rise: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } } }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0, transition: spring.cinematic },
      };

  return (
    <div className="relative flex min-h-[80dvh] flex-col items-center justify-center py-32">
      {/* skip — always available */}
      <div className="absolute right-0 top-0">
        <ButtonGhost onClick={finish}>{t('app.onboarding.skip')}</ButtonGhost>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section
            key="step-welcome"
            {...stepMotion}
            className="flex w-full max-w-2xl flex-col items-center gap-24 px-16 text-center"
          >
            <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col items-center gap-24">
              <motion.div variants={rise}>
                <LogoMark height={44} glow />
              </motion.div>

              <motion.div
                className="glass-2 rounded-2xl p-16 shadow-aura-purple"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.15 } : spring.cinematic}
              >
                <div
                  className={cn(
                    'relative h-[220px] w-full max-w-[420px] overflow-hidden rounded-xl md:h-[260px] md:max-w-[520px]',
                    !reduceMotion && 'animate-float-slow',
                  )}
                >
                  <MovieWall items={wallItems.length ? wallItems : undefined} />
                </div>
              </motion.div>

              <SplitHeadline
                text={t('app.onboarding.headline')}
                className="text-chrome font-display text-display-l md:text-display-xl"
              />

              <motion.p variants={rise} className="max-w-md text-body-l text-muted">
                {t('app.onboarding.sub')}
              </motion.p>

              <motion.div variants={rise} className="flex flex-wrap items-center justify-center gap-12">
                {FEATURES.map(({ icon: Icon, labelKey }) => (
                  <span key={labelKey} className="glass-1 inline-flex items-center gap-8 rounded-full px-16 py-8 text-caption text-ink">
                    <Icon size={16} strokeWidth={1.75} className="text-cyan" />
                    {t(labelKey)}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={rise}>
                <SilverButton onClick={() => setStep(1)} className="px-32 py-14 text-body-l">
                  {t('app.onboarding.begin')}
                </SilverButton>
              </motion.div>
            </motion.div>
          </motion.section>
        )}

        {step === 1 && (
          <motion.section key="step-profile" {...stepMotion} className="w-full max-w-lg px-16">
            <GlassPanel level={2} className="p-24 md:p-32">
              <div className="mb-24 flex flex-col gap-8">
                <h2 className="font-display text-title text-ink">{t('app.profiles.whosWatching')}</h2>
                <p className="text-caption text-muted">
                  {t('app.onboarding.profileStepCaption')}
                </p>
              </div>
              <ProfileForm
                submitLabel={t('app.profiles.createProfile')}
                onSubmit={(p) => {
                  setPending(p);
                  setStep(2);
                }}
                secondary={
                  <ButtonGhost onClick={() => setStep(2)}>{t('app.onboarding.addAnotherLater')}</ButtonGhost>
                }
              />
            </GlassPanel>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            key="step-addons"
            {...stepMotion}
            className="flex w-full max-w-xl flex-col gap-24 px-16"
          >
            <div className="flex flex-col gap-8 text-center">
              <h2 className="font-display text-display-l text-ink">{t('app.onboarding.addonsTitle')}</h2>
              <p className="text-caption text-muted">
                {t('app.onboarding.addonsCaption')}
              </p>
            </div>

            {/* pre-installed showcase addon */}
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0.15 } : spring.cinematic}
            >
              <GlassPanel level={2} className="flex items-center gap-16 p-16">
                <img
                  src="/art/addon-icon-showcase.jpg"
                  alt=""
                  draggable={false}
                  className="h-56 w-56 rounded-xl object-cover ring-1 ring-white/10"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <div className="flex items-center gap-8">
                    <p className="truncate font-display text-caption font-bold text-ink">
                      Elitebox Showcase
                    </p>
                    <motion.span
                      initial={reduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                      animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                      transition={reduceMotion ? { duration: 0.15, delay: 0.1 } : { ...spring.snappy, delay: 0.3 }}
                      className="text-cyan"
                    >
                      <CheckCircle2 size={18} strokeWidth={1.75} />
                    </motion.span>
                  </div>
                  <p className="text-caption text-muted">{t('app.onboarding.showcaseBlurb')}</p>
                </div>
                <span className="glass-1 shrink-0 rounded-md px-8 py-2 text-micro uppercase text-cyan">
                  {t('app.addons.installed')}
                </span>
              </GlassPanel>
            </motion.div>

            {/* suggested addons */}
            <div className="flex flex-col gap-12">
              {SUGGESTED_ADDONS.map((info, i) => {
                const added = installedAddons.some((a) => a.id === info.id);
                return (
                  <motion.div
                    key={info.id}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0.15, delay: i * 0.1 } : { ...spring.cinematic, delay: 0.15 + i * 0.1 }}
                  >
                    <GlassPanel level={1} className="flex items-center gap-16 p-16">
                      <img
                        src={info.icon}
                        alt=""
                        draggable={false}
                        className="h-48 w-48 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="truncate text-caption font-bold text-ink">{info.name}</p>
                        <p className="line-clamp-2 text-micro text-muted normal-case tracking-normal">
                          {info.description}
                        </p>
                      </div>
                      {added ? (
                        <span className="inline-flex shrink-0 items-center gap-6 rounded-full border-[1.5px] border-cyan/50 px-16 py-8 text-caption font-semibold text-cyan">
                          <Check size={14} strokeWidth={2.5} /> {t('app.onboarding.added')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addSuggested(info)}
                          className="focusable shrink-0 cursor-pointer rounded-full border-[1.5px] border-cyan px-16 py-8 text-caption font-bold text-cyan transition-[background,box-shadow] duration-150 hover:bg-[rgba(124,217,236,.08)] hover:shadow-glow-neon active:scale-[0.97]"
                        >
                          {t('app.onboarding.add')}
                        </button>
                      )}
                    </GlassPanel>
                  </motion.div>
                );
              })}
            </div>

            {/* what you can do */}
            <GlassPanel level={1} className="flex flex-col gap-12 p-16">
              <p className="text-micro uppercase text-muted">{t('app.onboarding.whatYouCanDo')}</p>
              <div className="flex items-start gap-12">
                <Eye size={18} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                <p className="text-caption text-ink">
                  {t('app.onboarding.freeBrowsing')}
                </p>
              </div>
              <div className="flex items-start gap-12">
                <Sparkles size={18} strokeWidth={1.75} className="mt-2 shrink-0 text-highlight" />
                <p className="text-caption text-ink">
                  {t('app.onboarding.premiumNote')}{' '}
                  <a href="/subscribe" className="focusable text-cyan underline-offset-2 hover:underline">
                    {t('app.onboarding.subscribeLink')}
                  </a>
                  .
                </p>
              </div>
              <div className="flex items-start gap-12">
                <Tv size={18} strokeWidth={1.75} className="mt-2 shrink-0 text-cyan" />
                <p className="text-caption text-ink">
                  {t('app.onboarding.tvNote')}
                </p>
              </div>
            </GlassPanel>

            {/* enter */}
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0.15, delay: 0.2 } : { ...spring.snappy, delay: 0.35 }}
              className="flex justify-center"
            >
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        boxShadow: [
                          '0 4px 20px rgba(192,192,192,.25)',
                          '0 4px 32px rgba(124,217,236,.45)',
                          '0 4px 20px rgba(192,192,192,.25)',
                        ],
                      }
                }
                transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full"
              >
                <SilverButton onClick={finish} className="px-40 py-16 text-body-l">
                  {t('app.onboarding.enter')}
                </SilverButton>
              </motion.div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* progress dots */}
      <div className="mt-48 flex items-center gap-12" aria-label={t('app.onboarding.stepAria', { step: step + 1 })}>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={t('app.onboarding.goToStepAria', { step: i + 1 })}
            aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}
            className="focusable cursor-pointer rounded-full p-4"
          >
            <motion.span
              layout
              transition={spring.snappy}
              className={cn(
                'block h-8 rounded-full',
                i === step ? 'w-24 bg-cyan shadow-[0_0_10px_rgba(124,217,236,.6)]' : 'w-8 bg-white/20',
              )}
            />
          </button>
        ))}
      </div>

      <TransitionVeil show={veil} />
    </div>
  );
}
