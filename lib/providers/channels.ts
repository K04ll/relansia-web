import type {
  Channel,
  SendPayload,
  ProviderResult,
  ProviderErr,
  EmailPayload,
  SmsPayload,
  WhatsappPayload,
} from "./types";

const nowISO = () => new Date().toISOString();

/** Vérifie que le channel demandé matche payload.channel */
function checkChannelMatch(channel: Channel, payload: SendPayload): ProviderErr | undefined {
  if (payload.channel !== channel) {
    return {
      ok: false,
      providerId: "router",
      at: nowISO(),
      code: "CHANNEL_PAYLOAD_MISMATCH",
      error: `got ${payload.channel}, expected ${channel}`,
      retryable: false,
    };
  }
  return undefined;
}

export async function sendViaProvider(
  channel: Channel,
  payload: SendPayload,
  _opts: Record<string, unknown> = {}
): Promise<ProviderResult> {
  const mismatch = checkChannelMatch(channel, payload);
  if (mismatch) return mismatch;

  try {
    switch (channel) {
      case "email": {
        const { sendEmail } = await import("./email");
        return await sendEmail(payload as EmailPayload);
      }
      case "sms": {
        const { sendSms } = await import("./sms");
        return await sendSms(payload as SmsPayload);
      }
      case "whatsapp": {
        const { sendWhatsapp } = await import("./whatsapp");
        return await sendWhatsapp(payload as WhatsappPayload);
      }
      default: {
        return {
          ok: false,
          providerId: "router",
          at: nowISO(),
          code: "UNKNOWN_CHANNEL",
          error: `unknown channel: ${String(channel)}`,
          retryable: false,
        };
      }
    }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; status?: number } | undefined;

    const code = String(err?.code ?? (err?.status ? `HTTP_${err.status}` : "PROVIDER_DISPATCH_ERROR"));
    const message = String(err?.message ?? e);
    const retryable = err?.status === 429 || err?.code === "ETIMEDOUT";

    return {
      ok: false,
      providerId: "router",
      at: nowISO(),
      code,
      error: message,
      retryable,
    };
  }
}
