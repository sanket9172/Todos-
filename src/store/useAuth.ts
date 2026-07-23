import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  detectIdentifierKind,
  hashPassword,
  makeSalt,
  normalizeIdentifier,
  validatePassword,
} from '@/lib/auth';
import { nowISO } from '@/lib/date';
import type { Account } from '@/types';

function uid(): string {
  return `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface AuthState {
  /** Registered accounts on this device (usually one). */
  accounts: Account[];
  /** Currently signed-in account id, or null. */
  sessionAccountId: string | null;
  rememberMe: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  currentAccount: () => Account | null;

  /** Create account + sign in. */
  signUp: (input: {
    identifier: string;
    password: string;
    displayName?: string;
    rememberMe?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;

  /** Sign in to an existing local account. */
  signIn: (input: {
    identifier: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;

  signOut: () => void;
  deleteAccount: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      sessionAccountId: null,
      rememberMe: true,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      currentAccount: () => {
        const { accounts, sessionAccountId } = get();
        if (!sessionAccountId) return null;
        return accounts.find((a) => a.id === sessionAccountId) ?? null;
      },

      signUp: async ({ identifier, password, displayName, rememberMe = true }) => {
        const kind = detectIdentifierKind(identifier);
        if (!kind) {
          return { ok: false, error: 'Enter a valid email or mobile number' };
        }
        const pwError = validatePassword(password);
        if (pwError) return { ok: false, error: pwError };

        const normalized = normalizeIdentifier(identifier, kind);
        const exists = get().accounts.some((a) => a.identifier === normalized);
        if (exists) {
          return { ok: false, error: 'An account with this email or number already exists. Sign in instead.' };
        }

        const salt = await makeSalt();
        const passwordHash = await hashPassword(password, salt);
        const now = nowISO();
        const account: Account = {
          id: uid(),
          kind,
          identifier: normalized,
          displayName: displayName?.trim() || undefined,
          passwordHash,
          salt,
          createdAt: now,
          lastLoginAt: now,
        };

        set((s) => ({
          accounts: [...s.accounts, account],
          sessionAccountId: account.id,
          rememberMe,
        }));
        return { ok: true };
      },

      signIn: async ({ identifier, password, rememberMe = true }) => {
        const kind = detectIdentifierKind(identifier);
        if (!kind) {
          return { ok: false, error: 'Enter a valid email or mobile number' };
        }
        const normalized = normalizeIdentifier(identifier, kind);
        const account = get().accounts.find((a) => a.identifier === normalized);
        if (!account) {
          return { ok: false, error: 'No account found. Create one first.' };
        }

        const hash = await hashPassword(password, account.salt);
        if (hash !== account.passwordHash) {
          return { ok: false, error: 'Incorrect password' };
        }

        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === account.id ? { ...a, lastLoginAt: nowISO() } : a,
          ),
          sessionAccountId: account.id,
          rememberMe,
        }));
        return { ok: true };
      },

      signOut: () => set({ sessionAccountId: null }),

      deleteAccount: () => {
        const id = get().sessionAccountId;
        if (!id) return;
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          sessionAccountId: null,
        }));
      },
    }),
    {
      name: 'todos-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        // Keep session only when Remember me is on
        sessionAccountId: state.rememberMe ? state.sessionAccountId : null,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => () => {
        useAuth.setState({ _hasHydrated: true });
      },
    },
  ),
);
