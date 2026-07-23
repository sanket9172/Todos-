import * as Crypto from 'expo-crypto';

import type { AccountIdentifierKind } from '@/types';

/** Detect whether the user typed an email or a phone number. */
export function detectIdentifierKind(raw: string): AccountIdentifierKind | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.includes('@')) {
    const email = v.toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'email';
    return null;
  }
  const digits = v.replace(/\D/g, '');
  if (digits.length >= 8 && digits.length <= 15) return 'phone';
  return null;
}

export function normalizeIdentifier(raw: string, kind: AccountIdentifierKind): string {
  const v = raw.trim();
  if (kind === 'email') return v.toLowerCase();
  return v.replace(/\D/g, '');
}

export function formatIdentifier(kind: AccountIdentifierKind, identifier: string): string {
  if (kind === 'email') return identifier;
  // Light grouping for display: +91 98765 43210 style when long enough
  if (identifier.length > 10) {
    return `+${identifier.slice(0, identifier.length - 10)} ${identifier.slice(-10, -5)} ${identifier.slice(-5)}`;
  }
  if (identifier.length === 10) {
    return `${identifier.slice(0, 5)} ${identifier.slice(5)}`;
  }
  return identifier;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

export async function makeSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}
