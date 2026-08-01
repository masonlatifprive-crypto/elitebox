/**
 * /privacy — Elitebox Privacy Policy. Written for the product as it
 * actually works: local-first storage, addon requests direct from the
 * device, no advertising trackers.
 */
import { LegalDoc } from './LegalDoc';
import { useT } from '@/i18n';

export default function Privacy() {
  const { t } = useT();
  return (
    <LegalDoc
      eyebrow={t('marketing.legal.eyebrow')}
      title={t('marketing.legal.privacy.title')}
      updated="July 31, 2026"
      intro={t('marketing.legal.privacy.intro')}
      sections={[
        {
          id: 'what-we-store',
          title: t('marketing.legal.privacy.s1'),
          body: (
            <>
              <p>
                Your profiles, favorites, watchlist, watched marks, continue-watching positions,
                subtitle preferences and installed addons are stored in your browser&apos;s local
                storage on your own device, under keys scoped to your profile. Clearing your
                browser data deletes them permanently.
              </p>
              <p>
                If you create an Elitebox account, your email address and a password hash are
                stored by the authentication service you sign in through. Your viewing data is
                not uploaded with it.
              </p>
            </>
          ),
        },
        {
          id: 'addons',
          title: t('marketing.legal.privacy.s2'),
          body: (
            <>
              <p>
                When you install an addon, your device contacts that addon&apos;s server directly
                to fetch catalogs, metadata and streams. Elitebox does not proxy these requests
                and does not add your identity, account details or watch history to them.
              </p>
              <p>
                An addon&apos;s operator can see your IP address and the titles you request from
                it — this is inherent to how any client talks to any server. Each addon&apos;s
                declared permissions and privacy behavior are shown to you in plain language
                before installation, and known piracy sources are blocked outright.
              </p>
            </>
          ),
        },
        {
          id: 'payments',
          title: t('marketing.legal.privacy.s3'),
          body: (
            <p>
              Elitebox Premium is processed by Stripe or PayPal, depending on your choice at
              checkout. Card and account details go directly to the payment provider over their
              secure connection; Elitebox never sees, stores or transmits your full card number.
              The provider&apos;s own privacy policy applies to the data it processes.
            </p>
          ),
        },
        {
          id: 'tracking',
          title: t('marketing.legal.privacy.s4'),
          body: (
            <p>
              Elitebox ships <strong>no advertising trackers, no third-party analytics beacons
              and no session recording</strong>. Playback errors and crash details stay in a
              local on-device log you can review and clear yourself in Settings.
            </p>
          ),
        },
        {
          id: 'your-controls',
          title: t('marketing.legal.privacy.s5'),
          body: (
            <>
              <p>
                You can export every byte of your local data (Settings → Data), import it on
                another device, or wipe it completely with Reset. Pausing watch history stops
                new entries from being recorded; existing entries remain yours to delete.
              </p>
              <p>
                Profiles can be PIN-locked. Locked profiles gate who can open them on a shared
                device — they are a convenience lock, not encryption.
              </p>
            </>
          ),
        },
        {
          id: 'contact',
          title: t('marketing.legal.privacy.s6'),
          body: (
            <p>
              Material changes to this policy are noted on the Updates page with a new
              &quot;last updated&quot; date. Privacy questions and deletion requests:
              use the contact options on the Support page.
            </p>
          ),
        },
      ]}
    />
  );
}
