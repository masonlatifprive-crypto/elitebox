/**
 * /security — Elitebox Security overview: architecture, secrets handling,
 * addon sandboxing, disclosure.
 */
import { LegalDoc } from './LegalDoc';
import { useT } from '@/i18n';

export default function Security() {
  const { t } = useT();
  return (
    <LegalDoc
      eyebrow={t('marketing.legal.eyebrow')}
      title={t('marketing.legal.security.title')}
      updated="July 31, 2026"
      intro={t('marketing.legal.security.intro')}
      sections={[
        {
          id: 'secrets',
          title: t('marketing.legal.security.s1'),
          body: (
            <>
              <p>
                No API keys, payment secrets or admin credentials are baked into the app or this
                repository. Every secret is read from server-side environment variables at
                runtime; the app refuses to seed an admin account unless its password is
                provided through the environment.
              </p>
              <p>
                Payment flows run on Stripe/PayPal hosted surfaces, so card data never touches
                Elitebox infrastructure.
              </p>
            </>
          ),
        },
        {
          id: 'addon-safety',
          title: t('marketing.legal.security.s2'),
          body: (
            <>
              <p>
                Addons are data-only: they declare a manifest and answer JSON over HTTPS.
                Elitebox does not execute addon code. Every addon request carries a strict
                timeout and an automatic circuit breaker that benches a failing addon before it
                can degrade the app.
              </p>
              <p>
                At install time Elitebox validates the manifest, enforces HTTPS (plain HTTP is
                accepted only for localhost development), shows the declared resources,
                permissions and privacy behavior in plain language, and rejects addons on the
                piracy blocklist.
              </p>
            </>
          ),
        },
        {
          id: 'local-data',
          title: t('marketing.legal.security.s3'),
          body: (
            <p>
              Library and history data live in browser storage scoped per profile. PIN-locked
              profiles gate casual access on shared devices. Error logs are kept in a local ring
              buffer you can inspect and clear — nothing is uploaded behind your back.
            </p>
          ),
        },
        {
          id: 'transport',
          title: t('marketing.legal.security.s4'),
          body: (
            <p>
              The app is served over HTTPS. Showcase media streams from the official Blender
              Foundation and Google sample CDNs over HTTPS; the mux test stream used by one
              demo channel is HTTPS as well.
            </p>
          ),
        },
        {
          id: 'disclosure',
          title: t('marketing.legal.security.s5'),
          body: (
            <p>
              Found something? Report it through the Support page with &quot;security&quot; in
              the subject. We ask that you give us a reasonable window to fix before public
              disclosure — we will acknowledge genuine reports and credit researchers who want
              it.
            </p>
          ),
        },
      ]}
    />
  );
}
