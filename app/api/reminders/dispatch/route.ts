// app/api/reminders/dispatch/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/providers/email";
import { sendSms } from "@/lib/providers/sms";
import { sendWhatsapp } from "@/lib/providers/whatsapp";
import { errorJSON, nowISO } from "@/lib/logging";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Backoff en minutes : 5, 15, 60, 180
const BACKOFF = [5, 15, 60, 180];

export async function POST(req: Request) {
  // Auth Cron
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-vercel-cron");
  if (!cronHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(errorJSON("unauthorized", "Unauthorized"), { status: 401 });
  }

  try {
    // 1. Sélection reminders éligibles (status scheduled, now >= next_attempt_at)
    const { data: reminders, error } = await supabase.rpc("pick_reminders_for_dispatch");
    if (error) throw error;

    let processed = 0, sent = 0, failed = 0, retried = 0;

    for (const r of reminders) {
      processed++;

      // Vérifier fenêtre horaire (user settings)
      const inWindow = await isWithinSendWindow(r.user_id);
      if (!inWindow) {
        continue; // skip, sera repris au prochain tick
      }

      // Marquer en "sending"
      await supabase.from("reminders").update({
        status: "sending",
        last_attempt_at: nowISO()
      }).eq("id", r.id);

      let result;
      if (r.channel === "email") {
  result = await sendEmail({
    id: r.id,
    channel: "email",
    message: r.message,
    client: { email: r.client_email }, // <- on retire phone ici
  });
}

      if (r.channel === "sms") result = await sendSms({ id: r.id, channel: "sms", message: r.message, client: { email: r.client_email, phone: r.client_phone } });
      if (r.channel === "whatsapp") result = await sendWhatsapp({ id: r.id, channel: "whatsapp", message: r.message, client: { email: r.client_email, phone: r.client_phone } });

      if (result?.ok) {
        sent++;
        await supabase.from("reminders").update({
          status: "sent",
          sent_at: nowISO(),
          last_error_code: null,
          last_error: null
        }).eq("id", r.id);

        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "success",
          provider_id: result.providerId ?? null,
          error_detail: null
        });
      } else {
        failed++;

        // Backoff progressif
        const retry = (r.retry_count ?? 0) + 1;
        const delayMin = BACKOFF[Math.min(retry - 1, BACKOFF.length - 1)];
        const nextAttempt = new Date(Date.now() + delayMin * 60000).toISOString();

        await supabase.from("reminders").update({
          status: retry >= BACKOFF.length ? "failed" : "scheduled",
          retry_count: retry,
          next_attempt_at: retry >= BACKOFF.length ? null : nextAttempt,
          last_error_code: result?.error ?? "unknown_error",
          last_error: result?.detail ?? null
        }).eq("id", r.id);

        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "failed",
          provider_id: null,
          error_detail: { code: result?.error ?? "unknown_error", message: result?.detail ?? "Unspecified error" }
        });

        if (retry < BACKOFF.length) retried++;
      }
    }

    return NextResponse.json({ processed, sent, failed, retried });
  } catch (e: any) {
    console.error("Dispatch worker error:", e);
    return NextResponse.json(errorJSON("dispatch_failed", e?.message || "Unknown error"), { status: 500 });
  }
}

/**
 * Vérifie si l'heure actuelle (UTC) correspond à la fenêtre d'envoi
 * paramétrée par l’utilisateur.
 */
async function isWithinSendWindow(user_id: string): Promise<boolean> {
  const { data: settings } = await supabase.from("settings").select("*").eq("user_id", user_id).maybeSingle();
  if (!settings) return true; // pas de restriction

  try {
    const now = new Date();
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: settings.timezone || "UTC" }));
    const currentDay = tzNow.getDay(); // 0=dimanche
    const currentTime = tzNow.toTimeString().slice(0, 5);

    if (!settings.send_window) return true;
    const { start, end, days } = settings.send_window;

    if (!days.includes(currentDay)) return false;
    if (currentTime < start || currentTime > end) return false;

    return true;
  } catch {
    return true;
  }
}
