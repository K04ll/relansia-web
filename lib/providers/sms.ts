// lib/providers/sms.ts
import type { ProviderSendResult } from "./email";
import twilio from "twilio";

export type SmsSendInput = {
  to: string;
  body: string;
  fromNumber?: string;           // override possible
  messagingServiceSid?: string;  // override possible (Alpha Sender via MSID)
};

function nowISO() { return new Date().toISOString(); }

export async function sendSMS(input: SmsSendInput): Promise<ProviderSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  const envFrom = process.env.TWILIO_SMS_FROM;
  const envMSID = process.env.TWILIO_MESSAGING_SERVICE_SID;

  const from = input.fromNumber ?? envFrom;
  const messagingServiceSid = input.messagingServiceSid ?? envMSID;

  if (!sid || !token || (!from && !messagingServiceSid)) {
    // Mock dev si pas config
    await new Promise((r) => setTimeout(r, 120));
    return { ok: true, providerId: `mock_sms_${Math.random().toString(36).slice(2)}`, at: nowISO() };
  }

  try {
    const client = twilio(sid, token);

    // priorité au Messaging Service (Alpha RELANSIA)
    if (messagingServiceSid) {
      try {
        const msg = await client.messages.create({
          to: input.to,
          body: input.body,
          messagingServiceSid,
        });
        return { ok: true, providerId: msg.sid, at: (msg.dateCreated ?? new Date()).toISOString?.() ?? nowISO() };
      } catch (err) {
        if (!from) throw err;
        // sinon on tente le fallback numéro
      }
    }

    // Fallback numéro
    const msg = await client.messages.create({
      to: input.to,
      body: input.body,
      from: from!, // on sait qu'il existe ici
    });
    return { ok: true, providerId: msg.sid, at: (msg.dateCreated ?? new Date()).toISOString?.() ?? nowISO() };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
