// lib/providers/types.ts

export type Channel = "email" | "sms" | "whatsapp";

export type ReminderStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "canceled";

export type Client = {
  id: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  unsubscribed?: boolean | null;
  created_at?: string;
};

export type Reminder = {
  id?: string;
  user_id: string;
  client_id: string;
  rule_id?: string | null;
  channel: Channel;
  message: string | null;
  status: ReminderStatus;
  scheduled_at: string;
  sent_at?: string | null;
  retry_count: number;
  next_attempt_at: string;
  last_attempt_at?: string | null;
  last_error_code?: string | null;
  last_error?: string | null;
  created_at?: string;
};

/* ======================================================
   ➕ Types Provider : Ok / Err / Result
   ====================================================== */

/** Réponse succès */
export type ProviderOk = {
  ok: true;
  providerId: string;
  at: string;          // timestamp ISO quand l’envoi a eu lieu
  messageId?: string;  // identifiant provider (optionnel)
};

/** Réponse erreur */
export type ProviderErr = {
  ok: false;
  providerId: string;
  at: string;          // timestamp ISO même si erreur
  code: string;
  message: string;
  retryable?: boolean;
};

/** Union utilisée partout */
export type ProviderResult = ProviderOk | ProviderErr;

/* ======================================================
   ➕ Payloads d’envoi (utilisés dans channels.ts)
   ====================================================== */

export type BasePayload = {
  reminderId: string;
  clientId: string;
};

export type EmailPayload = BasePayload & {
  channel: "email";
  to: string;
  from?: string;
  subject?: string;
  text: string;
  html?: string;
};

export type SmsPayload = BasePayload & {
  channel: "sms";
  toE164: string;
  body: string;
};

export type WhatsappPayload = BasePayload & {
  channel: "whatsapp";
  toE164: string;
  body: string;
  mediaUrl?: string;
};

export type SendPayload = EmailPayload | SmsPayload | WhatsappPayload;
