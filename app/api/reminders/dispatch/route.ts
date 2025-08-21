// app/api/reminders/dispatch/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendViaProvider } from "@/lib/providers/channels";
import { nowISO, errorJSON, toErrorInfo, ERROR } from "@/lib/logging";

/** Erreurs définitives → pas de retry */
const NON_RETRYABLE = new Set<string>([
  "invalid_email",
  "missing_email",
  "missing_phone",
  "empty_message",
  "unknown_channel",
]);

const RETRY_MAX = 3;
const RETRY_BACKOFF_MIN = [5, 15, 60]; // minutes 1er/2e/3e retry

const plusMinutesISO = (min: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + min);
  return d.toISOString();
};

function assertCronAuth(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  const vercelCron = req.headers.get("x-vercel-cron") || "";

  // ✅ Si la requête vient du scheduler Vercel
  if (vercelCron === "1") return;

  // ✅ Si la requête est locale / manuelle avec secret
  if (secret && auth === `Bearer ${secret}`) return;

  throw new Error("CRON_UNAUTHORIZED");
}



/** Charge TOUS les reminders éligibles (multi-users) */
async function loadEligibleReminders() {
  const supabase = supabaseServer;
  const now = nowISO();
  const { data, error } = await supabase
    .from("reminders")
    .select(`
      id, user_id, client_id, channel, message, status, scheduled_at,
      retry_count, next_attempt_at, last_attempt_at, last_error_code, last_error,
      clients:clients(email, phone)
    `)
    .eq("status", "scheduled")
    .or(`scheduled_at.lte.${now},next_attempt_at.lte.${now}`)
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

/** Log en DB (success/failed) */
async function logDispatch(args: {
  userId: string | null;
  reminderId: string;
  channel: "email" | "sms" | "whatsapp";
  ok: boolean;
  providerId?: string | null;
  code?: string | null;
  message?: string | null;
}) {
  const supabase = supabaseServer;
  await supabase.from("dispatch_logs").insert({
    user_id: args.userId,
    reminder_id: args.reminderId,
    channel: args.channel,
    status: args.ok ? "success" : "failed",
    provider_id: args.ok ? (args.providerId ?? null) : null,
    error_detail: args.ok ? null : errorJSON(args.code ?? null, args.message ?? "Unknown error"),
    created_at: nowISO(),
  } as any);
}

export async function POST(req: Request) {
  try {
    // 🔐 Protégé par CRON_SECRET
    assertCronAuth(req);

    const supabase = supabaseServer;
    const rows = await loadEligibleReminders();

    if (rows.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, failed: 0, retried: 0 });
    }

    let sent = 0, failed = 0, retried = 0;

    for (const r of rows as any[]) {
      try {
        // Validation message
        if (!r.message || !String(r.message).trim()) {
          const err = ERROR.EMPTY_MESSAGE;
          await logDispatch({ userId: r.user_id, reminderId: r.id, channel: r.channel, ok: false, code: err.code, message: err.message });
          await supabase.from("reminders").update({
            status: "failed",
            last_attempt_at: nowISO(),
            last_error_code: err.code,
            last_error: errorJSON(err.code, err.message),
            next_attempt_at: null,
          }).eq("id", r.id);
          failed++;
          continue;
        }

        // Envoi via agrégateur (email/sms/whatsapp)
        const res = await sendViaProvider(
          r.channel,
          {
            id: r.id,
            channel: r.channel,
            message: r.message,
            client: r.clients ?? { email: null, phone: null },
            meta: undefined, // storeName/ctaUrl si besoin
          },
          {}
        );

        if (res.ok) {
          await logDispatch({
            userId: r.user_id, reminderId: r.id, channel: r.channel, ok: true, providerId: (res as any).providerId ?? null,
          });
          await supabase.from("reminders").update({
            status: "sent",
            sent_at: (res as any).at ?? nowISO(),
            last_attempt_at: nowISO(),
            last_error_code: null,
            last_error: null,
            next_attempt_at: null,
          }).eq("id", r.id);
          sent++;
        } else {
          const code = res.error ?? null;
          const msg  = res.error ?? "provider_error";

          await logDispatch({ userId: r.user_id, reminderId: r.id, channel: r.channel, ok: false, code, message: msg });

          // No-retry => FAILED direct
          if (code && NON_RETRYABLE.has(code)) {
            await supabase.from("reminders").update({
              status: "failed",
              last_attempt_at: nowISO(),
              last_error_code: code,
              last_error: errorJSON(code, msg),
              next_attempt_at: null,
            }).eq("id", r.id);
            failed++;
            continue;
          }

          // Retry/backoff
          const currentRetry = r.retry_count ?? 0;
          const willRetry = currentRetry < RETRY_MAX;
          if (willRetry) {
            const backoff = RETRY_BACKOFF_MIN[currentRetry] ?? 60;
            await supabase.from("reminders").update({
              retry_count: currentRetry + 1,
              last_attempt_at: nowISO(),
              last_error_code: code,
              last_error: errorJSON(code, msg),
              next_attempt_at: plusMinutesISO(backoff),
            }).eq("id", r.id);
            retried++;
          } else {
            await supabase.from("reminders").update({
              status: "failed",
              last_attempt_at: nowISO(),
              last_error_code: code,
              last_error: errorJSON(code, msg),
              next_attempt_at: null,
            }).eq("id", r.id);
            failed++;
          }
        }
      } catch (e: any) {
        const ei = toErrorInfo(e);
        await logDispatch({ userId: (r as any).user_id, reminderId: (r as any).id, channel: (r as any).channel, ok: false, code: ei.code, message: ei.message });
        await supabaseServer.from("reminders").update({
          status: "failed",
          last_attempt_at: nowISO(),
          last_error_code: ei.code,
          last_error: errorJSON(ei.code, ei.message),
          next_attempt_at: null,
        }).eq("id", (r as any).id);
        failed++;
      }
    }

    return NextResponse.json({ processed: rows.length, sent, failed, retried });
  } catch (e: any) {
    const ei = toErrorInfo(e);
    return NextResponse.json({ error: "fatal", detail: ei.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
