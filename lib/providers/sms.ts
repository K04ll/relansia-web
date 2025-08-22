// lib/providers/sms.ts
import "server-only";
import type { SendPayload, ProviderResult } from "../types";

export async function sendSms(payload: SendPayload): Promise<ProviderResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!sid || !token) return { ok: false, error: "twilio_not_configured" };
  if (!from) return { ok: false, error: "missing_sms_from" };
  const to = payload.client?.phone;
  if (!to) return { ok: false, error: "missing_phone" };

  try {
    const twilioMod = await import("twilio");
    const client = twilioMod.default(sid, token);
    const msg = await client.messages.create({ from, to, body: payload.message });
    return { ok: true, providerId: msg.sid, at: new Date().toISOString() };
  } catch (e: any) {
    return { ok: false, error: "twilio_failed", detail: String(e?.message || e) };
  }
}
