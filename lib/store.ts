// lib/store.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Client } from "@/lib/types";

type State = {
  clients: Client[];
  addClients: (rows: Client[]) => void;
  resetClients: () => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      clients: [],
      addClients: (rows) =>
        set((s) => {
          const byEmail = new Map<string, Client>();
          [...s.clients, ...rows].forEach((c) => {
            if (c?.email) byEmail.set(c.email, c);
          });
          return { clients: Array.from(byEmail.values()) };
        }),
      resetClients: () => set({ clients: [] }),
    }),
    { name: "relansia-clients" }
  )
);
