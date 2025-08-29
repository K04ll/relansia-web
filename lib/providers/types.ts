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
   ➕ Ajout des types manquants pour channels.ts
   ====================================================== */

export type ProviderResult =
  | {
      ok: true;
      providerId: string;
      messageId?: string;
    }
  | {
      ok: false;
      providerId: string;
      code: string;
      message: string;
      retryable?: boolean;
    };

export type BasePayload = {
  reminderId: string;
  clientId: string;
};

/** Email */
export type EmailPayload = BasePayload & {
  channel: "email";
  to: string;
  from?: string;
  subject?: string;
  text: string;
  html?: string;
};

/** SMS */
export type SmsPayload = BasePayload & {
  channel: "sms";
  toE164: string;
  body: string;
};

/** WhatsApp */
export type WhatsappPayload = BasePayload & {
  channel: "whatsapp";
  toE164: string;
  body: string;
  mediaUrl?: string;
};

/** Union finale utilisée par lib/providers/channels.ts */
export type SendPayload = EmailPayload | SmsPayload | WhatsappPayload;
