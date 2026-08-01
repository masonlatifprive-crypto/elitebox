/**
 * LanguageSwitch — globe trigger + radix dropdown with the two supported
 * locales (English / Nederlands, native endonyms — no flags). Radix gives the
 * full keyboard contract (Esc, arrows, typeahead, focus return); framer-motion
 * adds the lunar micro-fade on open/close. Selection writes
 * `settings.general.language` through the i18n provider.
 */
import { useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Globe } from 'lucide-react';
import { useT } from '@/i18n';
import type { Locale } from '@/i18n';
import { cn } from '@/lib/utils';

/** Locale names are shown as native endonyms — identical in every language. */
const LOCALES: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
];

export default function LanguageSwitch({ className }: { className?: string }) {
  const { t, locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={t('common.language.change')}
          title={t('common.language.label')}
          className={cn(
            'focusable flex items-center gap-8 rounded-full px-12 py-8 text-muted hover:text-ink hover:bg-white/[.06] transition-colors cursor-pointer',
            className,
          )}
        >
          <Globe size={20} strokeWidth={1.75} />
          <span className="text-caption">{current.label}</span>
        </button>
      </DropdownMenuPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <DropdownMenuPrimitive.Portal forceMount>
            <DropdownMenuPrimitive.Content
              forceMount
              asChild
              align="end"
              sideOffset={8}
              collisionPadding={8}
            >
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="glass-solid z-50 flex min-w-160 flex-col gap-2 rounded-xl p-4 shadow-panel"
              >
                {LOCALES.map((l) => {
                  const active = l.value === locale;
                  return (
                    <DropdownMenuPrimitive.Item
                      key={l.value}
                      onSelect={() => setLocale(l.value)}
                      className={cn(
                        'focusable flex cursor-pointer items-center gap-8 rounded-lg px-12 py-8 text-caption outline-none transition-colors',
                        'data-[highlighted]:bg-white/[.06] data-[highlighted]:text-ink',
                        active ? 'text-ink' : 'text-muted',
                      )}
                    >
                      <span className="flex-1">{l.label}</span>
                      {active && (
                        <Check size={14} strokeWidth={2} className="text-cyan" aria-hidden />
                      )}
                    </DropdownMenuPrimitive.Item>
                  );
                })}
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  );
}
