/**
 * Register — `/register` (register.md). Account creation in under 30s:
 * glass-3 card (same language as /login), live password requirement chips
 * with check-draw animation, 4-segment strength meter, create → auto
 * sign-in → redirect /subscribe (preserving ?next=).
 */
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import MovieWall from '@/components/MovieWall';
import { spring, toast } from '@/components/ui-elite';
import { useAuth } from '@/lib/auth';
import { usePublicCatalog } from '@/lib/usePublicCatalog';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  'w-full rounded-lg border bg-white/[.04] px-16 py-12 text-body text-ink caret-cyan placeholder:text-muted/60 transition-[border-color,box-shadow] duration-150 focus:outline-none';
const focusGlow =
  'border-white/[.08] focus:border-cyan focus:shadow-[0_0_0_2px_rgba(124,217,236,.9),0_0_24px_rgba(124,217,236,.45)]';

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-20 w-20 animate-spin rounded-full border-2 border-deep/30 border-t-deep"
    />
  );
}

/* ── password scoring (register.md §6): ≥8 (1) + mixed case or ≥12 (1)
      + number (1) + symbol (1) ─────────────────────────────────────────── */
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if ((/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || pw.length >= 12) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const STRENGTH_KEYS = ['', 'weak', 'fair', 'strong', 'excellent'] as const;
const STRENGTH_COLORS = ['', 'bg-error', 'bg-warn', 'bg-cyan', 'bg-cyan'];

/** Requirement chip with a check that draws itself in when satisfied. */
function RequirementChip({ met, label, reduce }: { met: boolean; label: string; reduce: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-6 text-caption transition-colors duration-150',
        met ? 'text-cyan' : 'text-muted',
      )}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path
          d="M4 12.5l5 5L20 6.5"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ strokeDashoffset: 24 }}
          animate={{ strokeDashoffset: met ? 0 : 24 }}
          style={{ strokeDasharray: 24 }}
          transition={reduce ? { duration: 0.15 } : { duration: 0.3, ease: 'easeOut' }}
        />
      </svg>
      {label}
    </span>
  );
}

export default function Register() {
  const { t } = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const register = useAuth((s) => s.register);
  const demoMode = useAuth((s) => s.demoMode);
  const reduce = useReducedMotion();
  /* Real catalog art for the wall; showcase art only while loading/failed. */
  const { items: wallItems } = usePublicCatalog();

  const next = params.get('next');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success'>('idle');
  const celebrated = useRef(false);
  const reqId = useRef(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const busy = phase !== 'idle';
  const reqLen = password.length >= 8;
  const reqNumSym = /\d/.test(password) || /[^A-Za-z0-9]/.test(password);
  const bothMet = reqLen && reqNumSym;
  const score = scorePassword(password);

  /* one celebratory pulse the first time both requirement chips flip green */
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (bothMet && !celebrated.current) {
      celebrated.current = true;
      setPulse((p) => p + 1);
    }
  }, [bothMet]);

  /* prefill from /subscribe (?email=): name field takes focus (register.md) */
  useEffect(() => {
    if (params.get('email')) nameRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit =
    !busy &&
    name.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    bothMet &&
    confirm.length > 0 &&
    confirm === password;

  /* 6s watchdog (register.md States) */
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = reqId.current;
    const watchdog = setTimeout(() => {
      if (reqId.current === id) {
        reqId.current += 1;
        setPhase('idle');
        toast.error(t('marketing.auth.register.toastNetwork'));
      }
    }, 6000);
    return () => clearTimeout(watchdog);
  }, [phase]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    /* field-level errors, first invalid field auto-focused */
    if (name.trim().length < 2) {
      setNameError(t('marketing.auth.register.nameError'));
      nameRef.current?.focus();
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setEmailError(t('marketing.auth.register.emailInvalid'));
      emailRef.current?.focus();
      return;
    }
    if (!bothMet) return;
    if (confirm !== password) {
      setConfirmError(t('marketing.auth.register.confirmError'));
      confirmRef.current?.focus();
      return;
    }

    const id = ++reqId.current;
    setPhase('loading');
    const res = await register(name, email, password);
    if (reqId.current !== id) return;

    if (!res.ok) {
      setPhase('idle');
      if (res.error === 'duplicate') {
        setEmailError(t('marketing.auth.register.emailDuplicate'));
        toast.error(t('marketing.auth.register.emailDuplicate'));
        emailRef.current?.focus();
      } else if (res.error === 'network') {
        toast.error(t('marketing.auth.register.toastNetwork'));
      } else {
        toast.error(t('marketing.auth.register.toastGeneric'));
      }
      return;
    }

    /* created + silently signed in (register() opens the session itself) */
    setPhase('success');
    toast(t('marketing.auth.register.toastCreated'));
    const dest =
      next && next.startsWith('/subscribe')
        ? next
        : next
          ? `/subscribe?next=${encodeURIComponent(next)}`
          : '/subscribe';
    setTimeout(() => navigate(dest, { replace: true }), reduce ? 150 : 600);
  };

  const fieldShell = 'group text-left';
  const labelCls =
    'mb-8 block text-micro uppercase text-muted transition-colors duration-150 group-focus-within:text-cyan';

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-16 py-96">
      <MovieWall items={wallItems.length ? wallItems : undefined} />
      <div className="absolute inset-0 bg-deep/40" aria-hidden />
      <motion.div
        className="glass-3 w-full max-w-[460px] rounded-2xl p-28 md:p-40 max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring.smooth}
      >
        <motion.form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col items-stretch gap-16 text-center"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <Link to="/" aria-label={t('marketing.auth.register.homeAria')} className="focusable inline-block rounded-lg">
              <LogoMark height={48} glow />
            </Link>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <p className="text-micro uppercase tracking-[0.3em] text-cyan">{t('marketing.auth.register.eyebrow')}</p>
            <h1 className="mt-8 font-display text-[1.75rem] leading-[1.2] tracking-[-0.03em] text-ink md:text-display-l">
              {t('marketing.auth.register.title')}
            </h1>
            <p className="mt-8 text-caption text-muted">
              {t('marketing.auth.register.sub')}
            </p>
          </motion.div>

          {/* name */}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className={fieldShell}>
            <label htmlFor="reg-name" className={labelCls}>
              {t('marketing.auth.register.nameLabel')}
            </label>
            <input
              id="reg-name"
              ref={nameRef}
              type="text"
              autoComplete="name"
              placeholder={t('marketing.auth.register.namePlaceholder')}
              value={name}
              disabled={busy}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              onBlur={() => {
                if (name.length > 0 && name.trim().length < 2) setNameError(t('marketing.auth.register.nameError'));
              }}
              className={cn(inputCls, nameError ? 'border-error' : focusGlow, busy && 'opacity-60')}
            />
            {nameError && (
              <p className="mt-8 flex items-center gap-6 text-caption text-error">
                <AlertCircle size={16} strokeWidth={1.75} />
                {nameError}
              </p>
            )}
          </motion.div>

          {/* email */}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className={fieldShell}>
            <label htmlFor="reg-email" className={labelCls}>
              {t('marketing.auth.register.emailLabel')}
            </label>
            <input
              id="reg-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t('marketing.auth.register.emailPlaceholder')}
              value={email}
              disabled={busy}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              onBlur={() => {
                if (email.length > 0 && !EMAIL_RE.test(email)) {
                  setEmailError(t('marketing.auth.register.emailInvalid'));
                }
              }}
              className={cn(inputCls, emailError ? 'border-error' : focusGlow, busy && 'opacity-60')}
            />
            {emailError && (
              <p className="mt-8 flex items-center justify-between gap-6 text-caption text-error">
                <span className="flex items-center gap-6">
                  <AlertCircle size={16} strokeWidth={1.75} />
                  {emailError}
                </span>
                {emailError === t('marketing.auth.register.emailDuplicate') && (
                  <Link to="/login" className="focusable rounded-sm text-cyan hover:underline">
                    {t('marketing.auth.register.signInInstead')} <ArrowRight size={14} strokeWidth={1.75} className="inline" />
                  </Link>
                )}
              </p>
            )}
          </motion.div>

          {/* password + chips + meter */}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className={fieldShell}>
            <label htmlFor="reg-password" className={labelCls}>
              {t('marketing.auth.register.passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('marketing.auth.register.passwordPlaceholder')}
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputCls, 'pr-48', focusGlow, busy && 'opacity-60')}
              />
              <button
                type="button"
                aria-label={showPw ? t('marketing.auth.register.hidePassword') : t('marketing.auth.register.showPassword')}
                onClick={() => setShowPw((v) => !v)}
                className="focusable absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-8 text-muted hover:text-ink"
              >
                {showPw ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
              </button>
            </div>

            {/* live requirement chips */}
            <motion.div
              className="mt-8 flex flex-wrap gap-16"
              animate={pulse > 0 && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <RequirementChip met={reqLen} label={t('marketing.auth.register.reqChars')} reduce={reduce ?? false} />
              <RequirementChip met={reqNumSym} label={t('marketing.auth.register.reqNumSym')} reduce={reduce ?? false} />
            </motion.div>

            {/* strength meter */}
            <div className="mt-8 flex items-center gap-8">
              <div className="flex flex-1 gap-4">
                {[1, 2, 3, 4].map((seg) => (
                  <span
                    key={seg}
                    className={cn(
                      'h-3 flex-1 rounded-sm transition-colors duration-150',
                      score >= seg ? STRENGTH_COLORS[score] : 'bg-white/[.08]',
                      score === 4 && seg === 4 && 'shadow-[0_0_8px_rgba(124,217,236,.4)]',
                    )}
                  />
                ))}
              </div>
              {score > 0 && (
                <span
                  className={cn(
                    'text-caption',
                    score === 1 ? 'text-error' : score === 2 ? 'text-warn' : 'text-cyan',
                  )}
                >
                  {score > 0 && t(`marketing.auth.register.strength.${STRENGTH_KEYS[score]}`)}
                </span>
              )}
            </div>
          </motion.div>

          {/* confirm */}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className={fieldShell}>
            <label htmlFor="reg-confirm" className={labelCls}>
              {t('marketing.auth.register.confirmLabel')}
            </label>
            <input
              id="reg-confirm"
              ref={confirmRef}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('marketing.auth.register.confirmPlaceholder')}
              value={confirm}
              disabled={busy}
              onChange={(e) => {
                setConfirm(e.target.value);
                setConfirmError(null);
              }}
              onBlur={() => {
                if (confirm.length > 0 && confirm !== password) setConfirmError(t('marketing.auth.register.confirmError'));
              }}
              className={cn(
                inputCls,
                confirmError
                  ? 'border-error shadow-[0_0_0_2px_rgba(255,77,109,.9),0_0_24px_rgba(255,77,109,.35)]'
                  : focusGlow,
                busy && 'opacity-60',
              )}
            />
            {confirmError && (
              <p className="mt-8 flex items-center gap-6 text-caption text-error">
                <AlertCircle size={16} strokeWidth={1.75} />
                {confirmError}
              </p>
            )}
          </motion.div>

          {/* submit */}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'focusable inline-flex w-full items-center justify-center gap-8 rounded-full px-24 py-12 font-sans text-caption font-bold transition-[filter,box-shadow,background] duration-150 select-none',
                phase === 'success'
                  ? 'bg-signature text-deep'
                  : 'bg-chrome text-deep shadow-btn-glow hover:brightness-110 active:scale-[0.97]',
                'disabled:opacity-40 disabled:pointer-events-none',
              )}
            >
              {phase === 'loading' ? (
                <>
                  <Spinner /> {t('marketing.auth.register.creating')}
                </>
              ) : phase === 'success' ? (
                <>
                  <Check size={18} strokeWidth={2.5} /> {t('marketing.auth.register.created')}
                </>
              ) : (
                t('marketing.auth.register.createAccount')
              )}
            </button>
          </motion.div>

          {/* legal */}
          <motion.p
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="text-caption text-muted"
          >
            {t('marketing.auth.register.legalPre')}
            <Link to="/support#terms" className="focusable rounded-sm text-ink hover:text-cyan">
              {t('marketing.auth.register.legalTerms')}
            </Link>
            {t('marketing.auth.register.legalMid')}
            <Link to="/support#privacy" className="focusable rounded-sm text-ink hover:text-cyan">
              {t('marketing.auth.register.legalPrivacy')}
            </Link>
            .
          </motion.p>

          {/* divider + links */}
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center gap-12" aria-hidden>
            <span className="h-px flex-1 bg-white/[.08]" />
            <span className="text-micro uppercase text-muted">{t('marketing.auth.register.divider')}</span>
            <span className="h-px flex-1 bg-white/[.08]" />
          </motion.div>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="flex flex-col items-center gap-12 text-caption md:flex-row md:justify-between"
          >
            <Link
              to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
              className="focusable rounded-sm text-cyan underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-cyan"
            >
              {t('marketing.auth.register.signIn')}
            </Link>
            <Link
              to="/subscribe"
              className="focusable inline-flex items-center gap-6 rounded-sm text-muted transition-colors hover:text-ink"
            >
              <Sparkles size={16} strokeWidth={1.75} />
              {t('marketing.auth.register.seePremium')}
            </Link>
          </motion.div>

          {demoMode && (
            <motion.p
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              className="flex items-center justify-center gap-8 text-micro uppercase text-muted"
            >
              <span className="h-8 w-8 rounded-full bg-warn" />
              {t('marketing.auth.register.demo')}
            </motion.p>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
}
