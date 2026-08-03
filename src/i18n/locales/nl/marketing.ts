/**
 * marketing namespace (nl) — Nederlandse spiegel van `../en/marketing.ts`.
 * Houd de twee bestanden sleutelsymmetrisch; weggelaten sleutels vallen
 * terug op Engels (alleen een dev-waarschuwing). Juridische broodtekst
 * blijft bewust Engels in de paginabestanden — hier staat alleen de chrome.
 */
import type enMarketing from '../en/marketing';




type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};




export default {
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
      eyebrow: 'Waarom Elitebox',
      title: 'Gemaakt voor filmavond.',
      copy: 'Films, series en live tv op één rustige plek. Jouw addons vullen de planken — Elitebox houdt ze allemaal eerlijk, snel en herstelbaar.',
      cards: {
        health: {
          title: 'Elke addon, live gecontroleerd',
