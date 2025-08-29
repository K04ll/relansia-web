// lib/providers/types.ts

export type Channel = "email" | "sms" | "whatsapp";

/** Résultat succès d’un provider */
export type ProviderOk = {
  ok: true;
  providerId: string;       // ex: "resend" | "twilio" | "whatsapp"
  at: string;               // ISO date
  messageId?: string;
};

/** Résultat erreur d’un provider */
export type ProviderErr = {
  ok: false;
  providerId: string;       // ex: "router" quand c’est une erreur côté dispatch
  at: string;               // ISO date
  code: string;             // ex: "CHANNEL_PAYLOAD_MISMATCH"
  error: string;            // message lisible
  retryable: boolean;       // 429, timeout, etc.
};

/** Union de résultat provider */
export type ProviderResult = ProviderOk | ProviderErr;

/** Payloads */
export type EmailPayload = {
  channel: "email";
  to: string;
  subject?: string;
  message: string;
};

export type SmsPayload = {
  channel: "sms";
  to: string;      // e164
  message: string;
};

export type WhatsappPayload = {
  channel: "whatsapp";
  to: string;      // e164
  message: string;
};

/** Union d’entrée pour le routeur */
export type SendPayload = EmailPayload | SmsPayload | WhatsappPayload;
