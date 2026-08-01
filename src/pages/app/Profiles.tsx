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
import { useT } from '@/i18n';
import type { TFunction } from '@/i18n';
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

function statsLine(id: string, t: TFunction): string {
  const { library, inProgress } = profileStats(id);
  if (library === 0 && inProgress === 0) return t('app.profiles.statsEmpty');
  const parts: string[] = [];
  if (library > 0) parts.push(t('app.profiles.statsLibrary', { n: library }));
  if (inProgress > 0) parts.push(t('app.profiles.statsInProgress', { n: inProgress }));
  return parts.join(' · ');
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function Profiles() {
  const { t } = useT();
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
    toast(t('app.profiles.toastPinReset', { name: pinTarget.name }));
    setPinTarget(null);
    setPinRecovery(false);
    setPinStatus('idle');
  };

  const commitRename = () => {
    if (!renamingId) return;
    const name = renameValue.trim().slice(0, 20);
    if (name) {
      useProfiles.getState().updateProfile(renamingId, { name });
      toast(t('app.profiles.toastRenamed'));
    }
    setRenamingId(null);
  };

  const confirmDelete = () => {
    if (!deleteFor || profiles.length <= 1) return;
    if (deleteConfirm.trim() !== deleteFor.name) return;
    const wasActive = deleteFor.id === activeProfileId;
    useProfiles.getState().removeProfile(deleteFor.id);
    if (wasActive) switchProfile(null);
    toast(t('app.profiles.toastDeleted', { name: deleteFor.name }));
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

  const titleWords = t('app.profiles.whosWatching').split(' ');

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
              aria-label={t('app.profiles.whosWatching')}
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
                  aria-label={p.pin ? t('app.profiles.tileLockedAria', { name: p.name }) : p.name}
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
                  aria-label={t('app.profiles.addProfile')}
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
                    {t('app.profiles.addProfile')}
                  </span>
                </motion.button>
              )}
            </motion.div>

            <p className="max-w-[52ch] px-16 text-micro uppercase text-muted">
              {t('app.profiles.gateNote')}
            </p>

            <ButtonGhost onClick={() => setMode('manage')}>
              <SlidersHorizontal size={16} strokeWidth={1.75} />
              {t('app.profiles.manageProfiles')}
            </ButtonGhost>
          </motion.section>
        ) : (
          <motion.section key="manage" {...viewMotion} className="mx-auto flex max-w-2xl flex-col gap-24">
            <div className="flex flex-wrap items-center justify-between gap-16">
              <div className="flex flex-col gap-4">
                <h1 className="font-display text-display-l text-ink md:text-display-xl">{t('app.profiles.title')}</h1>
                <p className="text-caption text-muted">
                  {profiles.length <= 1
                    ? t('app.profiles.oneProfile')
                    : t('app.profiles.countProfiles', { count: profiles.length, max: MAX_PROFILES })}
                </p>
              </div>
              <div className="flex items-center gap-12">
                <ButtonGhost onClick={() => setMode('gate')}>{t('app.profiles.backToGate')}</ButtonGhost>
                <SilverButton
                  onClick={() => setAddOpen(true)}
                  disabled={profiles.length >= MAX_PROFILES}
                >
                  <Plus size={16} strokeWidth={2} />
                  {t('app.profiles.newProfile')}
                </SilverButton>
              </div>
            </div>

            {profiles.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title={t('app.profiles.emptyTitle')}
                caption={t('app.profiles.emptyCaption')}
                action={<SilverButton onClick={() => setAddOpen(true)}>{t('app.profiles.newProfile')}</SilverButton>}
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
                              aria-label={t('app.profiles.nameAria')}
                              className="glass-1 w-full max-w-[200px] rounded-md px-12 py-6 text-caption text-ink focus:border-cyan/50 focus:outline-none"
                            />
                            <button
                              type="submit"
                              aria-label={t('app.profiles.saveNameAria')}
                              className="focusable cursor-pointer rounded-full p-6 text-cyan hover:bg-white/[.06]"
                            >
                              <Check size={16} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              aria-label={t('app.profiles.cancelRenameAria')}
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
                                {t('app.profiles.active')}
                              </span>
                            )}
                            {p.pin && (
                              <span className="glass-1 inline-flex items-center gap-4 rounded-md px-8 py-2 text-micro uppercase text-muted">
                                <Lock size={10} strokeWidth={2} /> {t('app.profiles.locked')}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-caption text-muted">{statsLine(p.id, t)}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-8">
                        <ButtonNeon onClick={() => pick(p)} className="px-16 py-8">
                          {t('app.profiles.switch')}
                        </ButtonNeon>
                        <button
                          type="button"
                          aria-label={t('app.profiles.renameAria', { name: p.name })}
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
                          aria-label={t('app.profiles.avatarAria', { name: p.name })}
                          onClick={() => setAvatarFor(p)}
                          className="focusable cursor-pointer rounded-full p-8 text-muted hover:text-ink hover:bg-white/[.06]"
                        >
                          <ImageIcon size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          aria-label={p.pin ? t('app.profiles.changePinAria', { name: p.name }) : t('app.profiles.setPinAria', { name: p.name })}
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
                            aria-label={t('app.profiles.deleteAria', { name: p.name })}
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
              {t('app.profiles.manageNote')}
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
        title={pinRecovery ? t('app.profiles.resetPin') : pinTarget ? t('app.profiles.enterPin', { name: pinTarget.name }) : undefined}
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
              {t('app.profiles.pinStoredNote')}
            </p>
            <ButtonGhost onClick={() => setPinRecovery(true)}>{t('app.profiles.forgotPin')}</ButtonGhost>
          </div>
        )}
        {pinTarget && pinRecovery && (
          <div className="flex flex-col items-center gap-16 text-center">
            <p className="text-caption text-muted">
              {t('app.profiles.resetPinBody', { name: pinTarget.name })}
            </p>
            <div className="flex items-center gap-12">
              <ButtonGhost onClick={() => setPinRecovery(false)}>{t('app.profiles.back')}</ButtonGhost>
              <ButtonDanger onClick={resetPin}>{t('app.profiles.resetPin')}</ButtonDanger>
            </div>
          </div>
        )}
      </Modal>

      {/* ── add profile modal ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('app.profiles.newProfile')} className="max-w-lg">
        <ProfileForm
          submitLabel={t('app.profiles.createProfile')}
          autoFocus={false}
          onSubmit={(pending) => {
            useProfiles.getState().addProfile({
              id: newProfileId(),
              name: pending.name,
              avatar: pending.avatar,
              pin: pending.pin,
            });
            toast(t('app.profiles.toastCreated', { name: pending.name }));
            setAddOpen(false);
          }}
        />
      </Modal>

      {/* ── change avatar modal ── */}
      <Modal
        open={avatarFor !== null}
        onClose={() => setAvatarFor(null)}
        title={avatarFor ? t('app.profiles.avatarFor', { name: avatarFor.name }) : undefined}
        className="max-w-md"
      >
        {avatarFor && (
          <AvatarOrbGrid
            value={avatarFor.avatar}
            onChange={(avatar) => {
              useProfiles.getState().updateProfile(avatarFor.id, { avatar });
              toast(t('app.profiles.toastAvatar'));
              setAvatarFor(null);
            }}
          />
        )}
      </Modal>

      {/* ── set / change / remove PIN modal ── */}
      <Modal
        open={pinFor !== null}
        onClose={() => setPinFor(null)}
        title={pinFor?.pin ? t('app.profiles.changePin') : t('app.profiles.setPin')}
        className="max-w-sm"
      >
        {pinFor && (
          <div className="flex flex-col items-center gap-24">
            <p className="text-center text-caption text-muted">
              {pinFor.pin
                ? t('app.profiles.enterNewPin', { name: pinFor.name })
                : t('app.profiles.choosePin', { name: pinFor.name })}
            </p>
            <PinEntry
              status={pinSetStatus}
              onComplete={(pin) => {
                useProfiles.getState().updateProfile(pinFor.id, { pin: hashPin(pin) });
                setPinSetStatus('ok');
                toast(t('app.profiles.toastPinSaved'));
                window.setTimeout(() => setPinFor(null), 350);
              }}
            />
            {pinFor.pin && (
              <ButtonDanger
                onClick={() => {
                  useProfiles.getState().updateProfile(pinFor.id, { pin: undefined });
                  toast(t('app.profiles.toastPinRemoved'));
                  setPinFor(null);
                }}
              >
                {t('app.profiles.removePin')}
              </ButtonDanger>
            )}
          </div>
        )}
      </Modal>

      {/* ── delete confirm modal ── */}
      <Modal
        open={deleteFor !== null}
        onClose={() => setDeleteFor(null)}
        title={deleteFor ? t('app.profiles.deleteTitle', { name: deleteFor.name }) : undefined}
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
              {t('app.profiles.deleteBody')}
            </p>
            <div>
              <label htmlFor="delete-confirm" className="mb-8 block text-micro uppercase text-muted">
                {t('app.profiles.deleteConfirmLabel', { name: deleteFor.name })}
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
              <ButtonGhost onClick={() => setDeleteFor(null)}>{t('app.profiles.cancel')}</ButtonGhost>
              <ButtonDanger
                onClick={confirmDelete}
                className={deleteConfirm.trim() !== deleteFor.name ? 'pointer-events-none opacity-50' : undefined}
              >
                {t('app.profiles.delete')}
              </ButtonDanger>
            </div>
          </form>
        )}
      </Modal>

      <TransitionVeil show={veil} />
    </div>
  );
}
