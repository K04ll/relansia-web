// app/api/reminders/cancel/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";
import { nowISO } from "@/lib/logging";

export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    const { error } = await supabaseServer
      .from("reminders")
      .update({ status: "canceled", last_attempt_at: nowISO() })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "cancel error" }, { status: 500 });
  }
}
