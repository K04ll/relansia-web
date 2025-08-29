// lib/import/syncCsvUrl.ts
import Papa from "papaparse";
import { createClient } from "@/lib/supabaseAdmin";
import { normalizeEmail, normalizePhone, phoneDedupKey } from "@/lib/import/normalize";

const ALIASES: Record<string, string> = {
  "email": "email", "email address": "email", "e-mail": "email", "courriel": "email",
  "first_name": "first_name", "firstname": "first_name", "prénom": "first_name", "prenom": "first_name",
  "last_name": "last_name", "lastname": "last_name", "nom": "last_name",
  "phone": "phone", "telephone": "phone", "téléphone": "phone", "tel": "phone", "mobile": "phone",
  "country": "country",
  "order_id": "order_id", "commande": "order_id", "order": "order_id", "id_commande": "order_id",
  "order_date": "order_date", "date": "order_date", "purchased_at": "order_date",
  "order_total": "order_total", "total": "order_total", "amount": "order_total",
  "currency": "currency",
  "store_name": "store_name", "store": "store_name", "boutique": "store_name",
  "external_id": "external_id", "row_id": "external_id"
};

function mapHeader(h: string) {
  const k = h.trim().toLowerCase();
  return ALIASES[k] ?? k;
}

function parseWith(text: string, delimiter?: string) {
  return Papa.parse<Record<string, any>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: mapHeader,
    delimiter,
  });
}

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/** fetchFn (optionnel) => facilite les tests */
export async function syncCsvUrl(userId: string, url: string, fetchFn?: FetchFn) {
  const sb = createClient();
  const doFetch = fetchFn ?? fetch;

  const res = await doFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  const text = await res.text();

  let out = parseWith(text);
  if (out.errors?.length && out.data.length === 0) {
    out = parseWith(text, ";");
  }
  const rows = out.data as Array<Record<string, any>>;

  let customersUpserted = 0, purchasesUpserted = 0, remindersCreated = 0;

  for (const r of rows) {
    const email = normalizeEmail(r.email);
    const country = r.country || "FR";
    const phone = normalizePhone(r.phone, country);
    const key = phoneDedupKey(r.phone, country);
    if (!email && !phone.e164) continue;

    const { data: existing } = await sb
      .from("customers")
      .select("id, email, phone_e164, phone_cc, phone_nsn")
      .eq("user_id", userId)
      .or([
        email ? `email.eq.${email}` : "",
        key.cc && key.nsn ? `and(phone_cc.eq.${key.cc},phone_nsn.eq.${key.nsn})` : "",
      ].filter(Boolean).join(","));

    let customerId: string | null = existing?.[0]?.id ?? null;

    if (!customerId) {
      const { data: inserted } = await sb
        .from("customers")
        .insert({
          user_id: userId,
          email: email ?? null,
          phone_e164: phone.e164 ?? null,
          phone_cc: phone.cc ?? null,
          phone_nsn: phone.nsn ? String(phone.nsn) : null,
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
        })
        .select("id")
        .single();
      if (inserted?.id) { customersUpserted++; customerId = inserted.id; }
    } else {
      await sb.from("customers").update({
        email: existing?.[0]?.email ?? email ?? null,
        phone_e164: existing?.[0]?.phone_e164 ?? phone.e164 ?? null,
        phone_cc: existing?.[0]?.phone_cc ?? phone.cc ?? null,
        phone_nsn: existing?.[0]?.phone_nsn ?? (phone.nsn ? String(phone.nsn) : null),
        first_name: r.first_name ?? undefined,
        last_name: r.last_name ?? undefined,
      }).eq("id", customerId);
    }

    const order_id = r.order_id?.toString().trim();
    const order_date = parseDateFlexible(r.order_date);
    if (customerId && order_id && order_date) {
      const order_total =
        typeof r.order_total === "number" ? r.order_total :
        r.order_total ? Number(String(r.order_total).replace(",", ".")) : null;

      const { data: purchase, error } = await sb
        .from("purchases")
        .upsert({
          user_id: userId,
          customer_id: customerId,
          order_id,
          order_date,
          total_amount: order_total,
          currency: r.currency ?? "EUR",
          store_name: r.store_name ?? null,
          external_id: r.external_id ?? null,
        }, { onConflict: "user_id,customer_id,order_id,order_date" })
        .select("id")
        .single();

      if (!error && purchase?.id) {
        purchasesUpserted++;
        const { data: planned } = await sb.rpc("plan_reminders_for_purchase", {
          p_user_id: userId,
          p_purchase_id: purchase.id,
        });
        const n = Array.isArray(planned) && planned[0]?.count ? Number(planned[0].count) : 0;
        remindersCreated += n;
      }
    }
  }

  return { count: rows.length, customersUpserted, purchasesUpserted, remindersCreated };
}

/** parse simple (yyyy-mm-dd | dd/mm/yyyy | mm/dd/yyyy | ISO) */
export function parseDateFlexible(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso).toISOString();

  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const d1 = Number(m[1]), d2 = Number(m[2]), y = Number(m[3]);
    const hh = Number(m[4] ?? 0), mm = Number(m[5] ?? 0), ss = Number(m[6] ?? 0);
    const asFR = new Date(Date.UTC(y, d2 - 1, d1, hh, mm, ss)); // dd/mm
    if (d1 > 12) return isNaN(asFR.getTime()) ? null : asFR.toISOString();
    if (!isNaN(asFR.getTime())) return asFR.toISOString();
    const asUS = new Date(Date.UTC(y, d1 - 1, d2, hh, mm, ss)); // mm/dd
    return isNaN(asUS.getTime()) ? null : asUS.toISOString();
  }

  const m2 = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m2) {
    const y = Number(m2[1]), mo = Number(m2[2]), d = Number(m2[3]);
    const hh = Number(m2[4] ?? 0), mm = Number(m2[5] ?? 0), ss = Number(m2[6] ?? 0);
    const dt = new Date(Date.UTC(y, mo - 1, d, hh, mm, ss));
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  return null;
}
