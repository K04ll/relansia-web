// lib/types.ts
export type Channel = "email" | "sms" | "whatsapp";
export type ReminderStatus = "draft" | "scheduled" | "sent" | "failed" | "canceled";

export type Client = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  product: string;
  quantity: string;
  purchased_at: string; // ISO 8601
};

export type Reminder = {
  id: string;
  clientEmail: string;
  clientName?: string;
  phone?: string;
  product: string;
  delayDays: number;
  channel: Channel;
  scheduledAt: string; // ISO 8601
  message: string;
  status: ReminderStatus;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
  sentAt?: string | null;
};
