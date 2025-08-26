// app/api/clients/import/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";
import { parsePhoneNumberFromString } from "libphonenumber-js";

type Row = Record<string, any>;
type Mapping = Partial<{ email: string; phone: string; first_name: string; last_name: string }>;

type ClientPayload = {
  user_id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
};

// Helpers
function normEmail(v: any): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return s || null;
}
function safeParseE164(raw: string, defaultCountry: string): string | null {
  try {
    if (raw.startsWith("+")) {
      const p = parsePhoneNumberFromString(raw);
      if (p && p.isValid()) return p.number;
    } else {
      try {
        // @ts-expect-error compat signatures
        const pObj = parsePhoneNumberFromString(raw, { defaultCountry });
        if (pObj && pObj.isValid()) return pObj.number;
      } catch {}
      try {
        // @ts-expect-error compat signatures
        const pStr = parsePhoneNumberFromString(raw, defaultCountry);
        if (pStr && pStr.isValid()) return pStr.number;
      } catch {}
    }
  } catch {}
  return null;
}
function normPhoneSmart(v: any, defaultCountry = "FR"): string | null {
  if (typeof v !== "string") return null;
  const raw = v.replace(/[^\d+]/g, "").trim();
  if (!raw) return null;
  return safeParseE164(raw, defaultCountry);
}
function isValidEmail(v: string | null) {
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhoneE164(v: string | null) {
  return !!v && /^\+\d{8,}$/.test(v);
}
function completenessScore(c: ClientPayload) {
  let s = 0;
  if (c.email) s++;
  if (c.phone) s++;
  if (c.first_name) s++;
  if (c.last_name) s++;
  return s;
}
function mergePreferFilled(a: ClientPayload, b: ClientPayload): ClientPayload {
  return {
    user_id: a.user_id,
    email: a.email ?? b.email ?? null,
    phone: a.phone ?? b.phone ?? null,
    first_name: a.first_name ?? b.first_name ?? null,
    last_name: a.last_name ?? b.last_name ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const user_id = getUserIdOrDev();
    const body = await req.json();
    const rows: Row[] = body?.rows ?? [];
    const mapping: Mapping = body?.mapping ?? {};
    const defaultCountry: string = body?.defaultCountry || "FR";

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: false, error: "no_rows" }, { status: 400 });
    }

    // 1) Projection + normalisation
    const projected: ClientPayload[] = rows.map((r) => {
      const email = mapping.email ? r[mapping.email] : null;
      const phone = mapping.phone ? r[mapping.phone] : null;
      const first_name = mapping.first_name ? r[mapping.first_name] : null;
      const last_name = mapping.last_name ? r[mapping.last_name] : null;

      return {
        user_id,
        email: normEmail(email),
        phone: normPhoneSmart(phone, defaultCountry),
        first_name: typeof first_name === "string" ? first_name.trim() || null : null,
        last_name: typeof last_name === "string" ? last_name.trim() || null : null,
      };
    });

    // 2) On garde au moins email OU phone
    const candidates = projected.filter((c) => c.email || c.phone);

    // 3) Fusion doublons in-memory (on garde la fiche la plus complète)
    const emailMap = new Map<string, ClientPayload>();
    const phoneMap = new Map<string, ClientPayload>();
    let normalized_count = 0;
    let completed_from_duplicates = 0;

    for (const c of candidates) {
      if (c.phone) normalized_count++;

      if (isValidEmail(c.email)) {
        const k = c.email!;
        if (!emailMap.has(k)) {
          emailMap.set(k, c);
        } else {
          const prev = emailMap.get(k)!;
          const before = completenessScore(prev);
          const merged = mergePreferFilled(prev, c);
          const after = completenessScore(merged);
          if (after > before) completed_from_duplicates++;
          emailMap.set(k, merged);
        }
      } else if (isValidPhoneE164(c.phone)) {
        const k = c.phone!;
        if (!phoneMap.has(k)) {
          phoneMap.set(k, c);
        } else {
          const prev = phoneMap.get(k)!;
          const before = completenessScore(prev);
          const merged = mergePreferFilled(prev, c);
          const after = completenessScore(merged);
          if (after > before) completed_from_duplicates++;
          phoneMap.set(k, merged);
        }
      }
    }

    const byEmail = Array.from(emailMap.values());
    const byPhone = Array.from(phoneMap.values()).filter((c) => !isValidEmail(c.email));

    // 4) UPSERT unitaire (évite unique_violation en batch)
    let upserted_email = 0;
    let upserted_phone = 0;
    let skipped_conflicts = 0;

    for (const c of byEmail) {
      try {
        const { error } = await supabaseServer.from("clients").upsert(c, { onConflict: "user_id,email" });
        if (error) skipped_conflicts++; else upserted_email++;
      } catch { skipped_conflicts++; }
    }
    for (const c of byPhone) {
      try {
        const { error } = await supabaseServer.from("clients").upsert(c, { onConflict: "user_id,phone" });
        if (error) skipped_conflicts++; else upserted_phone++;
      } catch { skipped_conflicts++; }
    }

    const uniquePrepared = byEmail.length + byPhone.length;
    const skipped_duplicates = Math.max(0, candidates.length - uniquePrepared + skipped_conflicts);

    return NextResponse.json({
      ok: true,
      inserted_email: upserted_email,
      inserted_phone: upserted_phone,
      normalized_count,
      completed_from_duplicates,
      skipped_duplicates,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "import_error" }, { status: 500 });
  }
}
