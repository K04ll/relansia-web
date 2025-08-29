// lib/import/upsert.ts
import { createClient } from "@/lib/supabaseAdmin";
import { normalizeEmail, normalizePhone, phoneDedupKey } from "@/lib/import/normalize";

export type ImportRow = {
  email?: string;
  phone?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  orderId?: string | number;
  orderDate?: string;
  orderTotal?: number | string;
  currency?: string;
  storeName?: string;
  externalId?: string;
};

export type UpsertStats = { customersUpserted: number; purchasesUpserted: number; remindersCreated: number };

export async function upsertRow(userId: string, row: ImportRow): Promise<UpsertStats> {
  const sb = createClient();
  const email = normalizeEmail(row.email);
  const phone = normalizePhone(row.phone, row.country || "FR");
  const key = phoneDedupKey(row.phone, row.country || "FR");

  if (!email && !phone.e164) return { customersUpserted: 0, purchasesUpserted: 0, remindersCreated: 0 };

  const { data: existing } = await sb
    .from("customers")
    .select("id, email, phone_e164, phone_cc, phone_nsn")
    .eq("user_id", userId)
    .or([
      email ? `email.eq.${email}` : "",
      key.cc && key.nsn ? `and(phone_cc.eq.${key.cc},phone_nsn.eq.${key.nsn})` : ""
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
        first_name: row.firstName ?? null,
        last_name: row.lastName ?? null
      })
      .select("id")
      .single();
    customerId = inserted?.id ?? null;
  } else {
    await sb.from("customers").update({
      email: existing?.[0]?.email ?? email ?? null,
      phone_e164: existing?.[0]?.phone_e164 ?? phone.e164 ?? null,
      phone_cc: existing?.[0]?.phone_cc ?? phone.cc ?? null,
      phone_nsn: existing?.[0]?.phone_nsn ?? (phone.nsn ? String(phone.nsn) : null),
      first_name: row.firstName ?? undefined,
      last_name: row.lastName ?? undefined
    }).eq("id", customerId);
  }

  let purchasesUpserted = 0;
  let remindersCreated = 0;

  if (customerId && row.orderId && row.orderDate) {
    const total =
      typeof row.orderTotal === "number" ? row.orderTotal :
      row.orderTotal ? Number(String(row.orderTotal).replace(",", ".")) : null;

    const { data: purchase, error } = await sb
      .from("purchases")
      .upsert({
        user_id: userId,
        customer_id: customerId,
        order_id: String(row.orderId),
        order_date: row.orderDate,
        total_amount: total,
        currency: row.currency ?? "EUR",
        store_name: row.storeName ?? null,
        external_id: row.externalId ?? null
      }, { onConflict: "user_id,customer_id,order_id,order_date" })
      .select("id")
      .single();

    if (!error && purchase?.id) {
      purchasesUpserted = 1;
      const { data: planned } = await sb.rpc("plan_reminders_for_purchase", {
        p_user_id: userId,
        p_purchase_id: purchase.id
      });
      remindersCreated = Array.isArray(planned) && planned[0]?.count ? Number(planned[0].count) : 0;
    }
  }

  return { customersUpserted: customerId ? 1 : 0, purchasesUpserted, remindersCreated };
}
