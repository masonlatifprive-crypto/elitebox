/**
 * PaywallCard (g6) — the in-app Premium upsell shown whenever a client hits
 * member-only content without an active subscription. glass-3 card, chrome
 * price lockup, honest feature list, two real routes — no dead ends.
 */
import { motion } from 'framer-motion';
import { Check, FlaskConical } from 'lucide-react';
import { ButtonGhost, ButtonPrimary, spring } from '@/components/ui-elite';
import { useAuth } from '@/lib/auth';
import { CURRENCIES, useCurrency, usePremiumPrice } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

const FEATURES = ['f1', 'f2', 'f3', 'f4'] as const;

export default function PaywallCard({
  title,
  message,
  className,
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  const { t } = useT();
  const resolvedTitle = title ?? t('marketing.paywall.defaultTitle');
  const resolvedMessage = message ?? t('marketing.paywall.defaultMessage');
  const demoMode = useAuth((s) => s.demoMode);
  const price = usePremiumPrice();
  const code = useCurrency((s) => s.code);
  const setCode = useCurrency((s) => s.setCode);

  return (
    <motion.div
      role="dialog"
      aria-label={t('marketing.paywall.aria')}
      className={cn('glass-3 w-full max-w-[420px] rounded-2xl p-28 md:p-40', className)}
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={spring.smooth}
    >
      <div className="flex flex-col items-center gap-16 text-center">
        <p className="text-micro uppercase tracking-[0.3em] text-cyan">{t('marketing.paywall.eyebrow')}</p>

        <div className="flex flex-col gap-8">
          <h2 className="font-display text-title text-ink">{resolvedTitle}</h2>
          <p className="text-caption text-muted">{resolvedMessage}</p>
        </div>

        {/* chrome price lockup + currency choice */}
        <p className="font-display text-[2.5rem] leading-none font-extrabold tracking-[-0.03em]">
          <span className="text-chrome">{price.text}</span>
          <span className="text-title text-muted">{t('marketing.paywall.perMonth')}</span>
        </p>
        <div className="flex items-center gap-6 rounded-full border border-white/[.10] p-4">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCode(c.code)}
              aria-pressed={code === c.code}
              className={cn(
                'focusable rounded-full px-12 py-5 text-micro uppercase cursor-pointer transition-colors',
                code === c.code ? 'bg-signature text-deep font-bold' : 'text-muted hover:text-ink',
              )}
            >
              {c.code}
            </button>
          ))}
        </div>
        {price.note && <p className="text-[11px] text-muted/70">{price.note}</p>}
        <p className="text-body-l text-ink">{t('marketing.paywall.tagline')}</p>

        <ul className="flex flex-col gap-12 self-start text-left">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-12 text-caption text-ink">
              <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
              <span>{t(`marketing.paywall.${f}`)}</span>
            </li>
          ))}
        </ul>

        {demoMode && (
          <p className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-6 text-micro uppercase text-warn">
            <FlaskConical size={14} strokeWidth={1.75} />
            {t('marketing.paywall.demo')}
          </p>
        )}

        <div className="flex w-full flex-col gap-12">
          <ButtonPrimary to="/subscribe" className="w-full py-14">
            {t('marketing.paywall.subscribe')}
          </ButtonPrimary>
          <ButtonGhost to="/login" className="w-full">
            {t('marketing.paywall.signIn')}
          </ButtonGhost>
        </div>
      </div>
    </motion.div>
  );
}
