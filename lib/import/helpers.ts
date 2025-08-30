// lib/import/helpers.ts
import { normalizeE164 } from '../phone';

export type NormalizedPhone = {
  e164: string | null; // ex: +33612345678
  cc: string | null;   // ex: 33
  nsn: string | null;  // ex: 612345678
};

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  // validation simple
  if (!/.+@.+\..+/.test(e)) return null;
  return e;
}

/**
 * Normalise un téléphone vers E.164 et retourne cc/nsn.
 * country: 'FR' (defaut) ou 'US' (ajoute si besoin d'autres pays).
 */
export function normalizePhone(input?: string | null, country: 'FR' | 'US' = 'FR'): NormalizedPhone | null {
  if (!input) return null;
  const e164 = normalizeE164(input, country);
  if (!e164) return null;
  const m = /^\+(\d{1,3})(\d{6,14})$/.exec(e164);
  if (!m) return { e164, cc: null, nsn: null };
  return { e164, cc: m[1], nsn: m[2] };
}

/** Clé de dédup téléphone: on compare cc + nsn */
export function phoneDedupKey(input?: string | null, country: 'FR' | 'US' = 'FR'): { cc: string | null; nsn: string | null } | null {
  const p = normalizePhone(input, country);
  if (!p) return null;
  return { cc: p.cc, nsn: p.nsn };
}
