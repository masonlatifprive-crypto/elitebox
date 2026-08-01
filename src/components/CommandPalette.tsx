/**
 * CommandPalette — global Ctrl/Cmd+K launcher (mounted once per shell).
 *
 * Three groups: "Go to" (routes for the current shell), "Catalog" (showcase
 * titles → their Detail page) and "Actions" (Subscribe, TV mode, install an
 * addon). Arrow keys move, Enter executes, hover selects, Esc/backdrop close.
 * role="dialog" + aria-modal, autofocus input, Tab cycles within the panel.
 * Open from anywhere with openCommandPalette() (rail/nav buttons use it).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Clapperboard,
  Compass,
  CreditCard,
  Film,
  Home,
  LibraryBig,
  LifeBuoy,
  MonitorPlay,
  Play,
  Puzzle,
  Radio,
  Search,
  Settings,
  Store,
  Tv,
  User,
} from 'lucide-react';
import { SHOWCASE_CATALOG } from '@/data/showcase';
import { toggleTVMode } from '@/lib/tvnav';
import { toast } from '@/components/ui-elite';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const OPEN_EVENT = 'elitebox:command-palette';

/** Open the palette from any component (rail button, marketing nav, …). */
export function openCommandPalette(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

interface PaletteItem {
  id: string;
  group: 'Go to' | 'Catalog' | 'Actions';
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
  keywords?: string;
  run: () => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="glass-1 inline-flex items-center rounded-md px-6 py-2 font-mono text-[10px] uppercase text-muted">
      {children}
    </kbd>
  );
}

export default function CommandPalette() {
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  /* global listeners: Ctrl/Cmd+K toggles, OPEN_EVENT opens */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  /* Electron desktop bridge: Ctrl+Shift+E global shortcut in main.cjs sends
     'open-command-palette' through the preload contextBridge (eliteboxOS). */
  useEffect(() => {
    const os = (
      window as unknown as {
        eliteboxOS?: { onCommand?: (cb: (cmd: string) => void) => (() => void) | void };
      }
    ).eliteboxOS;
    if (!os?.onCommand) return;
    const off = os.onCommand((cmd) => {
      if (cmd === 'open-command-palette') setOpen(true);
    });
    return typeof off === 'function' ? off : undefined;
  }, []);

  /* reset state + autofocus when opened */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const inAppShell = location.pathname.startsWith('/app');

  const items = useMemo<PaletteItem[]>(() => {
    const go = (to: string) => () => navigate(to);
    const goto: PaletteItem[] = inAppShell
      ? [
          { id: 'go-home', group: 'Go to', label: t('app.palette.goHome'), icon: Home, keywords: 'app', run: go('/app') },
          { id: 'go-discover', group: 'Go to', label: t('app.palette.goDiscover'), icon: Compass, run: go('/app/discover') },
          { id: 'go-movies', group: 'Go to', label: t('app.palette.goMovies'), icon: Film, run: go('/app/movies') },
          { id: 'go-series', group: 'Go to', label: t('app.palette.goSeries'), icon: MonitorPlay, run: go('/app/series') },
          { id: 'go-live', group: 'Go to', label: t('app.palette.goLive'), icon: Radio, keywords: 'channels sports', run: go('/app/live') },
          { id: 'go-search', group: 'Go to', label: t('app.palette.goSearch'), icon: Search, run: go('/app/search') },
          { id: 'go-library', group: 'Go to', label: t('app.palette.goLibrary'), icon: LibraryBig, keywords: 'watchlist favorites history', run: go('/app/library') },
          { id: 'go-addons', group: 'Go to', label: t('app.palette.goAddons'), icon: Puzzle, run: go('/app/addons') },
          { id: 'go-stats', group: 'Go to', label: t('app.palette.goStats'), icon: BarChart3, run: go('/app/stats') },
          { id: 'go-settings', group: 'Go to', label: t('app.palette.goSettings'), icon: Settings, run: go('/app/settings') },
          { id: 'go-profiles', group: 'Go to', label: t('app.palette.goProfiles'), icon: User, run: go('/app/profiles') },
          { id: 'go-account', group: 'Go to', label: t('app.palette.goAccount'), icon: CreditCard, keywords: 'subscription billing', run: go('/app/account') },
        ]
      : [
          { id: 'go-home', group: 'Go to', label: t('app.palette.goHome'), icon: Home, keywords: 'movies shows', run: go('/') },
          { id: 'go-sports', group: 'Go to', label: t('app.palette.goSports'), icon: Radio, run: go('/sports') },
          { id: 'go-store', group: 'Go to', label: t('app.palette.goStore'), icon: Store, keywords: 'addons plans', run: go('/store') },
          { id: 'go-support', group: 'Go to', label: t('app.palette.goSupport'), icon: LifeBuoy, keywords: 'help faq', run: go('/support') },
          { id: 'go-app', group: 'Go to', label: t('app.palette.goOpenApp'), icon: Play, keywords: 'elitebox player', run: go('/app') },
          { id: 'go-subscribe', group: 'Go to', label: t('app.palette.goSubscribe'), icon: CreditCard, keywords: 'premium 5 month', run: go('/subscribe') },
        ];

    const catalog: PaletteItem[] = SHOWCASE_CATALOG.map((m) => ({
      id: `cat-${m.id}`,
      group: 'Catalog',
      label: m.name,
      hint: m.type === 'channel' ? t('app.palette.liveChannel') : m.type === 'series' ? t('app.poster.series') : t('app.palette.movie'),
      icon: m.type === 'channel' ? Radio : m.type === 'series' ? MonitorPlay : Clapperboard,
      keywords: `${m.type} ${m.genres.join(' ')}`,
      run: () => navigate(`/app/detail/${m.type}/${m.id}`),
    }));

    const actions: PaletteItem[] = [
      { id: 'act-subscribe', group: 'Actions', label: t('app.palette.openSubscribe'), hint: t('app.palette.subscribeHint'), icon: CreditCard, keywords: 'premium pay billing', run: () => navigate('/subscribe') },
      {
        id: 'act-tv',
        group: 'Actions',
        label: t('app.palette.toggleTv'),
        icon: Tv,
        keywords: '10-foot remote leanback',
        run: () => {
          const on = toggleTVMode();
          toast(on ? t('app.palette.tvOn') : t('app.palette.tvOff'));
        },
      },
      { id: 'act-addon', group: 'Actions', label: t('app.palette.installAddon'), icon: Puzzle, keywords: 'manifest addon install', run: () => navigate('/app/addons') },
    ];

    const q = query.trim().toLowerCase();
    if (!q) {
      return [...goto, ...catalog.slice(0, 4), ...actions];
    }
    const match = (i: PaletteItem) =>
      i.label.toLowerCase().includes(q) || (i.keywords ?? '').toLowerCase().includes(q);
    return [...goto.filter(match), ...catalog.filter(match).slice(0, 6), ...actions.filter(match)];
  }, [query, inAppShell, navigate, t]);

  /* keep selection in range as the list changes */
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, items.length - 1)));
  }, [items.length]);

  const runItem = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return;
      close();
      item.run();
    },
    [close],
  );

  /* keyboard handling while open: Esc, arrows, Enter, Tab trap */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setActive((a) => (items.length === 0 ? 0 : (a + 1) % items.length));
        return;
      }
      if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setActive((a) => (items.length === 0 ? 0 : (a - 1 + items.length) % items.length));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        runItem(items[active]);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, items, active, close, runItem]);

  /* group boundaries for section labels */
  const groups = useMemo(() => {
    const order: Array<{ group: PaletteItem['group']; name: string }> = [
      { group: 'Go to', name: t('app.palette.groupGoTo') },
      { group: 'Catalog', name: t('app.palette.groupCatalog') },
      { group: 'Actions', name: t('app.palette.groupActions') },
    ];
    return order
      .map((g) => ({ name: g.name, start: items.findIndex((i) => i.group === g.group) }))
      .filter((g) => g.start !== -1);
  }, [items, t]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-start justify-center px-16 pt-[18dvh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.1 : 0.15 }}
        >
          <div
            className="absolute inset-0 bg-deep/70 backdrop-blur-[8px]"
            onClick={close}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('app.palette.title')}
            data-modal-open
            className="glass-solid relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl shadow-panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: reduce ? 0.1 : 0.15 }}
          >
            {/* search input */}
            <div className="flex items-center gap-12 border-b border-white/[.08] px-16 py-12">
              <Search size={18} strokeWidth={1.75} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={t('app.palette.placeholder')}
                aria-label={t('app.palette.inputAria')}
                className="w-full bg-transparent text-body text-ink caret-cyan placeholder:text-muted/60 focus:outline-none"
              />
              <span className="hidden shrink-0 items-center gap-4 sm:flex">
                <Kbd>Esc</Kbd>
              </span>
            </div>

            {/* results */}
            <ul role="listbox" aria-label={t('app.palette.resultsAria')} className="max-h-[46dvh] overflow-y-auto py-8">
              {items.length === 0 && (
                <li className="px-16 py-24 text-center text-caption text-muted">
                  {t('app.palette.noMatch', { query })}
                </li>
              )}
              {items.map((item, i) => {
                const group = groups.find((g) => g.start === i);
                const selected = i === active;
                return (
                  <li key={item.id} role="presentation">
                    {group && (
                      <p className="px-16 pb-4 pt-12 text-micro uppercase tracking-[.3em] text-cyan first:pt-4">
                        {group.name}
                      </p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      tabIndex={-1}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => runItem(item)}
                      className={cn(
                        'flex w-full items-center gap-12 px-16 py-10 text-left cursor-pointer transition-colors duration-100',
                        selected ? 'bg-white/[.07] text-ink' : 'text-muted',
                      )}
                    >
                      <item.icon
                        size={18}
                        strokeWidth={1.75}
                        className={cn('shrink-0', selected && 'text-cyan')}
                      />
                      <span className="flex-1 truncate text-caption">{item.label}</span>
                      {item.hint && (
                        <span className="shrink-0 text-micro uppercase text-muted/70">{item.hint}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* footer hints */}
            <div className="flex items-center gap-12 border-t border-white/[.08] px-16 py-8 text-muted">
              <span className="flex items-center gap-4 text-[11px]">
                <Kbd>↑↓</Kbd> {t('app.palette.hintMove')}
              </span>
              <span className="flex items-center gap-4 text-[11px]">
                <Kbd>Enter</Kbd> {t('app.palette.hintOpen')}
              </span>
              <span className="ml-auto flex items-center gap-4 text-[11px]">
                <Kbd>Ctrl K</Kbd> {t('app.palette.hintClose')}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
