// app/api/clients/list/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";

export async function GET() {
  try {
    const user_id = getUserIdOrDev();
    const { data, error } = await supabaseServer
      .from("clients")
      .select("id, email, phone, first_name, last_name, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw error;
    return NextResponse.json({ clients: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "list_error", clients: [] }, { status: 500 });
  }
}
