"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Reminder = {
  id?: string;
  client_id: string;
  product?: string | null;
  delay_days?: number | null;
  channel: "email" | "sms" | "whatsapp";
  scheduled_at: string;
  message?: string | null;
  status?: "scheduled" | "sent" | "draft" | "failed" | "canceled";
};

type S = {
  reminders: Reminder[];
  load: () => Promise<void>;
  add: (r: Partial<Reminder>) => Promise<Reminder | null>;
  patch: (id: string, p: Partial<Reminder>) => Promise<void>;
};

export const useRemindersStore = create<S>()(
  persist(
    (set) => ({
      reminders: [],
      load: async () => {
        const res = await fetch("/api/reminders");
        const data = await res.json();
        set({ reminders: data });
      },
      add: async (r) => {
        const res = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        if (!res.ok) return null;
        const data = await res.json();
        set((s) => ({ reminders: [data, ...s.reminders] }));
        return data;
      },
      patch: async (id, p) => {
        const res = await fetch("/api/reminders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...p }),
        });
        if (!res.ok) return;
        const updated = await res.json();
        set((s) => ({
          reminders: s.reminders.map((x) => (x.id === id ? updated : x)),
        }));
      },
    }),
    { name: "relansia-reminders" }
  )
);
