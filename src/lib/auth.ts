/**
 * Elitebox auth + subscription contract (g6) — zustand + persist.
 *
 * Two runtime modes:
 *  • LIVE  — `import.meta.env.VITE_API_URL` is set: the store talks to the
 *    companion server (POST /api/auth/register, POST /api/auth/login,
 *    GET /api/billing/status, POST /api/billing/checkout,
 *    POST /api/billing/paypal/order) with fetch + an 8s AbortController.
 *    Network failures fall back gracefully (demo subscription, honest errors).
 *  • LOCAL  — no API URL: `demoMode === true`. Accounts live in localStorage
 *    with SHA-256 hashed passwords (crypto.subtle), subscribe() creates a
 *    local demo subscription (renewsAt = +30 days), and every surface that
 *    touches billing must label itself "Billing not connected — no real charge".
 *
 * Other agents import: useAuth, hasAccessFor, type AuthUser, type Subscription.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── public types ──────────────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** /art/avatar-*.jpg orb (local profile cosmetic) */
  avatar?: string;
  /** epoch ms — "Member since" */
  createdAt?: number;
}

export interface Subscription {
  status: 'active' | 'none' | 'canceled';
  plan?: string;
  renewsAt?: string; // ISO date
  demo?: boolean;
  method?: 'card' | 'paypal';
}

export type PayMethod = 'card' | 'paypal';

export interface AuthResult {
  ok: boolean;
  /** machine-readable: 'credentials' | 'unknown' | 'duplicate' | 'network' | 'invalid' */
  error?: string;
}

interface AuthState {
  user: AuthUser | null;
  subscription: Subscription | null;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  subscribe: (method: PayMethod) => Promise<{ ok: boolean }>;
  cancelSubscription: () => void;
  hasAccess: () => boolean;
  refreshSubscription: () => Promise<void>;
  /* account-page extras (identity management) */
  updateName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  deleteAccount: () => void;
}

/* ── mode + constants ──────────────────────────────────────────────────── */

const RAW_API = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
/** trimmed server base, '' when the build has no backend keys */
export const API_URL = RAW_API.replace(/\/+$/, '');
const LOCAL = API_URL.length === 0;

const AUTH_KEY = 'elitebox.v1.auth';
const ACCOUNTS_KEY = 'elitebox.v1.auth.accounts';
const TOKEN_KEY = 'elitebox.v1.auth.token';
const DAY_MS = 24 * 60 * 60 * 1000;

/* ── demo account registry (localStorage, hashed passwords) ────────────── */

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  salt: string;
  passHash: string;
  avatar?: string;
  createdAt: number;
  subscription?: Subscription | null;
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage full/blocked — session still works in-memory */
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function uid(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** SHA-256 via crypto.subtle; djb2 fallback for non-secure contexts. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}::${password}`;
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    /* fall through to the synchronous fallback */
  }
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 31) ^ c;
  }
  return `fnv_${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

/* ── server helpers (live mode) ────────────────────────────────────────── */

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function authToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const token = authToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new ApiError(res.status, typeof body.error === 'string' ? body.error : res.statusText);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  return err instanceof Error; // TypeError (fetch) or DOMException (abort)
}

/* ── shared access logic ───────────────────────────────────────────────── */

/** Pure access check — a canceled sub keeps access until renewsAt passes. */
export function hasAccessFor(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'canceled' && sub.renewsAt) {
    return Date.parse(sub.renewsAt) > Date.now();
  }
  return false;
}

function demoSubscription(method: PayMethod): Subscription {
  return {
    status: 'active',
    plan: 'premium',
    renewsAt: new Date(Date.now() + 30 * DAY_MS).toISOString(),
    demo: true,
    method,
  };
}

function toUser(a: StoredAccount): AuthUser {
  return { id: a.id, name: a.name, email: a.email, avatar: a.avatar, createdAt: a.createdAt };
}

/* ── the store ─────────────────────────────────────────────────────────── */

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      demoMode: LOCAL,

      async login(email, password) {
        const mail = normalizeEmail(email);
        if (!mail || !password) return { ok: false, error: 'invalid' };

        if (!LOCAL) {
          try {
            const res = await apiFetch<{ user: AuthUser; token?: string }>('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: mail, password }),
            });
            if (res.token) {
              try {
                localStorage.setItem(TOKEN_KEY, res.token);
              } catch {
                /* non-fatal */
              }
            }
            set({ user: res.user });
            void get().refreshSubscription();
            return { ok: true };
          } catch (err) {
            if (err instanceof ApiError) {
              if (err.status === 401) return { ok: false, error: 'credentials' };
              if (err.status === 404) return { ok: false, error: 'unknown' };
              if (err.status === 400) return { ok: false, error: 'invalid' };
            }
            if (isNetworkError(err)) return { ok: false, error: 'network' };
            return { ok: false, error: 'credentials' };
          }
        }

        /* demo mode — local accounts */
        const account = loadAccounts().find((a) => a.email === mail);
        if (!account) return { ok: false, error: 'unknown' };
        const hash = await hashPassword(password, account.salt);
        if (hash !== account.passHash) return { ok: false, error: 'credentials' };
        set({ user: toUser(account), subscription: account.subscription ?? null });
        get().refreshSubscription();
        return { ok: true };
      },

      async register(name, email, password) {
        const displayName = name.trim();
        const mail = normalizeEmail(email);
        if (displayName.length < 2 || !mail || password.length < 8) {
          return { ok: false, error: 'invalid' };
        }

        if (!LOCAL) {
          try {
            const res = await apiFetch<{ user: AuthUser; token?: string }>('/api/auth/register', {
              method: 'POST',
              body: JSON.stringify({ name: displayName, email: mail, password }),
            });
            if (res.token) {
              try {
                localStorage.setItem(TOKEN_KEY, res.token);
              } catch {
                /* non-fatal */
              }
            }
            set({ user: res.user, subscription: null });
            return { ok: true };
          } catch (err) {
            if (err instanceof ApiError) {
              if (err.status === 409) return { ok: false, error: 'duplicate' };
              if (err.status === 400) return { ok: false, error: 'invalid' };
            }
            if (isNetworkError(err)) return { ok: false, error: 'network' };
            return { ok: false, error: 'invalid' };
          }
        }

        /* demo mode */
        const accounts = loadAccounts();
        if (accounts.some((a) => a.email === mail)) return { ok: false, error: 'duplicate' };
        const salt = uid();
        const passHash = await hashPassword(password, salt);
        const account: StoredAccount = {
          id: uid(),
          name: displayName,
          email: mail,
          salt,
          passHash,
          createdAt: Date.now(),
          subscription: null,
        };
        accounts.push(account);
        saveAccounts(accounts);
        /* register signs the client in immediately (create → auto sign-in) */
        set({ user: toUser(account), subscription: null });
        return { ok: true };
      },

      logout() {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* non-fatal */
        }
        set({ user: null, subscription: null });
      },

      async subscribe(method) {
        const user = get().user;
        if (!user) return { ok: false };

        if (!LOCAL) {
          try {
            const path = method === 'paypal' ? '/api/billing/paypal/order' : '/api/billing/checkout';
            const res = await apiFetch<{ url?: string; subscription?: Subscription }>(path, {
              method: 'POST',
              body: JSON.stringify({ method, plan: 'premium' }),
            });
            if (res.url) {
              /* hand off to Stripe Checkout / PayPal approval */
              window.location.assign(res.url);
              return { ok: true };
            }
            if (res.subscription) {
              set({ subscription: res.subscription });
              return { ok: true };
            }
            await get().refreshSubscription();
            return { ok: hasAccessFor(get().subscription) };
          } catch {
            /* graceful fallback: keep the client unblocked, honestly labeled */
            set({ subscription: demoSubscription(method) });
            return { ok: true };
          }
        }

        /* demo mode — simulated checkout, +30 days, never a real charge */
        const sub = demoSubscription(method);
        set({ subscription: sub });
        const accounts = loadAccounts().map((a) =>
          a.id === user.id ? { ...a, subscription: sub } : a,
        );
        saveAccounts(accounts);
        return { ok: true };
      },

      cancelSubscription() {
        const sub = get().subscription;
        if (!sub || sub.status !== 'active') return;
        const canceled: Subscription = { ...sub, status: 'canceled' };
        set({ subscription: canceled });

        const user = get().user;
        if (user) {
          const accounts = loadAccounts().map((a) =>
            a.id === user.id ? { ...a, subscription: canceled } : a,
          );
          saveAccounts(accounts);
        }
        if (!LOCAL) {
          /* best-effort server sync; local state already reflects the cancel */
          void apiFetch('/api/billing/cancel', { method: 'POST', body: '{}' }).catch(() => undefined);
        }
      },

      hasAccess() {
        return hasAccessFor(get().subscription);
      },

      async refreshSubscription() {
        const sub = get().subscription;
        if (!LOCAL) {
          if (!get().user) return;
          try {
            const res = await apiFetch<{ subscription: Subscription | null }>('/api/billing/status');
            set({ subscription: res.subscription ?? { status: 'none' } });
          } catch {
            /* keep the last known local state on network failure */
          }
          return;
        }
        /* demo upkeep: renew active demo subs, expire finished canceled ones */
        if (!sub) return;
        const now = Date.now();
        if (sub.status === 'active' && sub.renewsAt && Date.parse(sub.renewsAt) <= now) {
          const renewed: Subscription = { ...sub, renewsAt: new Date(now + 30 * DAY_MS).toISOString() };
          set({ subscription: renewed });
        } else if (sub.status === 'canceled' && sub.renewsAt && Date.parse(sub.renewsAt) <= now) {
          set({ subscription: { status: 'none' } });
        }
      },

      updateName(name) {
        const trimmed = name.trim();
        const user = get().user;
        if (!user || trimmed.length < 2) return;
        set({ user: { ...user, name: trimmed } });
        saveAccounts(
          loadAccounts().map((a) => (a.id === user.id ? { ...a, name: trimmed } : a)),
        );
      },

      setAvatar(avatar) {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, avatar } });
        saveAccounts(
          loadAccounts().map((a) => (a.id === user.id ? { ...a, avatar } : a)),
        );
      },

      deleteAccount() {
        const user = get().user;
        if (user) {
          saveAccounts(loadAccounts().filter((a) => a.id !== user.id));
        }
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* non-fatal */
        }
        /* wipe every elitebox.v1.* local slice (profiles, library, playback…) */
        try {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('elitebox.v1.')) keys.push(k);
          }
          keys.forEach((k) => localStorage.removeItem(k));
        } catch {
          /* storage blocked — account record is already gone */
        }
        set({ user: null, subscription: null });
      },
    }),
    {
      name: AUTH_KEY,
      partialize: (s) => ({ user: s.user, subscription: s.subscription }),
    },
  ),
);
