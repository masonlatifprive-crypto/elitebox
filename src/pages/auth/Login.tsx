/**
 * Login — `/login` (login.md). One focused glass-3 card on the nebula
 * ambience: logo lockup, "CLIENT SIGN IN" eyebrow, "Welcome back." headline,
 * email + password with glow focus and blur validation, loading/success
 * button morph, error shake + toasts, ?next= redirect support.
 */
import { memo, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Check, Clock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import MovieWall from '@/components/MovieWall';
import { spring, toast } from '@/components/ui-elite';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  'w-full rounded-lg border bg-white/[.04] px-16 py-12 text-body text-ink caret-cyan placeholder:text-muted/60 transition-[border-color,box-shadow] duration-150 focus:outline-none';

/* isolated perpetual loop — logo glow breathe (memo, design.md §14) */
const LogoBreathe = memo(function LogoBreathe() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { opacity: [0.65, 1, 0.65] }}
      transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <LogoMark height={48} glow />
    </motion.div>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-20 w-20 animate-spin rounded-full border-2 border-deep/30 border-t-deep"
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useAuth((s) => s.login);
  const demoMode = useAuth((s) => s.demoMode);
  const reduce = useReducedMotion();

  const next = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success'>('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [expiredShown, setExpiredShown] = useState(params.get('reason') === 'expired');
  const pwRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  const busy = phase !== 'idle';
  const canSubmit = email.length > 0 && password.length > 0 && !busy;

  /* loading watchdog — 4s → honest timeout toast (login.md States) */
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = reqId.current;
    const t = setTimeout(() => {
      if (reqId.current === id) {
        reqId.current += 1;
        setPhase('idle');
        toast.error('This is taking too long. Try again.');
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [phase]);

  const dismissExpired = () => setExpiredShown(false);

  const onEmailBlur = () => {
    if (email.length > 0 && !EMAIL_RE.test(email)) {
      setEmailError("That doesn't look like an email address.");
    } else {
      setEmailError(null);
    }
  };

  const fail = (message: string) => {
    toast.error(message);
    setSubmitError(true);
    setShakeKey((k) => k + 1);
    setPassword('');
    setPhase('idle');
    requestAnimationFrame(() => pwRef.current?.focus());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!EMAIL_RE.test(email)) {
      setEmailError("That doesn't look like an email address.");
      return;
    }
    const id = ++reqId.current;
    setPhase('loading');
    setSubmitError(false);
    const res = await login(email, password);
    if (reqId.current !== id) return; // superseded by the watchdog

    if (!res.ok) {
      if (res.error === 'unknown') {
        fail('No account found for that email. Create one in seconds.');
      } else if (res.error === 'network') {
        fail("Can't reach the server. Check your connection and try again.");
      } else {
        fail('Incorrect email or password.');
      }
      return;
    }

    setPhase('success');
    toast('Signed in. Picking up where you left off.');
    const target = next && next.startsWith('/') ? next : '/app';
    setTimeout(() => navigate(target, { replace: true }), reduce ? 150 : 600);
  };

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-16 py-96">
      <MovieWall />
      <div className="absolute inset-0 bg-deep/40" aria-hidden />
      <motion.div
        key={shakeKey}
        className="glass-3 w-full max-w-[420px] rounded-2xl p-28 md:p-40"
        initial={
          shakeKey === 0 ? { opacity: 0, scale: 0.96, y: 16 } : { opacity: 1, scale: 1, y: 0 }
        }
        animate={
          shakeKey > 0 && !reduce
            ? { opacity: 1, scale: 1, y: 0, x: [0, -8, 8, -4, 0] }
            : { opacity: 1, scale: 1, y: 0, x: 0 }
        }
        transition={shakeKey > 0 && !reduce ? { x: { duration: 0.4 }, ...spring.smooth } : spring.smooth}
      >
        <motion.form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col items-stretch gap-16 text-center"
          initial={shakeKey === 0 ? 'hidden' : false}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <Link to="/" aria-label="Elitebox home" className="focusable inline-block rounded-lg">
              <LogoBreathe />
            </Link>
          </motion.div>

          {expiredShown && (
            <motion.p
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              className="glass-1 mx-auto inline-flex items-center gap-8 rounded-full px-12 py-6 text-caption text-warn"
            >
              <Clock size={14} strokeWidth={1.75} />
              Your session expired — sign in again.
            </motion.p>
          )}

          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <p className="text-micro uppercase tracking-[0.3em] text-cyan">Member sign in</p>
            <h1 className="mt-8 font-display text-[1.75rem] leading-[1.2] tracking-[-0.03em] text-ink md:text-display-l">
              Welcome back.
            </h1>
            <p className="mt-8 text-caption text-muted">
              Sign in to keep watching. Your progress, library and addons are right where you left
              them.
            </p>
          </motion.div>

          {/* email */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="group text-left"
          >
            <label
              htmlFor="login-email"
              className="mb-8 block text-micro uppercase text-muted transition-colors duration-150 group-focus-within:text-cyan"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              disabled={busy}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
                dismissExpired();
              }}
              onBlur={onEmailBlur}
              className={cn(
                inputCls,
                emailError
                  ? 'border-error'
                  : 'border-white/[.08] focus:border-cyan focus:shadow-[0_0_0_2px_rgba(124,217,236,.9),0_0_24px_rgba(124,217,236,.45)]',
                busy && 'opacity-60',
              )}
            />
            {emailError && (
              <p className="mt-8 flex items-center gap-6 text-caption text-error">
                <AlertCircle size={16} strokeWidth={1.75} />
                {emailError}
              </p>
            )}
          </motion.div>

          {/* password */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="group text-left"
          >
            <label
              htmlFor="login-password"
              className="mb-8 block text-micro uppercase text-muted transition-colors duration-150 group-focus-within:text-cyan"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                ref={pwRef}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                disabled={busy}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSubmitError(false);
                  dismissExpired();
                }}
                className={cn(
                  inputCls,
                  'pr-48',
                  submitError
                    ? 'border-error shadow-[0_0_0_2px_rgba(255,77,109,.9),0_0_24px_rgba(255,77,109,.35)]'
                    : 'border-white/[.08] focus:border-cyan focus:shadow-[0_0_0_2px_rgba(124,217,236,.9),0_0_24px_rgba(124,217,236,.45)]',
                  busy && 'opacity-60',
                )}
              />
              <button
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((v) => !v)}
                className="focusable absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-8 text-muted hover:text-ink"
              >
                {showPw ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
              </button>
            </div>
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
                  <Spinner /> Signing in…
                </>
              ) : phase === 'success' ? (
                <>
                  <Check size={18} strokeWidth={2.5} /> Signed in
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </motion.div>

          {/* divider */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="flex items-center gap-12"
            aria-hidden
          >
            <span className="h-px flex-1 bg-white/[.08]" />
            <span className="text-micro uppercase text-muted">New to Elitebox</span>
            <span className="h-px flex-1 bg-white/[.08]" />
          </motion.div>

          {/* links */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="flex flex-col items-center gap-12 text-caption md:flex-row md:justify-between"
          >
            <Link
              to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
              className="focusable rounded-sm text-cyan underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-cyan"
            >
              Create account
            </Link>
            <Link
              to="/subscribe"
              className="focusable inline-flex items-center gap-6 rounded-sm text-muted transition-colors hover:text-ink"
            >
              <Sparkles size={16} strokeWidth={1.75} />
              See Premium
            </Link>
          </motion.div>

          {demoMode && (
            <motion.p
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              className="flex items-center justify-center gap-8 text-micro uppercase text-muted"
            >
              <span className="h-8 w-8 rounded-full bg-warn" />
              Demo mode — accounts are stored on this device only.
            </motion.p>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
}
