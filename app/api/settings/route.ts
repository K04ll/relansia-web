import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";

/** GET /api/settings -> la ligne unique du tenant */
export async function GET() {
  try {
    const userId = getUserIdOrDev();
    const { data, error } = await supabaseServer
      .from("settings")
      .select("id, user_id, shop_name, default_channel, default_country, send_start_hour, send_end_hour, signature, created_at")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error; // pas de ligne
    return NextResponse.json(data ?? {});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "settings get error" }, { status: 500 });
  }
}

/** POST /api/settings -> upsert par (user_id) */
export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json();

    const payload = {
      user_id: userId,
      shop_name: body?.shop_name ?? null,
      default_channel: body?.default_channel ?? "email",
      default_country: body?.default_country ?? "FR",
      send_start_hour: Number.isFinite(body?.send_start_hour) ? body.send_start_hour : 9,
      send_end_hour: Number.isFinite(body?.send_end_hour) ? body.send_end_hour : 19,
      signature: body?.signature ?? null,
      // ❌ pas d'updated_at ici pour éviter l’erreur
    };

    const { data, error } = await supabaseServer
      .from("settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("id, user_id, shop_name, default_channel, default_country, send_start_hour, send_end_hour, signature, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "settings upsert error" }, { status: 500 });
  }
}
