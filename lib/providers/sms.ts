import type { SmsPayload, ProviderResult } from "./types";

export async function sendSms(payload: SmsPayload): Promise<ProviderResult> {
  // Ton intégration Twilio ou autre SMS provider ici
  return {
    ok: true,
    providerId: "sms",
    at: new Date().toISOString(),
    messageId: "sms-fake-id",
  };
}
