import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { estimateDepletionDate } from "@/lib/scheduling";
import { getUserIdOrDev } from "@/lib/auth";

export async function GET() {
  try {
    const userId = getUserIdOrDev();

    const { data, error } = await supabaseServer
      .from("reminders")
      .select("*, clients:client_id(first_name,last_name,email,phone)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "reminders get error" }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json();

    const {
      client_email,
      client_id,
      product,
      delay_days = 0,
      channel,
      scheduled_at,
      message,
      status = "scheduled",
    } = body ?? {};

    if (!channel) {
      return NextResponse.json({ ok: false, error: "channel is required" }, { status: 400 });
    }

    // Résoudre le client DANS le même tenant
    let cid: string | null = client_id ?? null;
    let clientRow: any = null;

    if (!cid && client_email) {
      const { data, error } = await supabaseServer
        .from("clients")
        .select("id, email, product, quantity, purchased_at, first_name, last_name, phone")
        .eq("user_id", userId)
        .eq("email", String(client_email).toLowerCase())
        .limit(1)
        .single();

      if (error || !data) {
        return NextResponse.json({ ok: false, error: "client not found" }, { status: 400 });
      }
      cid = data.id;
      clientRow = data;
    }

    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "client_id or client_email is required" },
        { status: 400 }
      );
    }

    // Calcul de when si manquant
    let when: string | null = scheduled_at ?? null;
    if (!when) {
      if (!clientRow) {
        const { data } = await supabaseServer
          .from("clients")
          .select("product, quantity, purchased_at")
          .eq("user_id", userId)
          .eq("id", cid)
          .limit(1)
          .single();
        clientRow = data;
      }
      when = estimateDepletionDate({
        product: product ?? clientRow?.product,
        quantity: clientRow?.quantity,
        purchased_at: clientRow?.purchased_at,
        delay_days,
      });
    }

    if (!when) {
      return NextResponse.json(
        { ok: false, error: "scheduled_at could not be determined" },
        { status: 400 }
      );
    }

    const insertPayload = {
      user_id: userId,
      client_id: cid,
      product: product ?? clientRow?.product ?? null,
      delay_days: delay_days ?? 0,
      channel,
      scheduled_at: new Date(when).toISOString(),
      message: message ?? null,
      status,
    };

    const { data, error } = await supabaseServer
      .from("reminders")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, reminder: data });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ ok: false, error: err?.message ?? "Unexpected error" }, { status });
  }
}
