/**
 * Subscribe — `/subscribe` (subscribe.md). One plan, one price, two trusted
 * ways to pay: Elitebox Premium — $4.99/monthnth. Handles provider return states
 * (?status=success / ?status=canceled, plus legacy ?canceled=1), anonymous
 * pre-step, already-subscribed state, and a mandatory, honestly labeled demo
 * mode when no live payment keys exist.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  Lock,
  RefreshCcw,
  Shield,
  User,
  Wallet,
  XCircle,
} from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { ButtonGhost, ButtonNeon, ButtonPrimary, spring, toast } from '@/components/ui-elite';
import { LogoMark } from '@/components/Logo';
import { hasAccessFor, useAuth } from '@/lib/auth';
import type { PayMethod } from '@/lib/auth';
import { cn } from '@/lib/utils';

const FEATURES = [
  'Every movie and series in the catalog',
  'HD and 4K playback where the source provides it',
  'Web, Windows, Android and Android TV — one subscription',
  'Watch progress and library sync across your devices',
  'Cancel anytime. Access runs to the end of your paid month.',
];

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-20 w-20 animate-spin rounded-full border-2 border-deep/30 border-t-deep"
    />
  );
}

/** $0 → $5 count-up, 500ms out-expo, starts +200ms (disabled for reduced motion). */
function PriceCountUp() {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? 5 : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now() + 200;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 500));
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(eased * 5));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  return (
    <p className="flex items-baseline justify-center gap-8">
      <span className="font-display text-[2.75rem] leading-none tracking-[-0.04em] md:text-display-2xl">
        <span className="text-chrome">${value}</span>
      </span>
      <span className="font-display text-title text-muted">/month</span>
    </p>
  );
}

/** S3 success emblem — gradient ring draws, check pops. */
function SuccessEmblem({ demo }: { demo: boolean }) {
  const reduce = useReducedMotion();
  const stroke = demo ? 'var(--warn)' : 'var(--cyan)';
  return (
    <div className="relative mx-auto h-72 w-72">
      <svg width={72} height={72} viewBox="0 0 72 72" fill="none" aria-hidden>
        <motion.circle
          cx={36}
          cy={36}
          r={32}
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ strokeDasharray: 202 }}
          initial={{ strokeDashoffset: 202 }}
          animate={{ strokeDashoffset: 0 }}
          transition={reduce ? { duration: 0.15 } : { duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? { duration: 0.15 } : { ...spring.snappy, delay: 0.2 }}
      >
        <Check size={28} strokeWidth={2.5} style={{ color: stroke }} />
      </motion.div>
    </div>
  );
}

export default function Subscribe() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const user = useAuth((s) => s.user);
  const subscription = useAuth((s) => s.subscription);
  const demoMode = useAuth((s) => s.demoMode);
  const subscribe = useAuth((s) => s.subscribe);
  const refreshSubscription = useAuth((s) => s.refreshSubscription);
  const reduce = useReducedMotion();

  const [method, setMethod] = useState<PayMethod>('card');
  const [processing, setProcessing] = useState(false);
  const toastFired = useRef(false);

  const status = params.get('status') ?? (params.get('canceled') === '1' ? 'canceled' : null);
  const next = params.get('next');
  const subscribed = hasAccessFor(subscription);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  /* success toast fires once per success arrival (subscribe.md §S3) */
  useEffect(() => {
    if (status === 'success' && subscribed && !toastFired.current) {
      toastFired.current = true;
      toast('Premium active. The whole catalog is open.');
    }
  }, [status, subscribed]);

  const startWatchingTarget = next && next.startsWith('/') ? next : '/app';

  const onSubscribe = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      if (demoMode) {
        /* simulated checkout — 1.2s processing, never a real charge */
        await new Promise((r) => setTimeout(r, reduce ? 200 : 1200));
        const res = await subscribe(method);
        if (res.ok) {
          setParams(next ? { status: 'success', next } : { status: 'success' }, { replace: true });
        } else {
          toast.error("Couldn't open checkout. Try again in a moment.");
        }
      } else {
        const res = await subscribe(method);
        /* live mode usually redirects to the provider; a resolved ok means the
           graceful demo fallback engaged (network down) or status updated */
        if (res.ok && hasAccessFor(useAuth.getState().subscription)) {
          setParams(next ? { status: 'success', next } : { status: 'success' }, { replace: true });
        } else if (!res.ok) {
          toast('Payment service is unreachable. Nothing was charged — try again.');
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const resetToPlan = () => {
    const nextParams: Record<string, string> = {};
    if (next) nextParams.next = next;
    setParams(nextParams, { replace: true });
  };

  const ctaLabel = processing
    ? demoMode
      ? 'Processing demo payment…'
      : method === 'paypal'
        ? 'Redirecting to PayPal…'
        : 'Opening secure checkout…'
    : demoMode
      ? 'Subscribe — Demo'
      : method === 'paypal'
        ? 'Continue with PayPal'
        : 'Subscribe — $4.99/month';

  const tiles: { id: PayMethod; label: string; caption: string; Icon: typeof CreditCard }[] = [
    { id: 'card', label: 'Card', caption: 'Secure checkout by Stripe', Icon: CreditCard },
    { id: 'paypal', label: 'PayPal', caption: 'Pay with your PayPal account', Icon: Wallet },
  ];

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-16 py-96">
      <motion.div
        className="flex w-full max-w-[560px] flex-col items-stretch gap-24"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.45, ease: 'easeOut' }}
      >
        <LogoMark height={48} className="self-center" />
        {/* ── S4 — canceled ─────────────────────────────────────────── */}
        {status === 'canceled' ? (
          <motion.div
            className="glass-3 flex flex-col items-center gap-16 rounded-2xl p-28 text-center md:p-40"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.smooth}
          >
            <XCircle size={48} strokeWidth={1.75} className="text-muted" />
            <h1 className="font-display text-display-l text-ink">Checkout canceled.</h1>
            <p className="max-w-[46ch] text-caption text-muted">
              No charge was made. The free catalog is always open, and Premium is here whenever
              you're ready.
            </p>
            <div className="flex w-full flex-col gap-12 sm:flex-row sm:justify-center">
              <ButtonPrimary onClick={resetToPlan} className="py-12">
                Try again
              </ButtonPrimary>
              <ButtonGhost to="/app">Back to browsing</ButtonGhost>
            </div>
          </motion.div>
        ) : status === 'success' && subscribed ? (
          /* ── S3 — success ─────────────────────────────────────────── */
          <motion.div
            className="glass-3 flex flex-col items-center gap-16 rounded-2xl p-28 text-center md:p-40"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.smooth}
          >
            <SuccessEmblem demo={Boolean(subscription?.demo)} />
            <h1 className="font-display text-display-l">
              <span className="text-chrome">You're in.</span>
            </h1>
            <p className="max-w-[46ch] text-caption text-muted">
              Elitebox Premium is active on this account. Every movie and series in the catalog is
              open — press play on anything.
            </p>
            {subscription?.demo && (
              <p className="text-micro uppercase text-warn">
                Demo mode — no real charge. Premium is active locally on this device.
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-12 text-caption">
              <span className="glass-1 rounded-full px-12 py-6 font-mono text-micro uppercase text-ink">
                Premium — $4.99/month
              </span>
              {subscription?.renewsAt && (
                <span className="text-muted">
                  Renews <span className="font-mono">{formatDate(subscription.renewsAt)}</span>
                </span>
              )}
            </div>
            <div className="flex w-full flex-col gap-12 sm:flex-row sm:justify-center">
              <ButtonPrimary to={startWatchingTarget} className="py-12">
                Start watching
              </ButtonPrimary>
              <ButtonNeon to="/app/account">View account</ButtonNeon>
            </div>
          </motion.div>
        ) : subscribed ? (
          /* ── already subscribed ───────────────────────────────────── */
          <motion.div
            className="glass-3 flex flex-col items-center gap-16 rounded-2xl p-28 text-center md:p-40"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.smooth}
          >
            <CheckCircle2 size={48} strokeWidth={1.75} className="text-cyan" />
            <h1 className="font-display text-display-l text-ink">
              Premium is already active on this account.
            </h1>
            <div className="flex w-full flex-col gap-12 sm:flex-row sm:justify-center">
              <ButtonPrimary to="/app" className="py-12">
                Open the app
              </ButtonPrimary>
              <ButtonGhost to="/app/account">Manage subscription</ButtonGhost>
            </div>
          </motion.div>
        ) : (
          /* ── S1 — plan hero ───────────────────────────────────────── */
          <>
            <motion.p
              className="text-center text-micro uppercase tracking-[0.3em] text-cyan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              Elitebox Premium
            </motion.p>

            {!user && (
              <p className="glass-1 mx-auto inline-flex items-center gap-8 rounded-full px-12 py-6 text-caption text-ink">
                <User size={14} strokeWidth={1.75} className="text-cyan" />
                You'll create a free account first.
              </p>
            )}

            <motion.div
              className="relative rounded-2xl p-[1.5px] shadow-[0_0_32px_rgba(139,124,232,.18)]"
              style={{ background: 'var(--gradient-signature)' }}
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={spring.smooth}
            >
              <div className="glass-3 flex flex-col gap-24 rounded-2xl p-28 md:p-40">
                <PriceCountUp />
                <p className="text-center text-body-l text-ink">
                  Every movie and series in the catalog. Cancel anytime.
                </p>

                <ul className="flex flex-col gap-12 self-start">
                  {FEATURES.map((f, i) => (
                    <motion.li
                      key={f}
                      className="flex items-start gap-12 text-caption text-ink"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={reduce ? { duration: 0.15 } : { delay: 0.3 + i * 0.05, duration: 0.3 }}
                    >
                      <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
                      <span>{f}</span>
                    </motion.li>
                  ))}
                </ul>

                <span className="h-px bg-white/[.08]" aria-hidden />

                {!user ? (
                  <ButtonPrimary
                    to={`/register?next=${encodeURIComponent(next ? `/subscribe?next=${encodeURIComponent(next)}` : '/subscribe')}`}
                    className="w-full py-12"
                  >
                    Create account &amp; continue
                  </ButtonPrimary>
                ) : (
                  <div className="flex flex-col gap-16">
                    {/* payment method selector */}
                    <div role="radiogroup" aria-label="Pay with">
                      <p className="mb-12 text-micro uppercase text-muted">Pay with</p>
                      <div className="grid grid-cols-1 gap-12 min-[400px]:grid-cols-2">
                        {tiles.map(({ id, label, caption, Icon }) => {
                          const selected = method === id;
                          return (
                            <motion.button
                              key={id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setMethod(id)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: selected ? 1 : 0.7, scale: 1 }}
                              transition={spring.snappy}
                              className={cn(
                                'focusable glass-1 relative flex flex-col items-center gap-8 rounded-xl px-16 py-20 text-center transition-[border-color,box-shadow,transform] duration-150',
                                selected
                                  ? 'border-[1.5px] border-cyan shadow-[0_0_0_2px_rgba(124,217,236,.9),0_0_24px_rgba(124,217,236,.45)]'
                                  : 'border-white/[.08] hover:border-white/20 hover:-translate-y-2',
                              )}
                            >
                              {selected && (
                                <motion.span
                                  className="absolute right-8 top-8 text-cyan"
                                  initial={{ scale: 0.5 }}
                                  animate={{ scale: 1 }}
                                  transition={spring.snappy}
                                >
                                  <CheckCircle2 size={16} strokeWidth={2} />
                                </motion.span>
                              )}
                              <Icon size={24} strokeWidth={1.75} className={selected ? 'text-cyan' : 'text-muted'} />
                              <span className="text-body font-semibold text-ink">{label}</span>
                              <span className="text-micro uppercase text-muted">{caption}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {demoMode && (
                      <p className="glass-1 mx-auto inline-flex items-center gap-8 rounded-full px-12 py-6 text-micro uppercase text-warn">
                        <FlaskConical size={14} strokeWidth={1.75} />
                        Demo mode — no real charge
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={onSubscribe}
                      disabled={processing}
                      className="focusable inline-flex w-full items-center justify-center gap-8 rounded-full bg-chrome px-24 py-12 font-sans text-caption font-bold text-deep shadow-btn-glow transition-[filter,box-shadow] duration-150 select-none hover:brightness-110 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {processing && <Spinner />}
                      {ctaLabel}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* trust row */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-24 text-caption text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.35 }}
            >
              {!demoMode && (
                <span className="inline-flex items-center gap-8">
                  <Lock size={16} strokeWidth={1.75} /> Payments processed by Stripe or PayPal
                </span>
              )}
              <span className="inline-flex items-center gap-8">
                <Shield size={16} strokeWidth={1.75} /> Elitebox never sees your card number
              </span>
              <span className="inline-flex items-center gap-8">
                <RefreshCcw size={16} strokeWidth={1.75} /> Cancel anytime from Account
              </span>
            </motion.div>

            {/* fine print */}
            <motion.div
              className="flex flex-col items-center gap-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.35 }}
            >
              <p className="max-w-[46ch] text-micro uppercase text-muted/70">
                Recurring monthly billing through your chosen payment provider. Cancel anytime —
                Premium stays active until the end of the current paid period. Prices in USD.
              </p>
              {demoMode && (
                <p className="max-w-[46ch] text-micro uppercase text-muted/70">
                  Demo mode: checkout is simulated and no payment method is charged.
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="focusable rounded-sm text-caption text-muted transition-colors hover:text-ink"
              >
                Not ready? Keep browsing the free catalog <ArrowRight size={14} strokeWidth={1.75} className="inline" />
              </button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
