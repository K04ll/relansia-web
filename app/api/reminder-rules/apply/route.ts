import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";

type Rule = {
  id: string;
  delay_days: number;
  channel: "email" | "sms" | "whatsapp";
  message_template: string | null;
};

type Client = {
  id: string;
  email: string | null;
  purchased_at: string | null; // colonne attendue côté DB (déjà utilisée dans ton Modal)
  product: string | null;
};

export async function POST() {
  const userId = await getUserIdOrDev();

  // 1) Charger les règles
  const { data: rules, error: rulesErr } = await supabaseServer
    .from("reminder_rules")
    .select("*")
    .eq("user_id", userId)
    .order("delay_days", { ascending: true }) as unknown as { data: Rule[] | null; error: any };

  if (rulesErr) {
    return NextResponse.json({ error: rulesErr.message }, { status: 500 });
  }
  if (!rules || rules.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0, reason: "no_rules" });
  }

  // 2) Charger les clients
  const { data: clients, error: clientsErr } = await supabaseServer
    .from("clients")
    .select("id,email,purchased_at,product")
    .eq("user_id", userId) as unknown as { data: Client[] | null; error: any };

  if (clientsErr) {
    return NextResponse.json({ error: clientsErr.message }, { status: 500 });
  }
  if (!clients || clients.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0, reason: "no_clients" });
  }

  let created = 0;
  let skipped = 0;

  // 3) Pour chaque client x règle → créer une relance si pas déjà existante
  for (const c of clients) {
    if (!c.purchased_at) { skipped++; continue; }

    const purchasedAt = new Date(c.purchased_at);
    if (isNaN(purchasedAt.getTime())) { skipped++; continue; }

    for (const r of rules) {
      const scheduledAt = new Date(purchasedAt.getTime() + r.delay_days * 24 * 60 * 60 * 1000);

      // Vérifier si une relance semblable existe déjà
      // (même user, même client, même canal, même jour planifié)
      const dayStart = new Date(scheduledAt);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(scheduledAt);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: existing, error: existErr } = await supabaseServer
        .from("reminders")
        .select("id")
        .eq("user_id", userId)
        .eq("client_id", c.id)
        .eq("channel", r.channel)
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .limit(1);

      if (existErr) {
        // On ne bloque pas tout le batch pour une erreur; on passe
        skipped++;
        continue;
      }
      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      // Construire le message initial (optionnel)
      const message = r.message_template ?? null;

      const { error: insertErr } = await supabaseServer
        .from("reminders")
        .insert({
          user_id: userId,
          client_id: c.id,
          product: c.product ?? null,
          channel: r.channel,
          message,
          status: "scheduled",
          scheduled_at: scheduledAt.toISOString(),
        });

      if (insertErr) {
        skipped++;
        continue;
      }
      created++;
    }
  }

  return NextResponse.json({ created, skipped });
}
