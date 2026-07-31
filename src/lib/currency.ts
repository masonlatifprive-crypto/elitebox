/**
 * Currency display for Elitebox Premium.
 *
 * Premium is billed in USD ($4.99/month). Other currencies are shown for
 * convenience at fixed approximate rates (clearly labeled as such at the
 * point of display — no fake precision). Choice persists per device.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CurrencyDef {
  code: 'USD' | 'EUR' | 'GBP';
  symbol: string;
  rateFromUsd: number;
  label: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', symbol: '$', rateFromUsd: 1, label: 'US Dollar' },
  { code: 'EUR', symbol: '€', rateFromUsd: 0.92, label: 'Euro' },
  { code: 'GBP', symbol: '£', rateFromUsd: 0.79, label: 'British Pound' },
];

export const PREMIUM_USD = 4.99;

interface CurrencyState {
  code: CurrencyDef['code'];
  setCode: (c: CurrencyDef['code']) => void;
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set) => ({
      code: 'USD',
      setCode: (code) => set({ code }),
    }),
    { name: 'elitebox.v1.currency', storage: createJSONStorage(() => localStorage) },
  ),
);

export function usePremiumPrice(): { text: string; note?: string } {
  const code = useCurrency((s) => s.code);
  const def = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
  if (def.code === 'USD') return { text: `$${PREMIUM_USD.toFixed(2)}` };
  const converted = Math.round(PREMIUM_USD * def.rateFromUsd * 100) / 100;
  return {
    text: `${def.symbol}${converted.toFixed(2)}`,
    note: `billed as $${PREMIUM_USD.toFixed(2)} USD — shown in ${def.label} at an approximate rate`,
  };
}
