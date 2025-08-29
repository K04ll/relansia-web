// lib/types.ts

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
  email: string | null;
  phone: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type Reminder = {
  id: string;
  user_id: string;
  client_id: string;
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
