import type { WhatsappPayload, ProviderResult } from "./types";

export async function sendWhatsapp(payload: WhatsappPayload): Promise<ProviderResult> {
  // Ton intégration WhatsApp Business API ici
  return {
    ok: true,
    providerId: "whatsapp",
    at: new Date().toISOString(),
    messageId: "whatsapp-fake-id",
  };
}
