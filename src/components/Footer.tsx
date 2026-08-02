/**
 * Marketing footer (design.md §10.2): deep navy, gradient hairline, 4 columns
 * (Brand / Explore / Product / Legal), bottom bar with copyright + version.
 */
import { Link } from 'react-router';
import { Globe, Monitor, Smartphone, Tv } from 'lucide-react';
import Logo, { LogoMark } from '@/components/Logo';
import LanguageSwitch from '@/components/LanguageSwitch';
import { useT } from '@/i18n';

const EXPLORE = [
  { to: '/', label: 'Movies' },
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/providers', label: 'Addons' },
  { to: '/community', label: 'Community' },
  { to: '/support', label: 'Support' },
] as const;

const PRODUCT = [
  { to: '/features', label: 'Features' },
  { to: '/downloads', label: 'Downloads' },
  { to: '/technology', label: 'Technology' },
  { to: '/developers', label: 'Addon SDK' },
  { to: '/providers', label: 'Addon Directory' },
  { to: '/updates', label: 'Updates' },
  { to: '/support', label: 'Help Center' },
] as const;

const LEGAL = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/security', label: 'Security' },
  { to: '/support#licenses', label: 'Open content licenses' },
] as const;

const PLATFORMS = [
  { icon: Monitor, label: 'Windows' },
  { icon: Smartphone, label: 'Android' },
  { icon: Globe, label: 'Web' },
  { icon: Tv, label: 'TV' },
];


export default function Footer() {
  const { t } = useT();
  return (
    <footer className="relative z-10 mt-96 bg-deep/80">
      {/* top hairline gradient */}
      <div
        className="h-px w-full bg-signature opacity-40"
        aria-hidden
      />
      <div className="mx-auto max-w-[1280px] px-16 md:px-24 py-64 grid grid-cols-2 md:grid-cols-4 gap-32">
        <div className="col-span-2 md:col-span-1 flex flex-col gap-16">
          <LogoMark height={36} className="self-start" />
          <p className="text-caption text-muted max-w-[28ch]">{t('common.footer.tagline')}</p>
          <div className="flex flex-wrap gap-8">
            {PLATFORMS.map((p) => (
              <span
                key={p.label}
                className="glass-1 inline-flex items-center gap-6 rounded-full px-12 py-6 text-micro text-muted"
              >
                <p.icon size={14} strokeWidth={1.75} />
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <nav aria-label={t('common.footer.explore')} className="flex flex-col gap-12">
          <h3 className="text-micro uppercase text-muted">{t('common.footer.explore')}</h3>
          {EXPLORE.map((l) => (
            <Link key={l.label} to={l.to} className="focusable rounded-sm text-caption text-ink/80 hover:text-cyan transition-colors w-fit">
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label={t('common.footer.product')} className="flex flex-col gap-12">
          <h3 className="text-micro uppercase text-muted">{t('common.footer.product')}</h3>
          {PRODUCT.map((l) => (
            <Link key={l.label} to={l.to} className="focusable rounded-sm text-caption text-ink/80 hover:text-cyan transition-colors w-fit">
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label={t('common.footer.legal')} className="flex flex-col gap-12">
          <h3 className="text-micro uppercase text-muted">{t('common.footer.legal')}</h3>
          {LEGAL.map((l) => (
            <Link key={l.label} to={l.to} className="focusable rounded-sm text-caption text-ink/80 hover:text-cyan transition-colors w-fit">
              {l.label}
            </Link>
          ))}
          <p className="text-[11px] leading-relaxed text-muted/70 max-w-[30ch]">
            {t('common.footer.credits')}
          </p>
        </nav>
      </div>

      <div className="border-t border-white/[.06]">
        <div className="mx-auto max-w-[1280px] px-16 md:px-24 py-24 flex flex-wrap items-center justify-between gap-16">
          <p className="text-caption text-muted">
            © 2026 <Logo size={13} className="mx-2" /> {t('common.footer.bottomLine')}
          </p>
          <div className="flex items-center gap-8">
            <LanguageSwitch />
            <span className="glass-1 rounded-full px-12 py-4 font-mono text-[11px] text-cyan">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
