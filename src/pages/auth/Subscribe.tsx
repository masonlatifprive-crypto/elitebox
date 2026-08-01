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
import { useT } from '@/i18n';

const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
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
  const { t } = useT();
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
      <span className="font-display text-title text-muted">{t('marketing.auth.subscribe.perMonth')}</span>
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
  const { t, locale } = useT();
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
      toast(t('marketing.auth.subscribe.toastActive'));
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
          toast.error(t('marketing.auth.subscribe.toastCheckoutFail'));
        }
      } else {
        const res = await subscribe(method);
        /* live mode usually redirects to the provider; a resolved ok means the
           graceful demo fallback engaged (network down) or status updated */
        if (res.ok && hasAccessFor(useAuth.getState().subscription)) {
          setParams(next ? { status: 'success', next } : { status: 'success' }, { replace: true });
        } else if (!res.ok) {
          toast(t('marketing.auth.subscribe.toastUnreachable'));
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
      ? t('marketing.auth.subscribe.cta.processingDemo')
      : method === 'paypal'
        ? t('marketing.auth.subscribe.cta.redirectPaypal')
        : t('marketing.auth.subscribe.cta.openingCheckout')
    : demoMode
      ? t('marketing.auth.subscribe.cta.subscribeDemo')
      : method === 'paypal'
        ? t('marketing.auth.subscribe.cta.continuePaypal')
        : t('marketing.auth.subscribe.cta.subscribe');

  const tiles: { id: PayMethod; label: string; caption: string; Icon: typeof CreditCard }[] = [
    { id: 'card', label: t('marketing.auth.subscribe.pay.card'), caption: t('marketing.auth.subscribe.pay.cardCaption'), Icon: CreditCard },
    { id: 'paypal', label: t('marketing.auth.subscribe.pay.paypal'), caption: t('marketing.auth.subscribe.pay.paypalCaption'), Icon: Wallet },
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
            <h1 className="font-display text-display-l text-ink">{t('marketing.auth.subscribe.canceled.title')}</h1>
            <p className="max-w-[46ch] text-caption text-muted">
              {t('marketing.auth.subscribe.canceled.copy')}
            </p>
            <div className="flex w-full flex-col gap-12 sm:flex-row sm:justify-center">
              <ButtonPrimary onClick={resetToPlan} className="py-12">
                {t('marketing.auth.subscribe.canceled.tryAgain')}
              </ButtonPrimary>
              <ButtonGhost to="/app">{t('marketing.auth.subscribe.canceled.back')}</ButtonGhost>
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
              <span className="text-chrome">{t('marketing.auth.subscribe.success.title')}</span>
            </h1>
            <p className="max-w-[46ch] text-caption text-muted">
              {t('marketing.auth.subscribe.success.copy')}
            </p>
            {subscription?.demo && (
              <p className="text-micro uppercase text-warn">
                {t('marketing.auth.subscribe.success.demo')}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-12 text-caption">
              <span className="glass-1 rounded-full px-12 py-6 font-mono text-micro uppercase text-ink">
                {t('marketing.auth.subscribe.success.plan')}
              </span>
              {subscription?.renewsAt && (
                <span className="text-muted">
                  {t('marketing.auth.subscribe.success.renews')} <span className="font-mono">{formatDate(subscription.renewsAt, locale)}</span>
                </span>
              )}
            </div>
            <div className="flex w-full flex-col gap-12 sm:flex-row sm:justify-center">
              <ButtonPrimary to={startWatchingTarget} className="py-12">
                {t('marketing.auth.subscribe.success.start')}
              </ButtonPrimary>
              <ButtonNeon to="/app/account">{t('marketing.auth.subscribe.success.account')}</ButtonNeon>
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
              {t('marketing.auth.subscribe.active.title')}
            </h1>
            <div className="flex w-full flex-col gap-12 sm:flex-row sm:justify-center">
              <ButtonPrimary to="/app" className="py-12">
                {t('marketing.auth.subscribe.active.open')}
              </ButtonPrimary>
              <ButtonGhost to="/app/account">{t('marketing.auth.subscribe.active.manage')}</ButtonGhost>
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
              {t('marketing.auth.subscribe.hero.eyebrow')}
            </motion.p>

            {!user && (
              <p className="glass-1 mx-auto inline-flex items-center gap-8 rounded-full px-12 py-6 text-caption text-ink">
                <User size={14} strokeWidth={1.75} className="text-cyan" />
                {t('marketing.auth.subscribe.hero.accountFirst')}
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
                  {t('marketing.auth.subscribe.hero.tagline')}
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
                      <span>{t(`marketing.auth.subscribe.${f}`)}</span>
                    </motion.li>
                  ))}
                </ul>

                <span className="h-px bg-white/[.08]" aria-hidden />

                {!user ? (
                  <ButtonPrimary
                    to={`/register?next=${encodeURIComponent(next ? `/subscribe?next=${encodeURIComponent(next)}` : '/subscribe')}`}
                    className="w-full py-12"
                  >
                    {t('marketing.auth.subscribe.hero.createContinue')}
                  </ButtonPrimary>
                ) : (
                  <div className="flex flex-col gap-16">
                    {/* payment method selector */}
                    <div role="radiogroup" aria-label={t('marketing.auth.subscribe.pay.ariaLabel')}>
                      <p className="mb-12 text-micro uppercase text-muted">{t('marketing.auth.subscribe.pay.label')}</p>
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
                        {t('marketing.auth.subscribe.demoBadge')}
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
                  <Lock size={16} strokeWidth={1.75} /> {t('marketing.auth.subscribe.trust.payments')}
                </span>
              )}
              <span className="inline-flex items-center gap-8">
                <Shield size={16} strokeWidth={1.75} /> {t('marketing.auth.subscribe.trust.card')}
              </span>
              <span className="inline-flex items-center gap-8">
                <RefreshCcw size={16} strokeWidth={1.75} /> {t('marketing.auth.subscribe.trust.cancel')}
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
                {t('marketing.auth.subscribe.fineprint')}
              </p>
              {demoMode && (
                <p className="max-w-[46ch] text-micro uppercase text-muted/70">
                  {t('marketing.auth.subscribe.fineprintDemo')}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="focusable rounded-sm text-caption text-muted transition-colors hover:text-ink"
              >
                {t('marketing.auth.subscribe.keepBrowsing')} <ArrowRight size={14} strokeWidth={1.75} className="inline" />
              </button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
