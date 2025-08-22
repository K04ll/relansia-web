// lib/providers/whatsapp.ts
import "server-only";
import type { SendPayload, ProviderResult } from "./types";

export async function sendWhatsApp(payload: SendPayload): Promise<ProviderResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // ex: "whatsapp:+14155238886"

  if (!sid || !token) return { ok: false, error: "twilio_not_configured" };
  if (!from) return { ok: false, error: "missing_whatsapp_from" };
  const phone = payload.client?.phone;
  if (!phone) return { ok: false, error: "missing_phone" };

  const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;

  try {
    const twilioMod = await import("twilio");
    const client = twilioMod.default(sid, token);
    const msg = await client.messages.create({ from, to, body: payload.message });
    return { ok: true, providerId: msg.sid, at: new Date().toISOString() };
  } catch (e: any) {
    return { ok: false, error: "twilio_failed", detail: String(e?.message || e) };
  }
}
