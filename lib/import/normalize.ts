import { DateTime } from 'luxon';
import { normalizeE164 } from '../phone';
import type { CsvRow } from './types';

export function normalizeRow(row: Record<string, unknown>): CsvRow {
  const key = (k: string) => Object.keys(row).find(kk => kk.toLowerCase() === k.toLowerCase());

  const email = key('email') ? String(row[key('email')!] ?? '').trim() : '';
  const phoneRaw = key('phone') ? String(row[key('phone')!] ?? '').trim() : '';
  const phone = normalizeE164(phoneRaw, 'FR');

  const external_id = key('external_id') ? String(row[key('external_id')!] ?? '').trim() : '';
  const first_name = key('first_name') ? String(row[key('first_name')!] ?? '').trim() : '';
  const last_name = key('last_name') ? String(row[key('last_name')!] ?? '').trim() : '';

  const amountStr = key('amount') ? String(row[key('amount')!] ?? '') : '';
  const amountCentsStr = key('amount_cents') ? String(row[key('amount_cents')!] ?? '') : '';
  const currency = key('currency') ? String(row[key('currency')!] ?? '').toUpperCase() : 'EUR';

  const dateStr = (key('purchased_at') ? String(row[key('purchased_at')!] ?? '') :
                  (key('date') ? String(row[key('date')!] ?? '') : '')).trim();

  let amount_cents: number | undefined;
  if (amountCentsStr) {
    const n = Number(amountCentsStr);
    amount_cents = Number.isFinite(n) ? Math.round(n) : undefined;
  } else if (amountStr) {
    const f = Number(amountStr.replace(',', '.'));
    amount_cents = Number.isFinite(f) ? Math.round(f * 100) : undefined;
  }

  let purchased_at: string | undefined;
  if (dateStr) {
    const p = DateTime.fromISO(dateStr, { zone: 'utc' });
    if (p.isValid) purchased_at = p.toISO();
    else {
      const p2 = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: 'utc' });
      if (p2.isValid) purchased_at = p2.toISO();
    }
  }

  return {
    external_id: external_id || undefined,
    email: email || undefined,
    phone: phone || undefined,
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    amount_cents,
    currency,
    purchased_at,
  };
}
