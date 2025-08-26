// lib/providers/channels.ts
import type {
  Channel,
  SendPayload,
  ProviderResult,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
} from "@/lib/providers/types";

/** Sécurise : le channel passé doit matcher payload.channel */
function checkChannelMatch(channel: Channel, payload: SendPayload): ProviderResult | null {
  if (payload.channel !== channel) {
    return { ok: false, error: "channel_payload_mismatch", detail: `got ${payload.channel}, expected ${channel}` };
  }
  return null;
}

export async function sendViaProvider(
  channel: Channel,
  payload: SendPayload,
  _opts: Record<string, any> = {}
): Promise<ProviderResult> {
  try {
    const mismatch = checkChannelMatch(channel, payload);
    if (mismatch) return mismatch;

    switch (channel) {
      case "email": {
        const { sendEmail } = await import("./email");
        // narrow explicite pour TS
        return sendEmail(payload as EmailPayload);
      }

      case "sms": {
        const { sendSms } = await import("./sms");
        return sendSms(payload as SmsPayload);
      }

      case "whatsapp": {
        const { sendWhatsApp } = await import("./whatsapp");
        return sendWhatsApp(payload as WhatsAppPayload);
      }

      default:
        return { ok: false, error: "unknown_channel" };
    }
  } catch (e: any) {
    return { ok: false, error: "provider_dispatch_error", detail: String(e?.message || e) };
  }
}
