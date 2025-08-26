// app/api/reminders/generate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { nowISO, errorJSON, toErrorInfo } from "@/lib/logging";

// Types simples internes
type Channel = "email" | "sms" | "whatsapp";
type Rule = {
  id: string;
  delay_days: number;
  channel: Channel;
  template: string | null;
  position: number;
  enabled: boolean;
};
type Client = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function eligible(c: Client, channel: Channel): boolean {
  if (channel === "email") return !!c.email;
  if (channel === "sms" || channel === "whatsapp") return !!c.phone;
  return false;
}

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function getUserIdOrDev() {
  // ⚠️ Adapte selon ton auth. Ici, fallback dev.
  return process.env.DEV_USER_ID || "00000000-0000-0000-0000-000000000000";
}

export async function POST(_req: Request) {
  try {
    const userId = await getUserIdOrDev();

    // 1) Récup settings (timezone pas indispensable ici mais utile si tu veux affiner plus tard)
    const { data: settings, error: setErr } = await supabaseServer
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (setErr) return err("settings_fetch_failed", setErr.message, 500);

    // 2) Règles actives (ordonnées)
    const { data: rules, error: ruleErr } = await supabaseServer
      .from("reminder_rules")
      .select("*")
      .eq("user_id", userId)
      .eq("enabled", true)
      .order("position", { ascending: true }) as { data: Rule[] | null; error: any };

    if (ruleErr) return err("rules_fetch_failed", ruleErr.message, 500);
    if (!rules || rules.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, reason: "no_rules" });
    }

    // 3) Clients
    const { data: clients, error: cliErr } = await supabaseServer
      .from("clients")
      .select("id,email,phone,first_name,last_name")
      .eq("user_id", userId) as { data: Client[] | null; error: any };

    if (cliErr) return err("clients_fetch_failed", cliErr.message, 500);
    if (!clients || clients.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, reason: "no_clients" });
    }

    // 4) Construire les "seeds" (combinaisons à créer) en filtrant l’éligibilité par canal
    type Seed = { user_id: string; client_id: string; channel: Channel; delay_days: number };
    const seeds: Seed[] = [];
    for (const r of rules) {
      for (const c of clients) {
        if (!eligible(c, r.channel)) continue;
        seeds.push({ user_id: userId, client_id: c.id, channel: r.channel, delay_days: r.delay_days });
      }
    }
    if (seeds.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, reason: "no_eligible_pairs" });
    }

    // 5) Vérifier ceux qui existent déjà (idempotence) via la contrainte unique
    //    On interroge les combinaisons existantes pour éviter les conflits
    //    NB: si beaucoup de seeds, on peut batcher. Ici on fait simple.
        // 5) Vérifier ceux qui existent déjà (idempotence)
    const existingKeys: Record<string, 1> = {};

    const { data: exist, error: existErr } = await supabaseServer
      .from("reminders")
      .select("user_id,client_id,channel,delay_days")
      .eq("user_id", userId)
      .in(
        "client_id",
        seeds.map((s) => s.client_id)
      );

    if (existErr) return err("existing_fetch_failed", existErr.message, 500);

    for (const e of exist || []) {
      const k = `${e.user_id}|${e.client_id}|${e.channel}|${e.delay_days}`;
      existingKeys[k] = 1;
    }


    // 6) Construire les insertions (uniquement nouvelles)
    const now = nowISO();
    type InsertRow = {
      user_id: string;
      client_id: string;
      channel: Channel;
      delay_days: number;
      message: string | null;
      status: "scheduled";
      scheduled_at: string;
      next_attempt_at: string;
      retry_count: number;
      last_attempt_at: string | null;
      last_error_code: string | null;
      last_error: string | null;
    };

    const toInsert: InsertRow[] = [];
    for (const r of rules) {
      const scheduled_at = addDaysISO(r.delay_days); // UTC; fenêtre d’envoi sera respectée par le worker
      for (const c of clients) {
        if (!eligible(c, r.channel)) continue;
        const key = `${userId}|${c.id}|${r.channel}|${r.delay_days}`;
        if (existingKeys[key]) continue; // idempotence
        toInsert.push({
          user_id: userId,
          client_id: c.id,
          channel: r.channel,
          delay_days: r.delay_days,
          message: r.template ?? null, // peut être null → provider utilisera template par défaut
          status: "scheduled",
          scheduled_at,
          next_attempt_at: scheduled_at,
          retry_count: 0,
          last_attempt_at: null,
          last_error_code: null,
          last_error: null,
        });
      }
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ created: 0, skipped: seeds.length, reason: "all_already_exist" });
    }

    const { error: insErr } = await supabaseServer
  .from("reminders")
  .upsert(toInsert, {
    onConflict: "user_id,client_id,channel,delay_days",
    ignoreDuplicates: true
  });
    if (insErr) return err("insert_failed", insErr.message, 500);

    return NextResponse.json({
      processed_rules: rules.length,
      processed_clients: clients.length,
      created: toInsert.length,
      skipped: seeds.length - toInsert.length,
    });
  } catch (e: any) {
    const ei = toErrorInfo(e);
    return NextResponse.json({ error: errorJSON(ei.code, ei.message) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // facultatif: permettre GET pour debug
  return POST(req);
}
