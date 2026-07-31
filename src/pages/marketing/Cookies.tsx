/**
 * /cookies — honest storage note. Elitebox sets no tracking cookies at all;
 * the only storage it uses is on-device app data, listed plainly.
 */
import { LegalDoc } from './LegalDoc';

export default function Cookies() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Cookie & Storage Notice"
      updated="August 1, 2026"
      intro="Short version: Elitebox sets no advertising cookies, no analytics cookies and no tracking pixels — nothing. The only things stored on your device are the app's own data, which you control."
      sections={[
        {
          id: 'what-we-store',
          title: '1. What Elitebox stores on your device',
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
          title: '2. What we never store or set',
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
          title: '3. Third-party requests',
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
          title: '4. Your controls',
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
