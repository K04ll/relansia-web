// lib/providers/email.ts
import { Resend } from "resend";
import { toErrorInfo } from "@/lib/logging";

export type EmailSendInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export type ProviderSendResult =
  | { ok: true; providerId: string; at: string }
  | { ok: false; error: string };

function nowISO() { return new Date().toISOString(); }

/** ---- Throttling 2 req/s ---- */
const Q_INTERVAL_MS = 500; // 2 req/s
let queue: Array<() => Promise<void>> = [];
let running = false;
async function runQueue() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try { await job(); } catch {}
    await new Promise((r) => setTimeout(r, Q_INTERVAL_MS));
  }
  running = false;
}
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push(async () => {
      try { resolve(await fn()); } catch (e) { reject(e); }
    });
    runQueue();
  });
}
/** ---------------------------- */

// Pré-validation simple (assez permissive) — suffit pour filtrer les cas manifestement invalides
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function mapResendError(err: any): string {
  const info = toErrorInfo(err);
  const msg = String(info.message || "").toLowerCase();

  if (msg.includes("invalid `to` field") || msg.includes("invalid to field")) {
    return "invalid_email";
  }
  if (/domain/.test(msg) && /(not.*verified|unverified|verify)/.test(msg)) {
    return "domain_not_verified";
  }
  if (/rate|throttl/.test(msg)) return "rate_limited";
  return msg || "provider_error";
}

export async function sendEmail(input: EmailSendInput): Promise<ProviderSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const domainFromEnv = process.env.RESEND_FROM;
  const from = input.from ?? domainFromEnv ?? "Relansia <noreply@relansia.com>";

  // 🔎 Court-circuit si email manifestement invalide
  if (!emailRegex.test(input.to)) {
    return { ok: false, error: "invalid_email" };
  }

  // MOCK si clé absente
  if (!apiKey) {
    return { ok: true, providerId: "mock_email_" + Math.random().toString(36).slice(2), at: nowISO() };
  }

  const resend = new Resend(apiKey);

  return enqueue(async () => {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      } as any);

      if (error) return { ok: false, error: mapResendError(error) };

      const id = (data as any)?.id ?? (data as any)?.data?.id ?? "resend_unknown";
      return { ok: true, providerId: id, at: nowISO() };
    } catch (e: any) {
      return { ok: false, error: mapResendError(e) };
    }
  });
}
