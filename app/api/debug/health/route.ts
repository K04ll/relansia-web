import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || null;

    const ping = await supabaseServer.from("reminders").select("id").limit(1);
    const dbOk = !ping.error;

    return NextResponse.json({
      ok: true,
      env: {
        RESEND_API_KEY: hasResendKey ? "set" : "missing",
        EMAIL_FROM: emailFrom || "missing",
      },
      db: dbOk ? "ok" : `error: ${ping.error?.message}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
