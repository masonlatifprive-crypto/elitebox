/**
 * Marketing footer (design.md §10.2): deep navy, gradient hairline, 4 columns
 * (Brand / Explore / Product / Legal), bottom bar with copyright + version.
 */
import { Link } from 'react-router-dom';
import { Globe, Monitor, Smartphone, Tv } from 'lucide-react';
import { Logo, LogoMark } from '@/components/Logo';
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
] as const;

export default function Footer() {
  const t = useT();

  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#02040a] pt-20 pb-10 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-6" />
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              The ultimate streaming dashboard for the elite. Organize, discover, and enjoy your media collection in style.
            </p>
            <div className="mt-6">
              <LanguageSwitch />
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Explore</h4>
            <ul className="space-y-4">
              {EXPLORE.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-zinc-500 hover:text-cyan-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-4">
              {PRODUCT.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-zinc-500 hover:text-cyan-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="space-y-4">
              {LEGAL.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-zinc-500 hover:text-cyan-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-zinc-500 text-xs tracking-wider font-medium">
              ELITEBOX v2.0.4 • © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-8 text-zinc-500 text-xs">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-zinc-700" />
              <span>Global CDN</span>
            </div>
            <div className="flex items-center gap-2">
              <Tv size={14} className="text-zinc-700" />
              <span>TV Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-zinc-700" />
              <span>Mobile Sync</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
