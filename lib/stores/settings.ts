"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Settings = {
  shop_name?: string | null;
  default_channel?: "email" | "sms" | "whatsapp";
  default_country?: string;
  send_start_hour?: number;
  send_end_hour?: number;
  signature?: string | null;
};

type S = {
  settings: Settings | null;
  load: () => Promise<void>;
  setSettings: (p: Partial<Settings>) => void;
  save: () => Promise<void>;
};

export const useSettingsStore = create<S>()(
  persist(
    (set, get) => ({
      settings: null,
      load: async () => {
        const res = await fetch("/api/settings");
        const data = await res.json();
        set({ settings: data });
      },
      setSettings: (p) => set((s) => ({ settings: { ...(s.settings ?? {}), ...p } })),
      save: async () => {
        const { settings } = get();
        await fetch("/api/settings", { method: "POST", body: JSON.stringify(settings) });
      },
    }),
    { name: "relansia-settings" }
  )
);
