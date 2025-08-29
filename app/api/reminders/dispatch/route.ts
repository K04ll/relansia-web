// app/api/reminders/dispatch/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendViaProvider } from "@/lib/providers/channels";
import { errorJSON, nowISO } from "@/lib/logging";
import type { SendPayload, ProviderResult } from "@/lib/providers/types";

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

export async function POST(req: Request) {
  // Auth Cron (Vercel Cron OU Bearer secret)
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-vercel-cron");
  if (!cronHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(errorJSON("unauthorized", "Unauthorized"), { status: 401 });
  }

  console.log("[Dispatch] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // 1) Pick & lock (status 'sending' atomique via RPC)
    let reminders: any[] | null = null;

    const rpc1 = await supabase.rpc("pick_reminders_for_dispatch", { batch: 50 });
    if (rpc1.error) {
      const msg = (rpc1.error as any)?.message || "";
      const code = (rpc1.error as any)?.code || "";
      console.warn("[Dispatch] RPC(batch) error:", { code, msg });

      if (/without parameters/i.test(msg) || code === "PGRST202") {
        console.log("[Dispatch] Fallback to RPC without parameters");
        const rpc2 = await supabase.rpc("pick_reminders_for_dispatch");
        if (rpc2.error) throw rpc2.error;
        reminders = rpc2.data as any[] | null;
      } else {
        throw rpc1.error;
      }
    } else {
      reminders = rpc1.data as any[] | null;
    }

    let processed = 0, sent = 0, failed = 0, retried = 0;

    for (const r of reminders ?? []) {
      processed++;

      // 2) Vérifier fenêtre horaire
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

        const delayMs = nextBackoffMs(r.retry_count ?? 0, 60_000);
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

      // 3) Construire payload typé
      let payload: SendPayload | null = null;
      if (r.channel === "email" && r.client_email) {
        payload = {
          channel: "email",
          to: r.client_email,
          subject: r.subject ?? "Votre rappel",
          message: r.message ?? "",
        };
      } else if (r.channel === "sms" && r.client_phone) {
        payload = {
          channel: "sms",
          to: r.client_phone,
          message: r.message ?? "",
        };
      } else if (r.channel === "whatsapp" && r.client_phone) {
        payload = {
          channel: "whatsapp",
          to: r.client_phone,
          message: r.message ?? "",
        };
      }

      if (!payload) {
        // Pas d’info de contact
        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "failed",
          provider_id: null,
          error_detail: { code: "missing_contact", message: "Missing client_email/phone" },
        });
        failed++;
        continue;
      }

      // 4) Envoi via provider
      let result: ProviderResult;
      try {
        result = await sendViaProvider(r.channel, payload);
      } catch (e: any) {
        result = {
          ok: false,
          providerId: "router",
          at: nowISO(),
          code: "PROVIDER_DISPATCH_ERROR",
          error: e?.message ?? String(e),
          retryable: false,
        };
      }

      // 5) Résultat
      if (result.ok) {
        sent++;
        await supabase.from("reminders").update({
          status: "sent",
          sent_at: nowISO(),
          last_error_code: null,
          last_error: null,
        }).eq("id", r.id);

        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "success",
          provider_id: result.providerId,
          error_detail: null,
        });
      } else {
        failed++;
        const attempts = (r.retry_count ?? 0) + 1;
        const delayMs = nextBackoffMs(r.retry_count ?? 0);
        const nextAttempt = new Date(Date.now() + delayMs).toISOString();

        await supabase.from("reminders").update({
          status: "scheduled",
          retry_count: attempts,
          next_attempt_at: nextAttempt,
          last_error_code: result.code,
          last_error: result.error,
        }).eq("id", r.id);

        await supabase.from("dispatch_logs").insert({
          user_id: r.user_id,
          reminder_id: r.id,
          channel: r.channel,
          status: "failed",
          provider_id: null,
          error_detail: {
            code: result.code,
            message: result.error,
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

/** Vérifie la fenêtre horaire utilisateur */
async function isWithinSendWindow(user_id: string): Promise<boolean> {
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!settings) return true;

  try {
    const now = new Date();
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: settings.timezone || "UTC" }));
    const currentDay = tzNow.getDay();
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
