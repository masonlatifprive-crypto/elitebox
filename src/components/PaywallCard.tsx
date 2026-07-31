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

const FEATURES = [
  'Every movie and series in the catalog',
  'HD and 4K playback where the source provides it',
  'Web, Windows, Android and Android TV — one subscription',
  'Cancel anytime. Access runs to the end of your paid month.',
];

export default function PaywallCard({
  title = "This one's for members.",
  message = 'One subscription. Every movie and series in the catalog.',
  className,
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  const demoMode = useAuth((s) => s.demoMode);
  const price = usePremiumPrice();
  const code = useCurrency((s) => s.code);
  const setCode = useCurrency((s) => s.setCode);

  return (
    <motion.div
      role="dialog"
      aria-label="Elitebox Premium"
      className={cn('glass-3 w-full max-w-[420px] rounded-2xl p-28 md:p-40', className)}
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={spring.smooth}
    >
      <div className="flex flex-col items-center gap-16 text-center">
        <p className="text-micro uppercase tracking-[0.3em] text-cyan">Elitebox Premium</p>

        <div className="flex flex-col gap-8">
          <h2 className="font-display text-title text-ink">{title}</h2>
          <p className="text-caption text-muted">{message}</p>
        </div>

        {/* chrome price lockup + currency choice */}
        <p className="font-display text-[2.5rem] leading-none font-extrabold tracking-[-0.03em]">
          <span className="text-chrome">{price.text}</span>
          <span className="text-title text-muted">/month</span>
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
        <p className="text-body-l text-ink">Every movie and series in the catalog. One monthly price.</p>

        <ul className="flex flex-col gap-12 self-start text-left">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-12 text-caption text-ink">
              <Check size={16} strokeWidth={2} className="mt-2 shrink-0 text-cyan" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {demoMode && (
          <p className="glass-1 inline-flex items-center gap-8 rounded-full px-12 py-6 text-micro uppercase text-warn">
            <FlaskConical size={14} strokeWidth={1.75} />
            Demo mode — no real charge
          </p>
        )}

        <div className="flex w-full flex-col gap-12">
          <ButtonPrimary to="/subscribe" className="w-full py-14">
            Subscribe — $4.99/month
          </ButtonPrimary>
          <ButtonGhost to="/login" className="w-full">
            Sign in
          </ButtonGhost>
        </div>
      </div>
    </motion.div>
  );
}
