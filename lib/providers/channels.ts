// lib/providers/channels.ts
import { sendEmail } from "./email";
import { sendSMS } from "./sms";
import { sendWhatsApp } from "./whatsapp";
import { renderRelansiaEmail } from "@/lib/templates/email";
import { ERROR, toErrorInfo } from "@/lib/logging";

type ClientInfo = { email?: string | null; phone?: string | null };

export type ProviderResult =
  | { ok: true; providerId: string; at?: string }
  | { ok: false; error: string };

export async function sendViaProvider(
  channel: "email" | "sms" | "whatsapp",
  payload: {
    id: string;
    channel: "email" | "sms" | "whatsapp";
    message: string;
    client: ClientInfo | null;
    meta?: { storeName?: string; ctaUrl?: string };
  },
  _opts: Record<string, unknown> = {}
): Promise<ProviderResult> {
  try {
    const client = payload.client ?? {};
    const storeName = payload.meta?.storeName ?? "Votre boutique";
    const ctaUrl = payload.meta?.ctaUrl;

    if (channel === "email") {
      const to = client.email;
      if (!to) return { ok: false, error: ERROR.MISSING_EMAIL.code };
      const subject = `[${storeName}] Suite à votre achat`;
      const html = renderRelansiaEmail({
        storeName,
        message: payload.message,
        ctaUrl,
        footerNote: "Besoin d’aide ? Répondez directement à cet email.",
      });
      return await sendEmail({ to, subject, html });
    }

    if (channel === "sms") {
      const to = client.phone;
      if (!to) return { ok: false, error: ERROR.MISSING_PHONE.code };
      return await sendSMS({ to, body: payload.message });
    }

    if (channel === "whatsapp") {
      const to = client.phone;
      if (!to) return { ok: false, error: ERROR.MISSING_PHONE.code };
      return await sendWhatsApp({ to, body: payload.message });
    }

    return { ok: false, error: "unknown_channel" };
  } catch (e: any) {
    return { ok: false, error: toErrorInfo(e).message || "provider_error" };
  }
}
