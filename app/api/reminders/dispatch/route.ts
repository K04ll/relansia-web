// app/api/reminders/dispatch/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/providers/email";
import { sendSms } from "@/lib/providers/sms";
import { sendWhatsapp } from "@/lib/providers/whatsapp";
import { errorJSON, nowISO } from "@/lib/logging";

/** Backoff exponentiel + full jitter (min 30s, cap 6h). */
function nextBackoffMs(attempts: number, baseMs = 30_000, maxMs = 21_600_000) {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempts));
  const jitter = 0.5 + Math.random(); // 0.5..1.5
  return Math.min(maxMs, Math.round(exp * jitter));
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type ProviderOk = { ok: true; providerId: string | null; at: string };
type ProviderErr = { ok: false; error: string; detail?: string | null };

export async function POST(req: Request) {
  // Auth Cron (Vercel Cron OU Bearer secret)
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-vercel-cron");
  if (!cronHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(errorJSON("unauthorized", "Unauthorized"), { status: 401 });
  }

  // Log utile (visible dans Vercel)
  console.log("[Dispatch] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // 1) Pick & lock (status 'sending' atomique via RPC)
    let reminders: any[] | null = null;

    // Essai 1 : version paramétrée (batch)
    const rpc1 = await supabase.rpc("pick_reminders_for_dispatch", { batch: 50 });

    if (rpc1.error) {
      const msg = (rpc1.error as any)?.message || "";
      const code = (rpc1.error as any)?.code || "";
      console.warn("[Dispatch] RPC(batch) error:", { code, msg });

      // Fallback si l’API attend la version SANS paramètre (wrapper SQL)
      if (/without parameters/i.test(msg) || code === "PGRST202") {
        console.log("[Dispatch] Fallback to RPC without parameters");
        const rpc2 = await supabase.rpc("pick_reminders_for_dispatch");
        if (rpc2.error) {
          console.error("[Dispatch] RPC(no-arg) error:", {
            code: (rpc2.error as any)?.code,
            msg: (rpc2.error as any)?.message,
          });
          throw rpc2.error;
        }
        reminders = rpc2.data as any[] | null;
      } else {
        throw rpc1.error;
      }
    } else {
      reminders = rpc1.data as any[] | null;
    }

    let processed = 0,
      sent = 0,
      failed = 0,
      retried = 0;

    for (const r of reminders ?? []) {
      processed++;

      // 2) Vérifier fenêtre horaire (user settings). Si fermée: skip → replanifie légèrement
      const inWindow = await isWithinSendWindow(r.user_id);
      if (!inWindow) {
        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "skipped_window",
          provider_id: null,
          error_detail: { code: "window_closed", message: "Outside allowed window" },
        });

        const delayMs = nextBackoffMs(r.retry_count ?? 0, 60_000); // min 1 min si hors fenêtre
        await supabase
          .from("reminders")
          .update({
            status: "scheduled",
            next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
          })
          .eq("id", r.id);

        retried++;
        continue;
      }

      // 3) Dispatch par channel
      let result: ProviderOk | ProviderErr | undefined;
      try {
        if (r.channel === "email") {
          result = await sendEmail({
            id: r.id,
            channel: "email",
            message: r.message,
            client: { email: r.client_email },
          });
        } else if (r.channel === "sms") {
          result = await sendSms({
            id: r.id,
            channel: "sms",
            message: r.message,
            client: { email: r.client_email, phone: r.client_phone },
          });
        } else if (r.channel === "whatsapp") {
          result = await sendWhatsapp({
            id: r.id,
            channel: "whatsapp",
            message: r.message,
            client: { email: r.client_email, phone: r.client_phone },
          });
        } else {
          result = { ok: false, error: "unknown_channel", detail: String(r.channel) };
        }
      } catch (e: any) {
        result = { ok: false, error: "provider_dispatch_error", detail: e?.message ?? String(e) };
      }

      // 4) Résultat
      if (result?.ok) {
        sent++;

        await supabase
          .from("reminders")
          .update({
            status: "sent",
            sent_at: nowISO(),
            last_error_code: null,
            last_error: null,
          })
          .eq("id", r.id);

        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "success",
          provider_id: (result as ProviderOk).providerId ?? null,
          error_detail: null,
        });
      } else {
        failed++;

        const attempts = (r.retry_count ?? 0) + 1;
        const delayMs = nextBackoffMs(r.retry_count ?? 0);
        const nextAttempt = new Date(Date.now() + delayMs).toISOString();

        await supabase
          .from("reminders")
          .update({
            status: "scheduled",
            retry_count: attempts,
            next_attempt_at: nextAttempt,
            last_error_code: (result as ProviderErr | undefined)?.error ?? "unknown_error",
            last_error: (result as ProviderErr | undefined)?.detail ?? null,
          })
          .eq("id", r.id);

        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "failed",
          provider_id: null,
          error_detail: {
            code: (result as ProviderErr | undefined)?.error ?? "unknown_error",
            message: (result as ProviderErr | undefined)?.detail ?? "Unspecified error",
            retry_in_ms: delayMs,
          },
        });

        retried++;
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
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!settings) return true; // pas de restriction

  try {
    const now = new Date();
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: settings.timezone || "UTC" }));
    const currentDay = tzNow.getDay(); // 0=dimanche
    const currentTime = tzNow.toTimeString().slice(0, 5);

    if (!settings.send_window) return true;
    const { start, end, days } = settings.send_window;

    if (!Array.isArray(days) || !days.includes(currentDay)) return false;
    if (currentTime < start || currentTime > end) return false;

    return true;
  } catch {
    return true;
  }
}
