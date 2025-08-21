// lib/db.ts
import { supabase } from "./supabase";

export async function getSettings() {
  const { data, error } = await supabase.from("settings").select("*").single();
  if (error) {
    console.error("Erreur lecture settings:", error);
    return null;
  }
  return data;
}

export async function saveSettings(update: Partial<any>) {
  // vérifie si une ligne existe déjà
  const { data: existing } = await supabase.from("settings").select("id").single();

  if (existing) {
    const { data, error } = await supabase
      .from("settings")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Erreur update settings:", error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from("settings")
      .insert([{ ...update }])
      .select()
      .single();

    if (error) {
      console.error("Erreur insert settings:", error);
      return null;
    }
    return data;
  }
}
