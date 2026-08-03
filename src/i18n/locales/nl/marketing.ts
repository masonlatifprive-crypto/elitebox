/**
 * marketing namespace (nl) — Nederlandse spiegel van '../en/marketing.ts'.
 * Houd de twee bestanden sleutelsymmetrisch; weggelaten sleutels vallen
 * terug op Engels (alleen een dev-waarschuwing). Juridische broodtekst
 * blijft bewust Engels in de paginabestanden — hier staat alleen de chrome.
 */
import type enMarketing from '../en/marketing';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const marketing: DeepPartial<typeof enMarketing> = {
  home: {
    hero: {
      eyebrow: 'ÉÉN APP VOOR ALLES WAT JE KIJKT',
      title1: 'ALLES WAT JE KIJKT',
      title2: 'ÉÉN PLEK',
      sub: 'Films, series en live kanalen van elke addon die je installeert. Realtime gezondheidschecks, op elk scherm dat je hebt.',
      openApp: 'App openen',
      setup: 'Elitebox instellen',
      meta: 'Open addonprotocol · Gratis CC-BY-catalogus · Web · Windows · Android · TV',
    },
    rail: {
      eyebrow: 'Nu te zien',
      title: 'Nu in de catalogus',
      fallbackTitle: 'Vrije cinema — gratis & legaal',
      openCatalog: 'Open de volledige catalogus',
    },
    story: {
      title: 'Hoe het werkt',
      step1: { title: 'Installeren', sub: 'Download de app voor je favoriete apparaat.' },
      step2: { title: 'Addons toevoegen', sub: 'Kies uit honderden community-addons.' },
      step3: { title: 'Kijken', sub: 'Geniet van je content in de hoogste kwaliteit.' },
    },
  },
};

export default marketing;
