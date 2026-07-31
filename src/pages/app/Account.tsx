/**
 * Account — `/app/account` (account.md). The client's control room for
 * identity and billing: profile (orb avatar picker, inline name edit),
 * subscription (active/demo/canceled/inactive variants, manage + cancel
 * flows), devices (honest single-session state) and the danger zone
 * (sign out, typed-confirm delete). Requires auth.
 */
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  Check,
  CreditCard,
  LogOut,
  Mail,
  Monitor,
  Pencil,
  Smartphone,
  Sparkles,
  Tv,
  Wallet,
} from 'lucide-react';
import {
  ButtonDanger,
  ButtonGhost,
  ButtonNeon,
  ButtonPrimary,
  Modal,
  spring,
  toast,
} from '@/components/ui-elite';
import { API_URL, hasAccessFor, useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const AVATARS = [
  '/art/avatar-nova.jpg',
  '/art/avatar-ember.jpg',
  '/art/avatar-frost.jpg',
  '/art/avatar-pulse.jpg',
  '/art/avatar-drift.jpg',
  '/art/avatar-quark.jpg',
  '/art/avatar-halo.jpg',
  '/art/avatar-zen.jpg',
];

function formatFullDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(epoch?: number): string {
  const d = epoch ? new Date(epoch) : new Date();
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

/** Honest device fingerprint from the user agent — no invented sessions. */
function currentDevice(): { name: string; Icon: typeof Monitor } {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'Mac'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'This device';
  const isTv = /TV|AndroidTV|AFT|BRAVIA/i.test(ua);
  const isMobile = /Mobi|Android|iPhone|iPad/.test(ua);
  return { name: `${os} — ${browser}`, Icon: isTv ? Tv : isMobile ? Smartphone : Monitor };
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-16 w-16 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

const sectionMotion = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
};

export default function Account() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const subscription = useAuth((s) => s.subscription);
  const demoMode = useAuth((s) => s.demoMode);
  const logout = useAuth((s) => s.logout);
  const cancelSubscription = useAuth((s) => s.cancelSubscription);
  const refreshSubscription = useAuth((s) => s.refreshSubscription);
  const updateName = useAuth((s) => s.updateName);
  const setAvatar = useAuth((s) => s.setAvatar);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const reduce = useReducedMotion();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string>(AVATARS[0]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDraft, setDeleteDraft] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  if (!user) return <Navigate to="/login?next=/app/account" replace />;

  const access = hasAccessFor(subscription);
  const active = subscription?.status === 'active';
  const canceled = subscription?.status === 'canceled';
  const renewsLabel = formatFullDate(subscription?.renewsAt);
  const avatar = user.avatar ?? AVATARS[0];
  const device = currentDevice();

  const commitName = () => {
    const trimmed = nameDraft.trim();
    setEditingName(false);
    if (trimmed.length >= 2 && trimmed !== user.name) {
      updateName(trimmed);
      toast('Name updated.');
    }
  };

  const onManage = () => {
    if (demoMode) {
      setManageOpen(true);
    } else {
      window.open(`${API_URL}/api/billing/portal`, '_blank', 'noopener,noreferrer');
    }
  };

  const onConfirmCancel = async () => {
    setCancelBusy(true);
    await new Promise((r) => setTimeout(r, reduce ? 200 : 1000));
    cancelSubscription();
    setCancelBusy(false);
    setCancelOpen(false);
    toast(`Premium will end ${renewsLabel}. The full catalog stays open until then.`);
  };

  const onConfirmSignOut = async () => {
    setSignOutBusy(true);
    await new Promise((r) => setTimeout(r, reduce ? 150 : 600));
    logout();
    setSignOutBusy(false);
    setSignOutOpen(false);
    navigate('/login');
    toast('Signed out. See you soon.');
  };

  const onConfirmDelete = async () => {
    if (deleteDraft !== 'DELETE') return;
    setDeleteBusy(true);
    await new Promise((r) => setTimeout(r, reduce ? 300 : 1500));
    deleteAccount();
    setDeleteBusy(false);
    setDeleteOpen(false);
    navigate('/');
    toast('Account deleted. Everything was removed.');
  };

  return (
    <div className="flex flex-col gap-24 py-24">
      {/* ── S0 header ─────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.35, ease: 'easeOut' }}
      >
        <p className="text-micro uppercase tracking-[0.3em] text-cyan">Account</p>
        <h1 className="mt-8 font-display text-display-xl text-ink">Your Elitebox.</h1>
      </motion.header>

      <div className="grid grid-cols-1 gap-24 xl:grid-cols-[1.4fr_1fr]">
        {/* ── S1 profile ──────────────────────────────────────────────── */}
        <motion.section
          {...sectionMotion}
          transition={{ ...spring.smooth, delay: 0.08 }}
          className="glass-2 flex flex-col items-center gap-20 rounded-xl p-24 text-center md:flex-row md:text-left"
          aria-label="Profile"
        >
          <button
            type="button"
            aria-label="Change avatar"
            onClick={() => {
              setAvatarDraft(avatar);
              setAvatarOpen(true);
            }}
            className="focusable group relative shrink-0 rounded-full"
          >
            <img
              src={avatar}
              alt=""
              className="h-80 w-80 rounded-full object-cover ring-2 ring-white/10 transition-[box-shadow] duration-150 group-hover:ring-cyan"
            />
            <span className="absolute bottom-0 right-0 flex h-24 w-24 items-center justify-center rounded-full bg-deep/80 text-cyan ring-1 ring-white/10 transition-colors group-hover:bg-cyan group-hover:text-deep">
              <Pencil size={14} strokeWidth={1.75} />
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-8">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                aria-label="Edit name"
                className="glass-1 w-full max-w-[320px] rounded-lg px-12 py-8 font-display text-title text-ink caret-cyan focus:border-cyan focus:outline-none focus:shadow-[0_0_0_2px_rgba(124,217,236,.9),0_0_24px_rgba(124,217,236,.45)] max-md:mx-auto"
              />
            ) : (
              <h2 className="truncate font-display text-title text-ink">{user.name}</h2>
            )}
            <p className="flex items-center justify-center gap-8 text-caption text-muted md:justify-start">
              <Mail size={14} strokeWidth={1.75} />
              <span className="truncate">{user.email}</span>
            </p>
            <p className="text-micro uppercase text-muted">
              Member since {formatMonthYear(user.createdAt)}
            </p>
          </div>

          {!editingName && (
            <ButtonGhost
              onClick={() => {
                setNameDraft(user.name);
                setEditingName(true);
              }}
            >
              Edit name
            </ButtonGhost>
          )}
        </motion.section>

        {/* ── S2 subscription ─────────────────────────────────────────── */}
        <motion.section
          {...sectionMotion}
          transition={{ ...spring.smooth, delay: 0.16 }}
          className="glass-3 relative flex flex-col gap-16 overflow-hidden rounded-xl p-28"
          aria-label="Subscription"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px opacity-40"
            style={{ background: 'var(--gradient-signature)' }}
          />

          {access ? (
            <>
              <div className="flex flex-wrap items-center gap-12">
                <p className="text-micro uppercase text-muted">Subscription</p>
                {active && (
                  <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-4">
                    <span
                      className={cn(
                        'h-8 w-8 rounded-full bg-cyan shadow-[0_0_8px_rgba(124,217,236,.7)]',
                        !reduce && 'animate-pulse',
                      )}
                    />
                    <span className="text-caption font-semibold text-cyan">ACTIVE</span>
                  </span>
                )}
                {canceled && (
                  <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-4">
                    <span className="h-8 w-8 rounded-full bg-muted" />
                    <span className="text-caption font-semibold text-muted">
                      CANCELS {renewsLabel.toUpperCase()}
                    </span>
                  </span>
                )}
                {subscription?.demo && (
                  <span
                    className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-4"
                    title="Demo mode — no real charge. Billing is simulated."
                  >
                    <span className="h-8 w-8 rounded-full bg-warn" />
                    <span className="text-caption font-semibold text-warn">DEMO</span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="font-display text-title text-ink">Elitebox Premium</h2>
                <p className="mt-4 text-caption text-muted">
                  $4.99/month · Every movie and series in the catalog. Completely.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-24 text-caption text-muted">
                {subscription?.demo ? (
                  <span className="inline-flex items-center gap-8">
                    <Calendar size={14} strokeWidth={1.75} />
                    Demo subscription — never renews, never charges.
                  </span>
                ) : (
                  renewsLabel && (
                    <span className="inline-flex items-center gap-8">
                      <Calendar size={14} strokeWidth={1.75} />
                      Renews <span className="font-mono">{renewsLabel}</span>
                    </span>
                  )
                )}
                {subscription?.method && (
                  <span className="inline-flex items-center gap-8">
                    {subscription.method === 'paypal' ? (
                      <Wallet size={14} strokeWidth={1.75} />
                    ) : (
                      <CreditCard size={14} strokeWidth={1.75} />
                    )}
                    Payment method: {subscription.method === 'paypal' ? 'PayPal' : 'Card'}
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-12 md:flex-row md:justify-end">
                {active && (
                  <>
                    <ButtonNeon onClick={onManage}>Manage subscription</ButtonNeon>
                    <ButtonDanger onClick={() => setCancelOpen(true)}>Cancel subscription</ButtonDanger>
                  </>
                )}
                {canceled && <ButtonNeon to="/subscribe">Resubscribe</ButtonNeon>}
              </div>
            </>
          ) : (
            <>
              <div className="glass-2 flex h-56 w-56 items-center justify-center rounded-full">
                <Sparkles size={24} strokeWidth={1.75} className="text-cyan" />
              </div>
              <h2 className="font-display text-title text-ink">Free browsing mode.</h2>
              <p className="text-caption text-muted">
                You can explore the whole catalog. Press play on anything and Premium is one step
                away — $4.99/month, every movie and series in the catalog, completely.
              </p>
              <div className="mt-8 flex flex-col gap-12 md:flex-row">
                <ButtonPrimary to="/subscribe">See Premium</ButtonPrimary>
                <ButtonGhost to="/app">Browse the catalog</ButtonGhost>
              </div>
            </>
          )}
        </motion.section>
      </div>

      {/* ── S3 devices ────────────────────────────────────────────────── */}
      <motion.section
        {...sectionMotion}
        transition={{ ...spring.smooth, delay: 0.24 }}
        aria-label="Devices"
      >
        <h2 className="font-display text-title text-ink">Devices</h2>
        <p className="mt-4 text-caption text-muted">Sessions currently signed in to your account.</p>
        <div className="glass-2 mt-16 rounded-xl px-24">
          <div className="flex items-center gap-16 border-b border-white/[.06] py-16">
            <device.Icon size={20} strokeWidth={1.75} className="shrink-0 text-muted" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-body text-ink">{device.name}</p>
              <p className="font-mono text-caption text-muted">Last active now</p>
            </div>
            <span className="glass-1 rounded-full px-12 py-4 text-micro uppercase text-cyan">
              This device
            </span>
          </div>
          <p className="py-16 text-caption text-muted">
            No other devices are signed in. Multi-device session sync ships with the companion
            server — your account already works on every screen.
          </p>
        </div>
      </motion.section>

      {/* ── S4 danger zone ────────────────────────────────────────────── */}
      <motion.section
        {...sectionMotion}
        transition={{ ...spring.smooth, delay: 0.32 }}
        className="glass-2 max-w-[720px] rounded-xl border border-[rgba(255,77,109,.35)] p-24"
        aria-label="Danger zone"
      >
        <p className="flex items-center gap-12">
          <AlertTriangle size={20} strokeWidth={1.75} className="text-error" />
          <span className="font-display text-title text-ink">Danger zone.</span>
        </p>

        <div className="mt-16 flex flex-col gap-16 border-t border-white/[.06] pt-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-body text-ink">Sign out</p>
            <p className="text-caption text-muted">Ends this session. Your data stays on your account.</p>
          </div>
          <ButtonDanger onClick={() => setSignOutOpen(true)} className="shrink-0 hover:shadow-[0_0_18px_rgba(255,77,109,.35)]">
            Sign out
          </ButtonDanger>
        </div>

        <div className="mt-16 flex flex-col gap-16 border-t border-white/[.06] pt-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-body text-ink">Delete account</p>
            <p className="max-w-[52ch] text-caption text-muted">
              Permanently removes your account, profiles, library and watch history. This cannot be
              undone.
            </p>
          </div>
          <ButtonDanger
            onClick={() => {
              setDeleteDraft('');
              setDeleteOpen(true);
            }}
            className="shrink-0 hover:shadow-[0_0_18px_rgba(255,77,109,.35)]"
          >
            Delete account
          </ButtonDanger>
        </div>
      </motion.section>

      {/* ── avatar picker modal ───────────────────────────────────────── */}
      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)} title="Choose your orb">
        <div className="grid grid-cols-4 gap-12 max-md:grid-cols-3">
          {AVATARS.map((src, i) => {
            const selected = avatarDraft === src;
            return (
              <motion.button
                key={src}
                type="button"
                aria-label={`Avatar ${i + 1}`}
                aria-pressed={selected}
                onClick={() => setAvatarDraft(src)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring.snappy, delay: reduce ? 0 : i * 0.04 }}
                className={cn(
                  'focusable relative aspect-square overflow-hidden rounded-full ring-2 transition-[box-shadow] duration-150',
                  selected
                    ? 'ring-cyan shadow-[0_0_0_2px_rgba(124,217,236,.9),0_0_24px_rgba(124,217,236,.45)]'
                    : 'ring-white/10 hover:ring-white/30',
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                {selected && (
                  <span className="absolute bottom-4 right-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan text-deep">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="mt-24 flex justify-end">
          <ButtonPrimary
            onClick={() => {
              setAvatar(avatarDraft);
              setAvatarOpen(false);
              toast('Avatar updated.');
            }}
          >
            Done
          </ButtonPrimary>
        </div>
      </Modal>

      {/* ── manage (demo explainer) ───────────────────────────────────── */}
      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Manage subscription">
        <p className="text-caption text-muted">
          Demo mode — manage actions are simulated. In production this opens your payment provider's
          billing portal.
        </p>
        <div className="mt-24 flex justify-end">
          <ButtonPrimary onClick={() => setManageOpen(false)}>Got it</ButtonPrimary>
        </div>
      </Modal>

      {/* ── cancel confirm ────────────────────────────────────────────── */}
      <Modal open={cancelOpen} onClose={() => !cancelBusy && setCancelOpen(false)} title="Cancel Premium?">
        <p className="text-caption text-muted">
          Your access continues until {renewsLabel}. After that, the catalog goes back to free
          browsing — your library and progress are never deleted.
        </p>
        <div className="mt-24 flex flex-col gap-12 sm:flex-row sm:justify-end">
          <ButtonPrimary onClick={() => setCancelOpen(false)}>Keep Premium</ButtonPrimary>
          <ButtonDanger onClick={onConfirmCancel} className={cn(cancelBusy && 'opacity-60 pointer-events-none')}>
            {cancelBusy ? (
              <span className="inline-flex items-center gap-8">
                <Spinner /> Canceling…
              </span>
            ) : (
              'Confirm cancellation'
            )}
          </ButtonDanger>
        </div>
      </Modal>

      {/* ── sign out confirm ──────────────────────────────────────────── */}
      <Modal open={signOutOpen} onClose={() => !signOutBusy && setSignOutOpen(false)} title="Sign out of Elitebox?">
        <p className="text-caption text-muted">
          Ends this session. Your data stays on your account.
        </p>
        <div className="mt-24 flex flex-col gap-12 sm:flex-row sm:justify-end">
          <ButtonPrimary onClick={() => setSignOutOpen(false)}>Stay</ButtonPrimary>
          <ButtonDanger onClick={onConfirmSignOut} className={cn(signOutBusy && 'opacity-60 pointer-events-none')}>
            {signOutBusy ? (
              <span className="inline-flex items-center gap-8">
                <Spinner /> Signing out…
              </span>
            ) : (
              <span className="inline-flex items-center gap-8">
                <LogOut size={16} strokeWidth={1.75} /> Sign out
              </span>
            )}
          </ButtonDanger>
        </div>
      </Modal>

      {/* ── delete typed-confirm ──────────────────────────────────────── */}
      <Modal open={deleteOpen} onClose={() => !deleteBusy && setDeleteOpen(false)} title="Delete this account?">
        <p className="text-caption text-muted">
          Type <span className="font-mono font-semibold text-error">DELETE</span> to confirm.
        </p>
        <input
          value={deleteDraft}
          onChange={(e) => setDeleteDraft(e.target.value)}
          placeholder="DELETE"
          aria-label="Type DELETE to confirm account deletion"
          autoComplete="off"
          className="glass-1 mt-16 w-full rounded-lg border-white/[.08] px-16 py-12 font-mono text-body text-ink caret-error placeholder:text-muted/50 focus:border-error focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,77,109,.9),0_0_24px_rgba(255,77,109,.35)]"
        />
        <div className="mt-24 flex flex-col gap-12 sm:flex-row sm:justify-end">
          <ButtonGhost onClick={() => setDeleteOpen(false)}>Keep my account</ButtonGhost>
          <ButtonDanger
            onClick={onConfirmDelete}
            className={cn(
              'transition-opacity duration-150',
              deleteDraft === 'DELETE' && !deleteBusy ? 'opacity-100' : 'opacity-40 pointer-events-none',
            )}
          >
            {deleteBusy ? (
              <span className="inline-flex items-center gap-8">
                <Spinner /> Deleting your account…
              </span>
            ) : (
              'Delete account'
            )}
          </ButtonDanger>
        </div>
      </Modal>
    </div>
  );
}
