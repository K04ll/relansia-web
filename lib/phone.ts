// strict TS ok
export function normalizeE164(input: string | null | undefined, defaultCountry: 'FR' | 'US' = 'FR'): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Already E.164
  if (/^\+\d{7,15}$/.test(raw)) return raw;

  const digits = raw.replace(/[^\d]/g, '');
  if (defaultCountry === 'FR') {
    // 0XXXXXXXXX => +33XXXXXXXXX
    if (/^0\d{9}$/.test(digits)) return `+33${digits.slice(1)}`;
    // 33XXXXXXXXX (sans +) => +33XXXXXXXXX
    if (/^33\d{9}$/.test(digits)) return `+${digits}`;
  }
  if (defaultCountry === 'US') {
    // 10 digits => +1XXXXXXXXXX
    if (/^\d{10}$/.test(digits)) return `+1${digits}`;
    if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  }
  return null;
}
