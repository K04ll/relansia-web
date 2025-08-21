// lib/settings.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Channel } from "@/lib/types";

export type Settings = {
  shopName: string;
  signature: string;            // ajouté aux messages
  defaultChannel: Channel;      // email | sms | whatsapp
  defaultCountry: "FR" | "US" | "ES" | "DE" | "IT" | string; // pour E.164
  sendWindow: { startHour: number; endHour: number }; // 9..20
};

type SettingsState = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
};

const DEFAULTS: Settings = {
  shopName: "Votre boutique",
  signature: "— L’équipe du magasin",
  defaultChannel: "email",
  defaultCountry: "FR",
  sendWindow: { startHour: 9, endHour: 20 },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      update: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set({ settings: DEFAULTS }),
    }),
    { name: "relansia-settings" }
  )
);
