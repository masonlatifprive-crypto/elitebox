import { Link } from 'react-router-dom';
import { Globe, Monitor, Smartphone, Tv } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitch from './LanguageSwitch';
import useT from '../i18n';

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
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#02040a] border-t border-white/5 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block group mb-6">
              <Logo className="h-8 w-auto transition-transform duration-300 group-hover:scale-105" />
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mb-8">
              The ultimate streaming dashboard for your personal media collection.
              Organize, discover, and enjoy your content with unprecedented elegance.
            </p>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
                <Tv className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-6">Explore</h3>
            <ul className="space-y-4">
              {EXPLORE.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-zinc-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-6">Product</h3>
            <ul className="space-y-4">
              {PRODUCT.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-zinc-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-6">Legal</h3>
            <ul className="space-y-4 mb-8">
              {LEGAL.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-zinc-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <LanguageSwitch />
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-zinc-500 text-xs">
            © {year} EliteBoxMovies. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-zinc-500 text-xs">
            <span>v2.1.0-alpha</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
