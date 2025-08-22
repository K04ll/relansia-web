// lib/providers/channels.ts
import "server-only";
import type { Channel, SendPayload, ProviderResult } from "./types";

export async function sendViaProvider(
  channel: Channel,
  payload: SendPayload,
  _opts: Record<string, any> = {}
): Promise<ProviderResult> {
  try {
    switch (channel) {
      case "email": {
        const { sendEmail } = await import("./email");
        return sendEmail(payload);
      }
      case "sms": {
        const { sendSms } = await import("./sms");
        return sendSms(payload);
      }
      case "whatsapp": {
        const { sendWhatsApp } = await import("./whatsapp");
        return sendWhatsApp(payload);
      }
      default:
        return { ok: false, error: "unknown_channel" };
    }
  } catch (e: any) {
    return { ok: false, error: "provider_dispatch_error", detail: String(e?.message || e) };
  }
}
