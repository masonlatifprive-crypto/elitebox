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
import { useT } from '@/i18n';
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
  const { t } = useT();
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
      toast(t('app.account.toastNameUpdated'));
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
    toast(t('app.account.toastPremiumEnds', { date: renewsLabel }));
  };

  const onConfirmSignOut = async () => {
    setSignOutBusy(true);
    await new Promise((r) => setTimeout(r, reduce ? 150 : 600));
    logout();
    setSignOutBusy(false);
    setSignOutOpen(false);
    navigate('/login');
    toast(t('app.account.toastSignedOut'));
  };

  const onConfirmDelete = async () => {
    if (deleteDraft !== 'DELETE') return;
    setDeleteBusy(true);
    await new Promise((r) => setTimeout(r, reduce ? 300 : 1500));
    deleteAccount();
    setDeleteBusy(false);
    setDeleteOpen(false);
    navigate('/');
    toast(t('app.account.toastDeleted'));
  };

  return (
    <div className="flex flex-col gap-24 py-24">
      {/* ── S0 header ─────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.35, ease: 'easeOut' }}
      >
        <p className="text-micro uppercase tracking-[0.3em] text-cyan">{t('app.account.eyebrow')}</p>
        <h1 className="mt-8 font-display text-display-xl text-ink">{t('app.account.headline')}</h1>
      </motion.header>

      <div className="grid grid-cols-1 gap-24 xl:grid-cols-[1.4fr_1fr]">
        {/* ── S1 profile ──────────────────────────────────────────────── */}
        <motion.section
          {...sectionMotion}
          transition={{ ...spring.smooth, delay: 0.08 }}
          className="glass-2 flex flex-col items-center gap-20 rounded-xl p-24 text-center md:flex-row md:text-left"
          aria-label={t('app.account.profileAria')}
        >
          <button
            type="button"
            aria-label={t('app.account.changeAvatarAria')}
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
                aria-label={t('app.account.editNameAria')}
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
              {t('app.account.memberSince', { date: formatMonthYear(user.createdAt) })}
            </p>
          </div>

          {!editingName && (
            <ButtonGhost
              onClick={() => {
                setNameDraft(user.name);
                setEditingName(true);
              }}
            >
              {t('app.account.editName')}
            </ButtonGhost>
          )}
        </motion.section>

        {/* ── S2 subscription ─────────────────────────────────────────── */}
        <motion.section
          {...sectionMotion}
          transition={{ ...spring.smooth, delay: 0.16 }}
          className="glass-3 relative flex flex-col gap-16 overflow-hidden rounded-xl p-28"
          aria-label={t('app.account.subscriptionAria')}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px opacity-40"
            style={{ background: 'var(--gradient-signature)' }}
          />

          {access ? (
            <>
              <div className="flex flex-wrap items-center gap-12">
                <p className="text-micro uppercase text-muted">{t('app.account.subscription')}</p>
                {active && (
                  <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-4">
                    <span
                      className={cn(
                        'h-8 w-8 rounded-full bg-cyan shadow-[0_0_8px_rgba(124,217,236,.7)]',
                        !reduce && 'animate-pulse',
                      )}
                    />
                    <span className="text-caption font-semibold text-cyan">{t('app.account.statusActive')}</span>
                  </span>
                )}
                {canceled && (
                  <span className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-4">
                    <span className="h-8 w-8 rounded-full bg-muted" />
                    <span className="text-caption font-semibold text-muted">
                      {t('app.account.statusCancels', { date: renewsLabel })}
                    </span>
                  </span>
                )}
                {subscription?.demo && (
                  <span
                    className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-4"
                    title={t('app.account.demoTitle')}
                  >
                    <span className="h-8 w-8 rounded-full bg-warn" />
                    <span className="text-caption font-semibold text-warn">LOCAL</span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="font-display text-title text-ink">Elitebox Premium</h2>
                <p className="mt-4 text-caption text-muted">
                  {t('app.account.premiumBlurb')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-24 text-caption text-muted">
                {subscription?.demo ? (
                  <span className="inline-flex items-center gap-8">
                    <Calendar size={14} strokeWidth={1.75} />
                    {t('app.account.demoNeverRenews')}
                  </span>
                ) : (
                  renewsLabel && (
                    <span className="inline-flex items-center gap-8">
                      <Calendar size={14} strokeWidth={1.75} />
                      {t('app.account.renews')} <span className="font-mono">{renewsLabel}</span>
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
                    {t('app.account.paymentMethod', { method: subscription.method === 'paypal' ? 'PayPal' : t('app.account.methodCard') })}
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-12 md:flex-row md:justify-end">
                {active && (
                  <>
                    <ButtonNeon onClick={onManage}>{t('app.account.manageSubscription')}</ButtonNeon>
                    <ButtonDanger onClick={() => setCancelOpen(true)}>{t('app.account.cancelSubscription')}</ButtonDanger>
                  </>
                )}
                {canceled && <ButtonNeon to="/subscribe">{t('app.account.resubscribe')}</ButtonNeon>}
              </div>
            </>
          ) : (
            <>
              <div className="glass-2 flex h-56 w-56 items-center justify-center rounded-full">
                <Sparkles size={24} strokeWidth={1.75} className="text-cyan" />
              </div>
              <h2 className="font-display text-title text-ink">{t('app.account.freeTitle')}</h2>
              <p className="text-caption text-muted">
                {t('app.account.freeBody')}
              </p>
              <div className="mt-8 flex flex-col gap-12 md:flex-row">
                <ButtonPrimary to="/subscribe">{t('app.account.seePremium')}</ButtonPrimary>
                <ButtonGhost to="/app">{t('app.account.browseCatalog')}</ButtonGhost>
              </div>
            </>
          )}
        </motion.section>
      </div>

      {/* ── S3 devices ────────────────────────────────────────────────── */}
      <motion.section
        {...sectionMotion}
        transition={{ ...spring.smooth, delay: 0.24 }}
        aria-label={t('app.account.devicesAria')}
      >
        <h2 className="font-display text-title text-ink">{t('app.account.devices')}</h2>
        <p className="mt-4 text-caption text-muted">{t('app.account.devicesSub')}</p>
        <div className="glass-2 mt-16 rounded-xl px-24">
          <div className="flex items-center gap-16 border-b border-white/[.06] py-16">
            <device.Icon size={20} strokeWidth={1.75} className="shrink-0 text-muted" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-body text-ink">{device.name}</p>
              <p className="font-mono text-caption text-muted">{t('app.account.lastActiveNow')}</p>
            </div>
            <span className="glass-1 rounded-full px-12 py-4 text-micro uppercase text-cyan">
              {t('app.account.thisDevice')}
            </span>
          </div>
          <p className="py-16 text-caption text-muted">
            {t('app.account.noOtherDevices')}
          </p>
        </div>
      </motion.section>

      {/* ── S4 danger zone ────────────────────────────────────────────── */}
      <motion.section
        {...sectionMotion}
        transition={{ ...spring.smooth, delay: 0.32 }}
        className="glass-2 max-w-[720px] rounded-xl border border-[rgba(255,77,109,.35)] p-24"
        aria-label={t('app.account.dangerAria')}
      >
        <p className="flex items-center gap-12">
          <AlertTriangle size={20} strokeWidth={1.75} className="text-error" />
          <span className="font-display text-title text-ink">{t('app.account.dangerTitle')}</span>
        </p>

        <div className="mt-16 flex flex-col gap-16 border-t border-white/[.06] pt-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-body text-ink">{t('app.account.signOut')}</p>
            <p className="text-caption text-muted">{t('app.account.signOutDesc')}</p>
          </div>
          <ButtonDanger onClick={() => setSignOutOpen(true)} className="shrink-0 hover:shadow-[0_0_18px_rgba(255,77,109,.35)]">
            {t('app.account.signOut')}
          </ButtonDanger>
        </div>

        <div className="mt-16 flex flex-col gap-16 border-t border-white/[.06] pt-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-body text-ink">{t('app.account.deleteAccount')}</p>
            <p className="max-w-[52ch] text-caption text-muted">
              {t('app.account.deleteAccountDesc')}
            </p>
          </div>
          <ButtonDanger
            onClick={() => {
              setDeleteDraft('');
              setDeleteOpen(true);
            }}
            className="shrink-0 hover:shadow-[0_0_18px_rgba(255,77,109,.35)]"
          >
            {t('app.account.deleteAccount')}
          </ButtonDanger>
        </div>
      </motion.section>

      {/* ── avatar picker modal ───────────────────────────────────────── */}
      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)} title={t('app.account.avatarTitle')}>
        <div className="grid grid-cols-4 gap-12 max-md:grid-cols-3">
          {AVATARS.map((src, i) => {
            const selected = avatarDraft === src;
            return (
              <motion.button
                key={src}
                type="button"
                aria-label={t('app.onboarding.avatarAria', { n: i + 1 })}
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
              toast(t('app.profiles.toastAvatar'));
            }}
          >
            {t('app.account.done')}
          </ButtonPrimary>
        </div>
      </Modal>

      {/* ── manage (demo explainer) ───────────────────────────────────── */}
      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title={t('app.account.manageSubscription')}>
        <p className="text-caption text-muted">
          {t('app.account.manageDemoBody')}
        </p>
        <div className="mt-24 flex justify-end">
          <ButtonPrimary onClick={() => setManageOpen(false)}>{t('app.account.gotIt')}</ButtonPrimary>
        </div>
      </Modal>

      {/* ── cancel confirm ────────────────────────────────────────────── */}
      <Modal open={cancelOpen} onClose={() => !cancelBusy && setCancelOpen(false)} title={t('app.account.cancelTitle')}>
        <p className="text-caption text-muted">
          {t('app.account.cancelBody', { date: renewsLabel })}
        </p>
        <div className="mt-24 flex flex-col gap-12 sm:flex-row sm:justify-end">
          <ButtonPrimary onClick={() => setCancelOpen(false)}>{t('app.account.keepPremium')}</ButtonPrimary>
          <ButtonDanger onClick={onConfirmCancel} className={cn(cancelBusy && 'opacity-60 pointer-events-none')}>
            {cancelBusy ? (
              <span className="inline-flex items-center gap-8">
                <Spinner /> {t('app.account.canceling')}
              </span>
            ) : (
              t('app.account.confirmCancel')
            )}
          </ButtonDanger>
        </div>
      </Modal>

      {/* ── sign out confirm ──────────────────────────────────────────── */}
      <Modal open={signOutOpen} onClose={() => !signOutBusy && setSignOutOpen(false)} title={t('app.account.signOutTitle')}>
        <p className="text-caption text-muted">
          {t('app.account.signOutDesc')}
        </p>
        <div className="mt-24 flex flex-col gap-12 sm:flex-row sm:justify-end">
          <ButtonPrimary onClick={() => setSignOutOpen(false)}>{t('app.account.stay')}</ButtonPrimary>
          <ButtonDanger onClick={onConfirmSignOut} className={cn(signOutBusy && 'opacity-60 pointer-events-none')}>
            {signOutBusy ? (
              <span className="inline-flex items-center gap-8">
                <Spinner /> {t('app.account.signingOut')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-8">
                <LogOut size={16} strokeWidth={1.75} /> {t('app.account.signOut')}
              </span>
            )}
          </ButtonDanger>
        </div>
      </Modal>

      {/* ── delete typed-confirm ──────────────────────────────────────── */}
      <Modal open={deleteOpen} onClose={() => !deleteBusy && setDeleteOpen(false)} title={t('app.account.deleteTitle')}>
        <p className="text-caption text-muted">
          {t('app.account.deleteBody1')}{' '}
          <span className="font-mono font-semibold text-error">DELETE</span>{' '}
          {t('app.account.deleteBody2')}
        </p>
        <input
          value={deleteDraft}
          onChange={(e) => setDeleteDraft(e.target.value)}
          placeholder="DELETE"
          aria-label={t('app.account.deleteInputAria')}
          autoComplete="off"
          className="glass-1 mt-16 w-full rounded-lg border-white/[.08] px-16 py-12 font-mono text-body text-ink caret-error placeholder:text-muted/50 focus:border-error focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,77,109,.9),0_0_24px_rgba(255,77,109,.35)]"
        />
        <div className="mt-24 flex flex-col gap-12 sm:flex-row sm:justify-end">
          <ButtonGhost onClick={() => setDeleteOpen(false)}>{t('app.account.keepAccount')}</ButtonGhost>
          <ButtonDanger
            onClick={onConfirmDelete}
            className={cn(
              'transition-opacity duration-150',
              deleteDraft === 'DELETE' && !deleteBusy ? 'opacity-100' : 'opacity-40 pointer-events-none',
            )}
          >
            {deleteBusy ? (
              <span className="inline-flex items-center gap-8">
                <Spinner /> {t('app.account.deleting')}
              </span>
            ) : (
              t('app.account.deleteAccount')
            )}
          </ButtonDanger>
        </div>
      </Modal>
    </div>
  );
}
