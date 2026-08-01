/**
 * /terms — Elitebox Terms of Service.
 */
import { LegalDoc } from './LegalDoc';
import { useT } from '@/i18n';

export default function Terms() {
  const { t } = useT();
  return (
    <LegalDoc
      eyebrow={t('marketing.legal.eyebrow')}
      title={t('marketing.legal.terms.title')}
      updated="July 31, 2026"
      intro={t('marketing.legal.terms.intro')}
      sections={[
        {
          id: 'the-service',
          title: t('marketing.legal.terms.s1'),
          body: (
            <>
              <p>
                Elitebox is a media center: it organizes and plays content from sources you
                connect — the bundled open-content showcase, addons you install yourself, and
                your own media. Elitebox itself does not host or sell third-party catalogs.
              </p>
              <p>
                The bundled showcase consists of Blender Foundation open movies released under
                Creative Commons licenses, with attribution shown in the app and on this site.
              </p>
            </>
          ),
        },
        {
          id: 'your-content-rights',
          title: t('marketing.legal.terms.s2'),
          body: (
            <>
              <p>
                You are responsible for ensuring you have the legal right to access the content
                you play. Elitebox blocks known piracy addons at install time and does not
                provide, index or endorse sources of infringing streams.
              </p>
              <p>
                Installing a community addon is your choice; the addon&apos;s operator — not
                Elitebox — is responsible for what it serves.
              </p>
            </>
          ),
        },
        {
          id: 'premium',
          title: t('marketing.legal.terms.s3'),
          body: (
            <>
              <p>
                Premium is billed monthly at the price shown at checkout (currently $4.99/month)
                through Stripe or PayPal. You can cancel any time; access continues until the
                end of the paid period. No refunds are due for partial months, except where
                required by law.
              </p>
              <p>
                Until live payment keys are configured by the site operator, checkout runs in a
                clearly labeled demonstration mode and <strong>no real charge is made</strong>.
              </p>
            </>
          ),
        },
        {
          id: 'accounts',
          title: t('marketing.legal.terms.s4'),
          body: (
            <>
              <p>
                Keep your account credentials private. Do not attempt to disrupt the service,
                probe it for vulnerabilities without permission, or misrepresent Elitebox as
                affiliated with other products.
              </p>
              <p>
                The Elitebox name and logo are our brand. The addon protocol is open — you may
                build compatible addons and say so, without using our brand to imply endorsement.
              </p>
            </>
          ),
        },
        {
          id: 'liability',
          title: t('marketing.legal.terms.s5'),
          body: (
            <p>
              Elitebox is provided &quot;as is&quot;. We work hard to keep it fast, stable and
              honest — including truthful build status for every platform — but we do not
              warrant uninterrupted availability. To the extent permitted by law, liability is
              limited to the amount you paid in the last 12 months.
            </p>
          ),
        },
        {
          id: 'changes',
          title: t('marketing.legal.terms.s6'),
          body: (
            <p>
              Changes to these terms are posted on the Updates page with a new date. Continued
              use after a change takes effect means you accept it.
            </p>
          ),
        },
      ]}
    />
  );
}
