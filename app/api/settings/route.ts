// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";
import { settingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const userId = getUserIdOrDev();

    const { data, error } = await supabaseServer
      .from("settings")
      .select("user_id, store_name, sender_name, timezone, send_window, signature")
      .eq("user_id", userId)
      .single();

    // PGRST116 = "No rows found" → on renvoie {} (pas une erreur)
    if (error && (error as any).code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json(data ?? {});
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "settings get error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json();

    // Validation Zod
    const parsed = settingsSchema.parse(body);
    const payload = { user_id: userId, ...parsed };

    // Upsert par user_id
    const { data, error } = await supabaseServer
      .from("settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("user_id, store_name, sender_name, timezone, send_window, signature")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    const msg =
      e?.issues?.[0]?.message || // message Zod
      e?.message ||
      "settings upsert error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
