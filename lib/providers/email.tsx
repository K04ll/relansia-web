import type { EmailPayload, ProviderResult } from "./types";

export async function sendEmail(payload: EmailPayload): Promise<ProviderResult> {
  // Ici tu mettras ton intégration Resend, Sendgrid ou autre
  // Pour le moment on simule un succès :
  return {
    ok: true,
    providerId: "email",
    at: new Date().toISOString(),
    messageId: "email-fake-id",
  };
}
