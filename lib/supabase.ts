// lib/supabase.ts (CLIENT — anon key only)
"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url || !anon) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY manquants (.env.local) — relance `npm run dev`.");
}

export const supabase = createClient(url, anon, { auth: { persistSession: true } });
