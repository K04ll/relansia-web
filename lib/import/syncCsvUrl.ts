/* eslint-disable no-console */
import Papa from "papaparse";
import { createClient } from "@/lib/supabaseAdmin";
import { normalizeEmail, normalizePhone, phoneDedupKey } from "@/lib/import/helpers";

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
  return Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: mapHeader,
    delimiter,
  });
}

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Fetch CSV text with retries, redirects and UA
 */
async function fetchCsvText(doFetch: FetchFn, url: string): Promise<string> {
  try {
    const r = await doFetch(url, { redirect: "follow" });
    if (r.ok) return await r.text();
    console.error("Fetch failed, status:", r.status, r.statusText);
  } catch (e) {
    console.error("Direct fetch error:", e);
  }

  // Retry with User-Agent
  try {
    const r2 = await doFetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (r2.ok) return await r2.text();
    console.error("Retry fetch failed, status:", r2.status, r2.statusText);
  } catch (e) {
    console.error("Retry fetch error:", e);
  }

  throw new Error(`fetch_failed for ${url}`);
}

export function parseDateFlexible(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso).toISOString();

  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const d1 = Number(m[1]), d2 = Number(m[2]), y = Number(m[3]);
    const hh = Number(m[4] ?? 0), mm = Number(m[5] ?? 0), ss = Number(m[6] ?? 0);
    const asFR = new Date(Date.UTC(y, d2 - 1, d1, hh, mm, ss));
    if (d1 > 12) return isNaN(asFR.getTime()) ? null : asFR.toISOString();
    if (!isNaN(asFR.getTime())) return asFR.toISOString();
    const asUS = new Date(Date.UTC(y, d1 - 1, d2, hh, mm, ss));
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

/** fetchFn (optionnel) => facilite les tests */
export async function syncCsvUrl(userId: string, url: string, fetchFn?: FetchFn) {
  const sb = createClient();
  const doFetch = fetchFn ?? fetch;

  const text = await fetchCsvText(doFetch, url);

  let out = parseWith(text);
  if (out.errors?.length && out.data.length === 0) {
    out = parseWith(text, ";");
  }
  const rows = out.data as Array<Record<string, unknown>>;

  let customersUpserted = 0, purchasesUpserted = 0, remindersCreated = 0;

  for (const r of rows) {
    try {
      const email = normalizeEmail((r.email as string | undefined) ?? null);
      const countryRaw = (r.country as string | undefined)?.toUpperCase?.() ?? "FR";
      const country = (countryRaw === "US" ? "US" : "FR") as "FR" | "US";

      const phoneObj = normalizePhone((r.phone as string | undefined) ?? null, country);
      const key = phoneDedupKey((r.phone as string | undefined) ?? null, country);

      if (!email && !phoneObj?.e164) continue;

      const { data: existing, error: selErr } = await sb
        .from("customers")
        .select("id, email, phone_e164, phone_cc, phone_nsn")
        .eq("user_id", userId)
        .or([
          email ? `email.eq.${email}` : "",
          (key?.cc && key?.nsn) ? `and(phone_cc.eq.${key.cc},phone_nsn.eq.${key.nsn})` : "",
        ].filter(Boolean).join(",") || "email.eq.__none__");

      if (selErr) throw selErr;

      let customerId: string | null = existing?.[0]?.id ?? null;

      if (!customerId) {
        const { data: inserted, error: insErr } = await sb
          .from("customers")
          .insert({
            user_id: userId,
            email: email ?? null,
            phone_e164: phoneObj?.e164 ?? null,
            phone_cc: phoneObj?.cc ?? null,
            phone_nsn: phoneObj?.nsn ? String(phoneObj.nsn) : null,
            first_name: (r.first_name as string | undefined) ?? null,
            last_name: (r.last_name as string | undefined) ?? null,
          })
          .select("id")
          .single();

        if (insErr) throw insErr;
        if (inserted?.id) { customersUpserted++; customerId = inserted.id; }
      } else {
        const cur = existing![0];
        const patch: Record<string, unknown> = {
          email: email ?? cur.email ?? null,
          phone_e164: phoneObj?.e164 ?? cur.phone_e164 ?? null,
          phone_cc:   phoneObj?.cc   ?? cur.phone_cc   ?? null,
          phone_nsn: (phoneObj?.nsn ? String(phoneObj.nsn) : (cur.phone_nsn ?? null)),
        };
        const fn = (r.first_name as string | undefined)?.trim();
        const ln = (r.last_name  as string | undefined)?.trim();
        if (fn) patch.first_name = fn;
        if (ln) patch.last_name  = ln;

        const { error: upErr } = await sb.from("customers").update(patch).eq("id", customerId);
        if (upErr) throw upErr;
      }

      // --- Achats & reminders ---
const order_id = (r.order_id ?? (r as any).commande ?? (r as any).order)?.toString().trim();
const order_date = parseDateFlexible(r.order_date ?? (r as any).date ?? (r as any).purchased_at);

if (customerId && order_id && order_date) {
  const order_total_raw = (r.order_total ?? (r as any).total ?? (r as any).amount) as unknown;
  const order_total =
    typeof order_total_raw === "number"
      ? order_total_raw
      : order_total_raw
        ? Number(String(order_total_raw).replace(",", "."))
        : null;

  const { data: purchase, error } = await sb
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        customer_id: customerId,
        order_id,
        order_date,
        order_total, // <— colonne réelle (numeric)
        currency: (r.currency as string | undefined) ?? "EUR",
        external_id: (r.external_id as string | undefined) ?? null,
      },
      { onConflict: "user_id,customer_id,order_id,order_date" }
    )
    .select("id")
    .single();

  if (!error && purchase?.id) {
    purchasesUpserted++;
    const { data: planned } = await sb.rpc("plan_reminders_for_purchase", {
      p_user_id: userId,
      p_purchase_id: purchase.id,
    });
    const n = Array.isArray(planned) && (planned[0] as any)?.count ? Number((planned[0] as any).count) : 0;
    remindersCreated += n;
  }
}

    } catch (e) {
      console.error("syncCsvUrl row error:", e);
    }
  }

  return { count: rows.length, customersUpserted, purchasesUpserted, remindersCreated };
}
