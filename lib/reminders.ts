// lib/reminders.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Client, Reminder, ReminderStatus, Channel } from "@/lib/types";
import type { SendPayload } from "@/lib/providers/types";
import { addDaysISO, isValidEmail, normalizeE164 } from "@/lib/validators";
import { sendViaProvider } from "@/lib/providers/channels";
import { useSettings } from "@/lib/settings";
import { supabase } from "@/lib/supabase";

type RemindersState = {
  reminders: Reminder[];

  addReminder: (
    r: Omit<Reminder, "id" | "createdAt" | "updatedAt" | "status"> & {
      status?: ReminderStatus;
    }
  ) => Reminder;
  updateStatus: (id: string, status: ReminderStatus) => void;
  removeReminder: (id: string) => void;
  simulateSend: (id: string) => void;
  createFromClient: (
    client: Client,
    opts: {
      product?: string;
      delayDays: number;
      channel: Channel;
      message: string;
    }
  ) => Reminder;
  trySendNow: (id: string) => Promise<void>;

  addAndSaveReminder: (
    client: Client,
    data: {
      product: string;
      delayDays: number;
      channel: Channel;
      scheduledAt: string;
      message: string;
    }
  ) => Promise<Reminder | null>;

  loadFromDB: () => Promise<void>;
};

export const useReminders = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (payload) => {
        const now = new Date().toISOString();
        const r: Reminder = {
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
          status: payload.status ?? "scheduled",
          ...payload,
        };
        set((s) => ({ reminders: [r, ...s.reminders] }));
        return r;
      },

      updateStatus: (id, status) =>
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
          ),
        })),

      removeReminder: (id) =>
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

      simulateSend: (id) =>
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "sent",
                  sentAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      createFromClient: (client, opts) => {
        const base = client.purchased_at || new Date().toISOString();
        const scheduledAt = addDaysISO(base, opts.delayDays);
        const r: Reminder = {
          id: nanoid(),
          clientEmail: client.email ?? undefined,
          clientName: `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim(),
          phone: client.phone ?? undefined,
          product: opts.product ?? client.product ?? undefined,
          delayDays: opts.delayDays,
          channel: opts.channel,
          scheduledAt,
          message: opts.message,
          status: "scheduled",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sentAt: null,
        };
        set((s) => ({ reminders: [r, ...s.reminders] }));
        return r;
      },

      trySendNow: async (id) => {
        const r = get().reminders.find((x) => x.id === id);
        if (!r) return;

        const { defaultCountry } = useSettings.getState().settings;

        // validations
        if (r.channel === "email" && (!r.clientEmail || !isValidEmail(r.clientEmail))) {
          get().updateStatus(id, "failed");
          return;
        }
        if (r.channel === "sms" || r.channel === "whatsapp") {
          const e164 = normalizeE164(r.phone ?? undefined, defaultCountry as any);
          if (!e164) {
            get().updateStatus(id, "failed");
            return;
          }
        }

        // construire payload propre
        const payload: SendPayload =
          r.channel === "email"
            ? {
                channel: "email",
                to: r.clientEmail!,
                subject: "Votre rappel",
                message: r.message,
              }
            : r.channel === "sms"
            ? {
                channel: "sms",
                to: normalizeE164(r.phone ?? undefined, defaultCountry as any)!,
                message: r.message,
              }
            : {
                channel: "whatsapp",
                to: normalizeE164(r.phone ?? undefined, defaultCountry as any)!,
                message: r.message,
              };

        const res = await sendViaProvider(r.channel, payload);
        if (res.ok) {
          set((s) => ({
            reminders: s.reminders.map((x) =>
              x.id === id
                ? { ...x, status: "sent", sentAt: res.at, updatedAt: res.at }
                : x
            ),
          }));
        } else {
          get().updateStatus(id, "failed");
        }
      },

      addAndSaveReminder: async (client, data) => {
        const local = get().addReminder({
          clientEmail: client.email ?? undefined,
          clientName: `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim(),
          phone: client.phone ?? undefined,
          product: data.product,
          delayDays: data.delayDays,
          channel: data.channel,
          scheduledAt: data.scheduledAt,
          message: data.message,
        });

        try {
          const { data: upserted, error: upsertErr } = await supabase
            .from("clients")
            .upsert(
              {
                first_name: client.first_name ?? null,
                last_name: client.last_name ?? null,
                email: client.email,
                phone: client.phone ?? null,
                product: client.product ?? null,
                quantity: client.quantity ?? null,
                purchased_at: client.purchased_at
                  ? new Date(client.purchased_at).toISOString()
                  : null,
              },
              { onConflict: "email" }
            )
            .select("id")
            .single();

          if (upsertErr) throw upsertErr;

          const { error: remErr } = await supabase.from("reminders").insert({
            client_id: upserted!.id,
            product: data.product,
            delay_days: data.delayDays,
            channel: data.channel,
            scheduled_at: data.scheduledAt,
            message: data.message,
            status: "scheduled",
          });

          if (remErr) throw remErr;

          return local;
        } catch (e) {
          console.error("addAndSaveReminder error:", e);
          get().updateStatus(local.id, "failed");
          return null;
        }
      },

      loadFromDB: async () => {
        const { data, error } = await supabase
          .from("reminders")
          .select(
            "id, product, delay_days, channel, scheduled_at, message, status, created_at, clients(email, first_name, last_name, phone)"
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase load reminders error:", error.message);
          return;
        }

        const seen = new Set(get().reminders.map((r) => r.id));
        (data as any[])?.forEach((row) => {
          if (seen.has(row.id)) return;

          const nameFromFields = `${row.clients?.first_name ?? ""} ${
            row.clients?.last_name ?? ""
          }`.trim();
          const clientName =
            nameFromFields !== "" ? nameFromFields : row.clients?.email ?? "";

          get().addReminder({
            clientEmail: row.clients?.email ?? undefined,
            clientName,
            phone: row.clients?.phone ?? undefined,
            product: row.product ?? undefined,
            delayDays: row.delay_days,
            channel: row.channel,
            scheduledAt: row.scheduled_at,
            message: row.message,
            status: row.status,
          });

          seen.add(row.id);
        });
      },
    }),
    { name: "relansia-reminders" }
  )
);
