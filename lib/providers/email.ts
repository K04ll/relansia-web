// lib/providers/email.ts
import "server-only";
import type { SendPayload, ProviderResult } from "../types";

export async function sendEmail(payload: SendPayload): Promise<ProviderResult> {
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  if (!from) return { ok: false, error: "missing_from_email" };
  const to = payload.client?.email;
  if (!to) return { ok: false, error: "missing_email" };
  if (!apiKey) return { ok: false, error: "resend_not_configured" };

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  try {
    const res = await resend.emails.send({
      from,
      to,
      subject: "Relansia",
      text: payload.message,
    });
    if ((res as any).error) {
      const err = (res as any).error;
      return { ok: false, error: "resend_failed", detail: String(err?.message ?? err) };
    }
    return { ok: true, providerId: (res as any)?.data?.id ?? null, at: new Date().toISOString() };
  } catch (e: any) {
    return { ok: false, error: "resend_exception", detail: String(e?.message || e) };
  }
}
