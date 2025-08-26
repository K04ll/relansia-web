"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mapping = {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
};

export type OnboardingState = {
  filename: string | null;
  mapping: Mapping | null;
  sample: Record<string, any>[]; // les 20 premières lignes
  setImport: (payload: { filename: string; mapping: Mapping; sample: Record<string, any>[] }) => void;
  reset: () => void;
};

// Persistance optionnelle (décommente persist(...) si tu veux garder entre refresh)
// export const useOnboardingStore = create<OnboardingState>()(persist(
//   (set) => ({
//     filename: null,
//     mapping: null,
//     sample: [],
//     setImport: ({ filename, mapping, sample }) => set({ filename, mapping, sample }),
//     reset: () => set({ filename: null, mapping: null, sample: [] }),
//   }),
//   { name: "relansia-onboarding" }
// ));

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  filename: null,
  mapping: null,
  sample: [],
  setImport: ({ filename, mapping, sample }) => set({ filename, mapping, sample }),
  reset: () => set({ filename: null, mapping: null, sample: [] }),
}));
