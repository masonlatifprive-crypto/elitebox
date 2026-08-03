/**
 * SubscriptionGate (g6) — renders children only when the client holds an
 * active (or still-running canceled) subscription; otherwise swaps the whole
 * viewport for a PaywallCard over the particle ambience backdrop.
 *
 * Usage: <SubscriptionGate><PlayerPage /></SubscriptionGate>
 */
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AmbienceCanvas from '@/components/AmbienceCanvas';
import PaywallCard from '@/components/PaywallCard';
import { findShowcaseMeta } from '@/data/showcase';
import { hasAccessFor, useAuth } from '@/lib/auth';

const OPEN_CINEMA_IDS = new Set([
  'big-buck-bunny', 'sintel', 'tears-of-steel', 'elephants-dream',
  'cosmos-laundromat', 'agent-327', 'sprite-fright', 'charge', 'wing-it',
  'caminandes-series', 'caminandes-series-s01e01', 'caminandes-series-s01e02', 'caminandes-series-s01e03',
]);

export default function SubscriptionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const subscription = useAuth((s) => s.subscription);
  const refreshSubscription = useAuth((s) => s.refreshSubscription);

  /* pick up renewals / expired grace periods when a gate mounts */
  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  const id = decodeURIComponent(location.pathname.split('/').pop()?.split('?')[0] ?? '');
  const openPlayable = Boolean(findShowcaseMeta(id)) || OPEN_CINEMA_IDS.has(id);

  if (openPlayable || hasAccessFor(subscription)) return <>{children}</>;

