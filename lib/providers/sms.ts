// lib/providers/sms.ts
"use server";
import "server-only";

import type { SmsPayload, ProviderResult } from "@/lib/providers/types";
import Twilio from "twilio";

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioFrom = process.env.TWILIO_SMS_FROM!; // ex: "+33601020304"
const hasTwilio =
  Boolean(twilioSid) && Boolean(twilioToken) && Boolean(twilioFrom);

const client = hasTwilio ? Twilio(twilioSid, twilioToken) : null;

const nowISO = () => new Date().toISOString();

export async function sendSms(payload: SmsPayload): Promise<ProviderResult> {
  try {
    if (!hasTwilio || !client) {
      return { ok: false, error: "twilio_not_configured", detail: "Missing TWILIO_* env" };
    }

    const to = payload.client?.phone ?? null;
    if (!to) {
      return { ok: false, error: "missing_phone", detail: "No recipient phone" };
    }

    // message est optionnel dans les types → on force un string non vide
    const smsBody = (payload.message ?? "").toString().trim();
    if (!smsBody) {
      return { ok: false, error: "missing_message", detail: "Empty SMS body" };
    }

    const msg = await client.messages.create({
      from: twilioFrom,
      to,              // idéalement déjà en E.164 (+336…)
      body: smsBody,   // 👈 string garanti
    });

    return {
      ok: true,
      providerId: msg.sid ?? null,
      at: nowISO(),
    };
  } catch (e: any) {
    return {
      ok: false,
      error: "twilio_send_failed",
      detail: e?.message ?? String(e),
    };
  }
}
