// lib/validators.ts
import { z } from "zod";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export const emailSchema = z.string().email();
export const delaySchema = z.number().int().min(0).max(365);

export function isValidEmail(email?: string) {
  if (!email) return false;
  const res = emailSchema.safeParse(email);
  return res.success;
}

export function normalizeE164(phone?: string, defaultCountry: CountryCode = "FR") {
  if (!phone) return null;
  // utiliser l'overload avec options pour être béton côté types
  const p = parsePhoneNumberFromString(phone, { defaultCountry });
  return p?.isValid() ? p.number : null;
}

export function addDaysISO(baseISO: string | Date, days: number) {
  const base = typeof baseISO === "string" ? new Date(baseISO) : baseISO;
  const d = new Date(base);
  d.setHours(12, 0, 0, 0); // éviter DST
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function todayISO() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}
