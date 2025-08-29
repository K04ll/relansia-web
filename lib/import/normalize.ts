// lib/import/normalize.ts
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

export function normalizeEmail(email?: string) {
  if (!email) return undefined;
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string, country?: string) {
  if (!phone) return { e164: undefined, cc: undefined, nsn: undefined };
  const p = parsePhoneNumberFromString(phone, (country as any) || undefined);
  if (!p?.isValid()) return { e164: undefined, cc: undefined, nsn: undefined };
  return { e164: p.number, cc: String(p.countryCallingCode), nsn: p.nationalNumber };
}

/** Pour dédup partielle téléphone (tolérant aux formats) */
export function phoneDedupKey(phone?: string, country?: string): { cc?: string; nsn?: string } {
  const n = normalizePhone(phone, country);
  if (!n.cc || !n.nsn) return {};
  return { cc: n.cc, nsn: String(n.nsn) };
}
