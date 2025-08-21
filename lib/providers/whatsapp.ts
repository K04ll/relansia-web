// lib/providers/whatsapp.ts
import type { ProviderSendResult } from "./email";
import twilio from "twilio";

export type WhatsAppSendInput = {
  to: string;             // ex: +336...
  body: string;
  fromWhatsApp?: string;  // override possible (ex: whatsapp:+14155238886)
};

function nowISO() { return new Date().toISOString(); }
function wa(n: string) { return n.startsWith("whatsapp:") ? n : `whatsapp:${n}`; }

export async function sendWhatsApp(input: WhatsAppSendInput): Promise<ProviderSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const envFrom = process.env.TWILIO_WHATSAPP_FROM;

  const from = input.fromWhatsApp ?? envFrom;

  if (!sid || !token || !from) {
    // Mock dev
    await new Promise((r) => setTimeout(r, 120));
    return { ok: true, providerId: `mock_whatsapp_${Math.random().toString(36).slice(2)}`, at: nowISO() };
  }

  try {
    const client = twilio(sid, token);
    const msg = await client.messages.create({
      from: wa(from),
      to: wa(input.to),
      body: input.body,
    });
    return { ok: true, providerId: msg.sid, at: (msg.dateCreated ?? new Date()).toISOString?.() ?? nowISO() };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
