/**
 * /cookies — honest storage note. Elitebox sets no tracking cookies at all;
 * the only storage it uses is on-device app data, listed plainly.
 */
import { LegalDoc } from './LegalDoc';
import { useT } from '@/i18n';

export default function Cookies() {
  const { t } = useT();
  return (
    <LegalDoc
      eyebrow={t('marketing.legal.eyebrow')}
      title={t('marketing.legal.cookies.title')}
      updated="August 1, 2026"
      intro={t('marketing.legal.cookies.intro')}
      sections={[
        {
          id: 'what-we-store',
          title: t('marketing.legal.cookies.s1'),
          body: (
            <>
              <p>
                Your profiles, favorites, watchlist, watched marks, continue-watching positions,
                subtitle preferences, installed addons and interface settings. These live in your
                browser&apos;s local storage — they never leave your device unless you export them
                yourself.
              </p>
              <p>
                A small error ring buffer and your currency choice are stored the same way:
                locally, under your control, clearable in Settings.
              </p>
            </>
          ),
        },
        {
          id: 'what-we-dont',
          title: t('marketing.legal.cookies.s2'),
          body: (
            <p>
              No advertising cookies. No analytics beacons. No session recording. No fingerprinting.
              No &quot;we value your privacy&quot; banner hiding forty-seven trackers — there is
              nothing to switch off because nothing is switched on.
            </p>
          ),
        },
        {
          id: 'third-parties',
          title: t('marketing.legal.cookies.s3'),
          body: (
            <p>
              Addons you install contact their own servers directly from your device, and streaming
              comes from the sources those addons declare. Those services have their own policies;
              Elitebox adds nothing to those requests and proxies none of them.
            </p>
          ),
        },
        {
          id: 'control',
          title: t('marketing.legal.cookies.s4'),
          body: (
            <p>
              Settings → Data lets you export everything, import it elsewhere, or wipe it
              completely. Clearing your browser storage removes every trace Elitebox ever wrote.
            </p>
          ),
        },
      ]}
    />
  );
}
