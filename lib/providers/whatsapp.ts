// lib/providers/whatsapp.ts
"use server";
import "server-only";

import type { WhatsAppPayload, ProviderResult } from "@/lib/providers/types";
import Twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID!;
const token = process.env.TWILIO_AUTH_TOKEN!;
const from = process.env.TWILIO_WHATSAPP_FROM!; // ex: "whatsapp:+14155238886"

const hasTwilio = Boolean(sid) && Boolean(token) && Boolean(from);
const client = hasTwilio ? Twilio(sid, token) : null;

const nowISO = () => new Date().toISOString();

export async function sendWhatsApp(payload: WhatsAppPayload): Promise<ProviderResult> {
  try {
    if (!hasTwilio || !client) {
      return { ok: false, error: "twilio_not_configured", detail: "Missing TWILIO_* env" };
    }

    const phone = payload.client?.phone ?? null;
    if (!phone) {
      return { ok: false, error: "missing_phone", detail: "No recipient phone" };
    }

    // Twilio WhatsApp nécessite le préfixe "whatsapp:"
    const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;

    // message optionnel -> on force un string non vide
    const body = (payload.message ?? "").toString().trim();
    if (!body) {
      return { ok: false, error: "missing_message", detail: "Empty WhatsApp body" };
    }

    const msg = await client.messages.create({
      from, // doit déjà être "whatsapp:+1..."
      to,
      body, // ✅ string garanti
    });

    return { ok: true, providerId: msg.sid ?? null, at: nowISO() };
  } catch (e: any) {
    return { ok: false, error: "twilio_send_failed", detail: e?.message ?? String(e) };
  }
}

// alias rétro-compat
export { sendWhatsApp as sendWhatsapp };
