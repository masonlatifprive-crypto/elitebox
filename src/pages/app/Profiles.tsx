/**
 * Profiles — `/app/profiles` (profiles.md).
 * "Who's watching?" gate + manage mode in one page:
 *  - Gate: orb tiles (hover/focus glow + scale), PIN pad modal for locked
 *    profiles (shake on wrong, dots sweep on right), add-profile tile (max 6).
 *  - Manage: rename inline, change avatar (orb grid modal), set/change/remove
 *    PIN, delete with type-name confirm (last profile cannot be deleted).
 * PINs are stored as a simple local hash — honest on-device security.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Check,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { scopedKey, switchProfile, useProfiles } from '@/lib/store';
import type { Profile } from '@/lib/store';
import { LogoMark } from '@/components/Logo';
import {
  ButtonDanger,
  ButtonGhost,
  ButtonNeon,
  EmptyState,
  GlassPanel,
  Modal,
  spring,
  toast,
} from '@/components/ui-elite';
import {
  AvatarOrbGrid,
  hashPin,
  MAX_PROFILES,
  newProfileId,
  PinEntry,
  ProfileForm,
  SilverButton,
  TransitionVeil,
} from './Onboarding';
import type { PinStatus } from './Onboarding';

/* ── per-profile stats, read straight from the scoped persistence layer ── */

function profileStats(id: string): { library: number; inProgress: number } {
  try {
    const raw = localStorage.getItem(scopedKey('library', id));
    if (!raw) return { library: 0, inProgress: 0 };
    const parsed = JSON.parse(raw) as {
      state?: { watchlist?: string[]; favorites?: string[]; continueWatching?: unknown[] };
    };
    const s = parsed.state ?? {};
    const library = new Set([...(s.watchlist ?? []), ...(s.favorites ?? [])]).size;
    return { library, inProgress: s.continueWatching?.length ?? 0 };
  } catch {
    return { library: 0, inProgress: 0 };
  }
}

function statsLine(id: string): string {
  const { library, inProgress } = profileStats(id);
  if (library === 0 && inProgress === 0) return 'Nothing watched yet — press play on something great.';
  const parts: string[] = [];
  if (library > 0) parts.push(`${library} in library`);
  if (inProgress > 0) parts.push(`${inProgress} in progress`);
  return parts.join(' · ');
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function Profiles() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const profiles = useProfiles((s) => s.profiles);
  const activeProfileId = useProfiles((s) => s.activeProfileId);

  const [mode, setMode] = useState<'gate' | 'manage'>('gate');
  const [veil, setVeil] = useState(false);

  // PIN gate modal
  const [pinTarget, setPinTarget] = useState<Profile | null>(null);
  const [pinStatus, setPinStatus] = useState<PinStatus>('idle');
  const [pinRecovery, setPinRecovery] = useState(false);

  // manage modals
  const [addOpen, setAddOpen] = useState(false);
  const [avatarFor, setAvatarFor] = useState<Profile | null>(null);
  const [pinFor, setPinFor] = useState<Profile | null>(null);
  const [pinSetStatus, setPinSetStatus] = useState<PinStatus>('idle');
  const [deleteFor, setDeleteFor] = useState<Profile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const enter = (p: Profile) => {
    switchProfile(p.id);
    if (reduceMotion) {
      navigate('/app');
      return;
    }
    setVeil(true);
    window.setTimeout(() => navigate('/app'), 600);
  };

  const pick = (p: Profile) => {
    if (p.pin) {
      setPinTarget(p);
      setPinStatus('idle');
      setPinRecovery(false);
    } else {
      enter(p);
    }
  };

  const verifyPin = (pin: string) => {
    if (!pinTarget?.pin) return;
    if (hashPin(pin) === pinTarget.pin) {
      setPinStatus('ok');
      const target = pinTarget;
      window.setTimeout(() => {
        setPinTarget(null);
        setPinStatus('idle');
        enter(target);
      }, 350);
    } else {
      setPinStatus('error');
      window.setTimeout(() => setPinStatus('idle'), 650);
    }
  };

  const resetPin = () => {
    if (!pinTarget) return;
    useProfiles.getState().updateProfile(pinTarget.id, { pin: undefined });
    toast(`PIN reset — “${pinTarget.name}” is unlocked.`);
    setPinTarget(null);
    setPinRecovery(false);
    setPinStatus('idle');
  };

  const commitRename = () => {
    if (!renamingId) return;
    const name = renameValue.trim().slice(0, 20);
    if (name) {
      useProfiles.getState().updateProfile(renamingId, { name });
      toast('Profile renamed.');
    }
    setRenamingId(null);
  };

  const confirmDelete = () => {
    if (!deleteFor || profiles.length <= 1) return;
    if (deleteConfirm.trim() !== deleteFor.name) return;
    const wasActive = deleteFor.id === activeProfileId;
    useProfiles.getState().removeProfile(deleteFor.id);
    if (wasActive) switchProfile(null);
    toast(`Profile “${deleteFor.name}” deleted.`);
    setDeleteFor(null);
    setDeleteConfirm('');
  };

  const viewMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -24 },
        transition: spring.smooth,
      };

  const tileStagger: Variants = {
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const tilePop: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } } }
    : {
        initial: { opacity: 0, scale: 0.7 },
        animate: { opacity: 1, scale: 1, transition: spring.snappy },
      };

  const titleWords = "Who's watching?".split(' ');

  return (
    <div className="relative min-h-[70dvh] py-24">
      <AnimatePresence mode="wait">
        {mode === 'gate' ? (
          <motion.section
            key="gate"
            {...viewMotion}
            className="flex flex-col items-center gap-32 pt-32 text-center"
          >
            <LogoMark height={44} glow />

            <h1
              aria-label="Who's watching?"
              className="text-chrome font-display text-display-l md:text-display-xl"
            >
              {titleWords.map((w, i) => (
                <motion.span
                  key={w}
                  aria-hidden
                  className="inline-block"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0.15, delay: i * 0.05 } : { ...spring.cinematic, delay: i * 0.09 }}
                >
                  {w}
                  {i < titleWords.length - 1 ? ' ' : ''}
                </motion.span>
              ))}
            </h1>

            <motion.div
              variants={tileStagger}
              initial="initial"
              animate="animate"
              className="flex max-w-3xl flex-wrap items-start justify-center gap-24 px-16 md:gap-32"
            >
              {profiles.map((p) => (
                <motion.button
                  key={p.id}
                  variants={tilePop}
                  type="button"
                  onClick={() => pick(p)}
                  onKeyDown={(e) => {
                    if (p.pin && /^[0-9]$/.test(e.key)) pick(p);
                  }}
                  className="focusable group flex w-104 cursor-pointer flex-col items-center gap-12 rounded-xl p-8 xl:w-128"
                  aria-label={p.pin ? `${p.name} (PIN locked)` : p.name}
                >
                  <motion.span
                    whileHover={{ scale: 1.08 }}
                    whileFocus={{ scale: 1.08 }}
                    transition={spring.smooth}
                    className="relative rounded-full group-focus-visible:shadow-focus-glow"
                  >
                    <img
                      src={p.avatar}
                      alt=""
                      draggable={false}
                      className="h-72 w-72 rounded-full object-cover ring-1 ring-white/10 md:h-96 md:w-96 xl:h-112 xl:w-112"
                    />
                    {p.pin && (
                      <span className="glass-2 absolute -bottom-2 -right-2 flex h-28 w-28 items-center justify-center rounded-full">
                        <Lock size={14} strokeWidth={1.75} className="text-cyan" />
                      </span>
                    )}
                  </motion.span>
                  <span className="max-w-full truncate text-caption text-muted transition-colors duration-150 group-hover:text-ink group-focus-visible:text-ink">
                    {p.name}
                  </span>
                </motion.button>
              ))}

              {profiles.length < MAX_PROFILES && (
                <motion.button
                  variants={tilePop}
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="focusable group flex w-104 cursor-pointer flex-col items-center gap-12 rounded-xl p-8 xl:w-128"
                  aria-label="Add profile"
                >
                  <motion.span
                    whileHover={{ scale: 1.08 }}
                    whileFocus={{ scale: 1.08 }}
                    transition={spring.smooth}
                    className="flex h-72 w-72 items-center justify-center rounded-full border-2 border-dashed border-white/20 text-muted transition-colors duration-150 group-hover:border-cyan/60 group-hover:text-cyan group-focus-visible:border-cyan group-focus-visible:text-cyan group-focus-visible:shadow-focus-glow md:h-96 md:w-96 xl:h-112 xl:w-112"
                  >
                    <Plus size={28} strokeWidth={1.75} />
                  </motion.span>
                  <span className="text-caption text-muted transition-colors duration-150 group-hover:text-ink">
                    Add profile
                  </span>
                </motion.button>
              )}
            </motion.div>

            <p className="max-w-[52ch] px-16 text-micro uppercase text-muted">
              Libraries, progress and settings stay separate per profile.
            </p>

            <ButtonGhost onClick={() => setMode('manage')}>
              <SlidersHorizontal size={16} strokeWidth={1.75} />
              Manage profiles
            </ButtonGhost>
          </motion.section>
        ) : (
          <motion.section key="manage" {...viewMotion} className="mx-auto flex max-w-2xl flex-col gap-24">
            <div className="flex flex-wrap items-center justify-between gap-16">
              <div className="flex flex-col gap-4">
                <h1 className="font-display text-display-l text-ink md:text-display-xl">Profiles</h1>
                <p className="text-caption text-muted">
                  {profiles.length <= 1
                    ? 'One universe so far. Add profiles for family, moods or marathons.'
                    : `${profiles.length} of ${MAX_PROFILES} profiles in use.`}
                </p>
              </div>
              <div className="flex items-center gap-12">
                <ButtonGhost onClick={() => setMode('gate')}>Back to gate</ButtonGhost>
                <SilverButton
                  onClick={() => setAddOpen(true)}
                  disabled={profiles.length >= MAX_PROFILES}
                >
                  <Plus size={16} strokeWidth={2} />
                  New profile
                </SilverButton>
              </div>
            </div>

            {profiles.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No profiles yet"
                caption="Create one to start your own library, progress and settings universe."
                action={<SilverButton onClick={() => setAddOpen(true)}>New profile</SilverButton>}
                className="py-48"
              />
            ) : (
              <motion.ul
                variants={tileStagger}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-16"
              >
                {profiles.map((p) => (
                  <motion.li
                    key={p.id}
                    variants={reduceMotion ? tilePop : {
                      initial: { opacity: 0, y: 24 },
                      animate: { opacity: 1, y: 0, transition: spring.snappy },
                    }}
                  >
                    <GlassPanel level={2} className="flex flex-wrap items-center gap-16 p-16">
                      <img
                        src={p.avatar}
                        alt=""
                        draggable={false}
                        className="h-56 w-56 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-4">
                        {renamingId === p.id ? (
                          <form
                            className="flex items-center gap-8"
                            onSubmit={(e) => {
                              e.preventDefault();
                              commitRename();
                            }}
                          >
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value.slice(0, 20))}
                              maxLength={20}
                              autoFocus
                              aria-label="Profile name"
                              className="glass-1 w-full max-w-[200px] rounded-md px-12 py-6 text-caption text-ink focus:border-cyan/50 focus:outline-none"
                            />
                            <button
                              type="submit"
                              aria-label="Save name"
                              className="focusable cursor-pointer rounded-full p-6 text-cyan hover:bg-white/[.06]"
                            >
                              <Check size={16} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              aria-label="Cancel rename"
                              onClick={() => setRenamingId(null)}
                              className="focusable cursor-pointer rounded-full p-6 text-muted hover:text-ink hover:bg-white/[.06]"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-8">
                            <p className="truncate font-display text-title text-ink">{p.name}</p>
                            {p.id === activeProfileId && (
                              <span className="glass-1 rounded-md px-8 py-2 text-micro uppercase text-cyan">
                                Active
                              </span>
                            )}
                            {p.pin && (
                              <span className="glass-1 inline-flex items-center gap-4 rounded-md px-8 py-2 text-micro uppercase text-muted">
                                <Lock size={10} strokeWidth={2} /> Locked
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-caption text-muted">{statsLine(p.id)}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-8">
                        <ButtonNeon onClick={() => pick(p)} className="px-16 py-8">
                          Switch
                        </ButtonNeon>
                        <button
                          type="button"
                          aria-label={`Rename ${p.name}`}
                          onClick={() => {
                            setRenamingId(p.id);
                            setRenameValue(p.name);
                          }}
                          className="focusable cursor-pointer rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06]"
                        >
                          <Pencil size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Change avatar for ${p.name}`}
                          onClick={() => setAvatarFor(p)}
                          className="focusable cursor-pointer rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06]"
                        >
                          <ImageIcon size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          aria-label={p.pin ? `Change or remove PIN for ${p.name}` : `Set a PIN for ${p.name}`}
                          onClick={() => {
                            setPinFor(p);
                            setPinSetStatus('idle');
                          }}
                          className="focusable cursor-pointer rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06]"
                        >
                          {p.pin ? <Lock size={16} strokeWidth={1.75} /> : <LockOpen size={16} strokeWidth={1.75} />}
                        </button>
                        {profiles.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Delete ${p.name}`}
                            onClick={() => {
                              setDeleteFor(p);
                              setDeleteConfirm('');
                            }}
                            className="focusable cursor-pointer rounded-full p-8 text-error/80 hover:text-error hover:bg-[rgba(255,77,109,.08)]"
                          >
                            <Trash2 size={16} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    </GlassPanel>
                  </motion.li>
                ))}
              </motion.ul>
            )}

            <p className="text-center text-micro uppercase text-muted">
              Each profile has its own library, continue watching and settings.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── PIN gate modal ── */}
      <Modal
        open={pinTarget !== null}
        onClose={() => {
          setPinTarget(null);
          setPinRecovery(false);
          setPinStatus('idle');
        }}
        title={pinRecovery ? 'Reset PIN' : pinTarget ? `Enter PIN for ${pinTarget.name}` : undefined}
        className="max-w-sm"
      >
        {pinTarget && !pinRecovery && (
          <div className="flex flex-col items-center gap-24">
            <motion.img
              src={pinTarget.avatar}
              alt=""
              draggable={false}
              initial={false}
              animate={{ scale: 1.15 }}
              transition={spring.smooth}
              className={cn(
                'h-72 w-72 rounded-full object-cover ring-2',
                pinStatus === 'ok' ? 'ring-cyan shadow-focus-glow' : 'ring-white/15',
              )}
            />
            <PinEntry status={pinStatus} onComplete={verifyPin} />
            <p className="text-center text-micro uppercase text-muted">
              Stored on this device only, with a simple hash — keeps curious eyes out, not
              determined attackers.
            </p>
            <ButtonGhost onClick={() => setPinRecovery(true)}>Forgot PIN?</ButtonGhost>
          </div>
        )}
        {pinTarget && pinRecovery && (
          <div className="flex flex-col items-center gap-16 text-center">
            <p className="text-caption text-muted">
              Reset clears this profile's PIN only. Library, progress and settings for “
              {pinTarget.name}” stay exactly as they are.
            </p>
            <div className="flex items-center gap-12">
              <ButtonGhost onClick={() => setPinRecovery(false)}>Back</ButtonGhost>
              <ButtonDanger onClick={resetPin}>Reset PIN</ButtonDanger>
            </div>
          </div>
        )}
      </Modal>

      {/* ── add profile modal ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New profile" className="max-w-lg">
        <ProfileForm
          submitLabel="Create profile"
          autoFocus={false}
          onSubmit={(pending) => {
            useProfiles.getState().addProfile({
              id: newProfileId(),
              name: pending.name,
              avatar: pending.avatar,
              pin: pending.pin,
            });
            toast(`Profile “${pending.name}” created.`);
            setAddOpen(false);
          }}
        />
      </Modal>

      {/* ── change avatar modal ── */}
      <Modal
        open={avatarFor !== null}
        onClose={() => setAvatarFor(null)}
        title={avatarFor ? `Avatar for ${avatarFor.name}` : undefined}
        className="max-w-md"
      >
        {avatarFor && (
          <AvatarOrbGrid
            value={avatarFor.avatar}
            onChange={(avatar) => {
              useProfiles.getState().updateProfile(avatarFor.id, { avatar });
              toast('Avatar updated.');
              setAvatarFor(null);
            }}
          />
        )}
      </Modal>

      {/* ── set / change / remove PIN modal ── */}
      <Modal
        open={pinFor !== null}
        onClose={() => setPinFor(null)}
        title={pinFor?.pin ? 'Change PIN' : 'Set a PIN'}
        className="max-w-sm"
      >
        {pinFor && (
          <div className="flex flex-col items-center gap-24">
            <p className="text-center text-caption text-muted">
              {pinFor.pin
                ? `Enter a new 4-digit PIN for “${pinFor.name}”.`
                : `Choose a 4-digit PIN for “${pinFor.name}”.`}
            </p>
            <PinEntry
              status={pinSetStatus}
              onComplete={(pin) => {
                useProfiles.getState().updateProfile(pinFor.id, { pin: hashPin(pin) });
                setPinSetStatus('ok');
                toast('PIN saved.');
                window.setTimeout(() => setPinFor(null), 350);
              }}
            />
            {pinFor.pin && (
              <ButtonDanger
                onClick={() => {
                  useProfiles.getState().updateProfile(pinFor.id, { pin: undefined });
                  toast('PIN removed.');
                  setPinFor(null);
                }}
              >
                Remove PIN
              </ButtonDanger>
            )}
          </div>
        )}
      </Modal>

      {/* ── delete confirm modal ── */}
      <Modal
        open={deleteFor !== null}
        onClose={() => setDeleteFor(null)}
        title={deleteFor ? `Delete "${deleteFor.name}"?` : undefined}
        className="max-w-md"
      >
        {deleteFor && (
          <form
            className="flex flex-col gap-16"
            onSubmit={(e) => {
              e.preventDefault();
              confirmDelete();
            }}
          >
            <p className="text-caption text-muted">
              Library, progress and stats for this profile are removed permanently. This cannot be
              undone.
            </p>
            <div>
              <label htmlFor="delete-confirm" className="mb-8 block text-micro uppercase text-muted">
                Type {deleteFor.name} to confirm
              </label>
              <input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                autoComplete="off"
                className="glass-1 w-full rounded-lg px-16 py-12 text-caption text-ink focus:border-error/60 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-12">
              <ButtonGhost onClick={() => setDeleteFor(null)}>Cancel</ButtonGhost>
              <ButtonDanger
                onClick={confirmDelete}
                className={deleteConfirm.trim() !== deleteFor.name ? 'pointer-events-none opacity-50' : undefined}
              >
                Delete
              </ButtonDanger>
            </div>
          </form>
        )}
      </Modal>

      <TransitionVeil show={veil} />
    </div>
  );
}
