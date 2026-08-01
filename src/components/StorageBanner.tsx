/**
 * Storage notice banner — the honest one-liner: Elitebox keeps your library
 * on this device and sets zero trackers. Dismiss persists per device.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useT } from '@/i18n';

const KEY = 'elitebox.v1.storage-notice-ok';

export default function StorageBanner() {
  const { t } = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setShow(true), 2400);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage blocked — banner stays off */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* fine */
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="note"
          className="glass-solid fixed bottom-16 left-16 right-16 z-[60] mx-auto flex max-w-[560px] items-center gap-16 rounded-2xl px-20 py-14 shadow-panel sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          <p className="flex-1 text-caption text-ink/90">
            {t('marketing.storageBanner.text')}{' '}
            <Link to="/cookies" className="focusable rounded-sm text-cyan hover:underline">
              {t('marketing.storageBanner.learnMore')}
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="focusable shrink-0 rounded-full bg-signature px-16 py-8 text-[12px] font-bold text-deep cursor-pointer"
          >
            {t('marketing.storageBanner.gotIt')}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('marketing.storageBanner.dismiss')}
            className="focusable shrink-0 rounded-full text-muted hover:text-ink cursor-pointer"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
