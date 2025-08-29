// lib/types.ts

// --- Channels ---------------------------------------------------------------
export type Channel = "email" | "sms" | "whatsapp";

// --- Reminder status --------------------------------------------------------
export type ReminderStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "canceled";

// --- Client (UI + champs optionnels d'import/DB) ---------------------------
export type Client = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name?: string | null;
  last_name?: string | null;

  // facultatifs (présents côté import/DB si tu les utilises)
  product?: string | null;
  quantity?: number | null;
  purchased_at?: string | null; // ISO
};

// --- Reminder (forme utilisée côté UI/store) -------------------------------
export type Reminder = {
  id: string;

  // données “UI” (camelCase)
  clientEmail?: string;         // ex: "a@b.com"
  clientName?: string;          // ex: "Jane Doe"
  phone?: string | null;        // e164 ou null
  product?: string | null;
  delayDays: number;            // (DB: delay_days)
  channel: Channel;
  scheduledAt: string;          // ISO (DB: scheduled_at)
  message: string;

  status: ReminderStatus;

  // méta
  createdAt: string;            // ISO
  updatedAt: string;            // ISO
  sentAt?: string | null;       // ISO ou null
};
