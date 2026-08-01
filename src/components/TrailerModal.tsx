/**
 * TrailerModal — plays a title's YouTube trailer(s) (Cinemeta `trailers`)
 * in the privacy-enhanced youtube-nocookie IFrame embed. Honest loading
 * state until the frame reports load; Esc/backdrop close via ui-elite
 * Modal. Rendered only when the meta actually carries trailers — never a
 * dead button upstream.
 */
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui-elite';
import type { MetaTrailer } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export default function TrailerModal({
  open,
  onClose,
  trailers,
  name,
}: {
  open: boolean;
  onClose: () => void;
  trailers: MetaTrailer[];
  name: string;
}) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('app.detail.watchTrailer')} className="max-w-3xl">
      {/* mounts fresh on every open → selection/loading start clean */}
      <TrailerBody trailers={trailers} name={name} />
    </Modal>
  );
}

function TrailerBody({ trailers, name }: { trailers: MetaTrailer[]; name: string }) {
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const trailer = trailers[Math.min(index, trailers.length - 1)];

  return (
    <>
      {trailer && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/[.08]">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center gap-8 text-muted">
              <Loader2 size={20} strokeWidth={1.75} className="animate-spin text-cyan" />
              <span className="text-caption">{t('app.detail.trailerLoading')}</span>
            </div>
          )}
          <iframe
            key={trailer.source}
            src={`https://www.youtube-nocookie.com/embed/${trailer.source}?rel=0&modestbranding=1`}
            title={t('app.detail.trailerIframeTitle', { name })}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}
      {trailers.length > 1 && (
        <div className="mt-12 flex flex-wrap gap-8" role="tablist" aria-label={t('app.detail.watchTrailer')}>
          {trailers.map((tr, i) => (
            <button
              key={tr.source}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => {
                setIndex(i);
                setLoaded(false);
              }}
              className={cn(
                'focusable rounded-full px-12 py-6 font-mono text-[12px] cursor-pointer',
                i === index ? 'bg-chrome font-bold text-deep' : 'glass-1 text-muted hover:text-ink',
              )}
            >
              {t('app.detail.trailerN', { n: i + 1 })}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
